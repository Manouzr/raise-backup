"""Source de données DROUOT — secours quand le quota eBay est épuisé.

Interroge la recherche publique de drouot.com (endpoint SvelteKit `__data.json`,
format « devalue » dédupliqué) et renvoie un payload de monitoring dans EXACTEMENT
la même forme que /api/monitor eBay (lots au format LotEvent + edge + belowMarket,
cote = médiane des estimations des commissaires-priseurs).
"""

import time
from datetime import datetime, timezone

import requests

from market import summarize_prices

SEARCH_URL = "https://drouot.com/fr/s/__data.json"
LOT_DETAIL_URL = "https://api.drouot.com/drouot/gingolem/neoGingo/lot/{id}?lang=fr"
IMG_URL = "https://cdn.drouot.com/d/image/lot?size=ftall&path={path}"
LOT_URL = "https://www.drouot.com/l/{id}"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def _search(query, limit=80):
    """Résultats de recherche Drouot pour une requête (format devalue résolu)."""
    try:
        r = requests.get(
            SEARCH_URL,
            params={"query": query, "x-sveltekit-invalidated": "001"},
            headers={"User-Agent": UA, "Accept": "application/json"},
            timeout=20,
        )
        if r.status_code != 200:
            return []
        raw = r.json()
    except Exception:
        return []

    values = None
    for node in raw.get("nodes", []):
        if node.get("type") == "data" and isinstance(node.get("data"), list):
            values = node["data"]
            break
    if not values:
        return []

    def deref(i):
        # format devalue de SvelteKit : les valeurs se réfèrent par index ;
        # les entiers négatifs représentent undefined/null.
        if not isinstance(i, int):
            return i
        if i < 0:
            return None
        v = values[i]
        if isinstance(v, dict):
            return {k: deref(x) for k, x in v.items()}
        if isinstance(v, list):
            return [deref(x) for x in v]
        return v

    root = deref(0)
    lots = root.get("lots") if isinstance(root, dict) else None
    return lots[:limit] if isinstance(lots, list) else []


def _num(v):
    return float(v) if isinstance(v, (int, float)) and v > 0 else None


def _mid_estimate(lot):
    xs = [x for x in (_num(lot.get("lowEstim")), _num(lot.get("highEstim"))) if x]
    return sum(xs) / len(xs) if xs else None


def _price(lot):
    # prix courant = enchère en cours, sinon mise de départ, sinon basse estimation
    for k in ("currentBid", "nextBid", "lowEstim"):
        v = _num(lot.get(k))
        if v:
            return v
    return None


def _title(lot):
    desc = (lot.get("description") or "").strip()
    first = desc.split("\n")[0].strip()
    return (first[:120] or "Lot Drouot")


def _iso(ts):
    if not isinstance(ts, (int, float)) or ts <= 0:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _image(lot):
    photo = lot.get("photo")
    path = photo.get("path") if isinstance(photo, dict) else None
    return IMG_URL.format(path=path) if path else None


def _map_lot(lot, query, median, margin):
    price = _price(lot) or 0
    date = lot.get("date")
    closes = 0
    if isinstance(date, (int, float)) and date > 0:
        closes = max(0, int(date - time.time()))
    lo, hi = lot.get("lowEstim"), lot.get("highEstim")
    attrs = {}
    if _num(lo) and _num(hi):
        attrs["Estimation"] = f"€{int(lo)}–{int(hi)}"

    edge = -round((1 - price / median) * 100) if (median and median > 0 and price > 0) else None
    below = bool(median and price > 0 and price <= median * (1 - margin))
    lot_id = f"drouot-{lot.get('id')}"

    return {
        "id": lot_id,
        "ts": int(time.time() * 1000),
        "lotId": lot_id,
        "title": _title(lot),
        "platform": "drouot",
        "imageUrl": _image(lot),
        "itemWebUrl": LOT_URL.format(id=lot.get("id")),
        "currentBid": round(price),
        "currency": "EUR",
        "bidCount": int(lot.get("currentBid") and 0) or 0,
        "closesInSec": closes,
        "category": query,
        "seller": {"name": "Drouot", "kind": "maison", "sales": 0, "positivePct": None},
        "attributes": attrs or None,
        "edgePct": edge,
        "belowMarket": below,
    }


def monitor(query, margin=0.2, limit=80):
    """Payload de monitoring Drouot — même forme que /api/monitor eBay."""
    lots = _search(query, limit)
    mids = [m for m in (_mid_estimate(l) for l in lots) if m]
    stats = summarize_prices(mids)
    median = stats["median"] if stats else None
    max_bid = round(median * (1 - margin)) if median else None

    mapped = [_map_lot(l, query, median, margin) for l in lots]
    # on écarte les lots retirés / sans prix exploitable
    mapped = [m for m in mapped if m["currentBid"] > 0]

    return {
        "query": query,
        "median": median,
        "basis": "estimations Drouot",
        "dominantCategory": "Drouot · ventes à venir",
        "sampleSize": len(mids),
        "reliableRange": [stats["p25"], stats["p75"]] if stats else None,
        "low": stats["low"] if stats else None,
        "high": stats["high"] if stats else None,
        "maxProfitableBid": max_bid,
        "maxHours": 0,
        "count": len(mapped),
        "lots": mapped,
        "source": "drouot",
    }


def get_lot(lot_id):
    """Détail d'un lot Drouot (description complète) — pour l'analyse IA."""
    try:
        r = requests.get(
            LOT_DETAIL_URL.format(id=lot_id),
            headers={"User-Agent": UA, "Accept": "application/json"},
            timeout=15,
        )
        if r.status_code != 200:
            return None
        return (r.json() or {}).get("lot")
    except Exception:
        return None


def analyze(lot_id, median):
    """Verdict IA (Gemini) d'un lot Drouot, à partir de sa description riche.
    Compatible serverless : re-fetch du lot à la demande, pas de cache d'état."""
    from gemini_filter import analyze_lot as _analyze_lot

    lot = get_lot(lot_id)
    if not lot:
        return None
    price = _price(lot) or 0
    lo, hi = lot.get("lowEstim"), lot.get("highEstim")
    est = f" Estimation commissaire-priseur : {int(lo)}–{int(hi)} €." if (_num(lo) and _num(hi)) else ""
    pseudo = {
        "itemId": f"drouot-{lot_id}",
        "title": _title(lot),
        "condition": "Vente aux enchères Drouot (maison de vente)",
        "description": (lot.get("description") or "") + est,
        "price": {"value": price},
    }
    return _analyze_lot(pseudo, median, "EUR")

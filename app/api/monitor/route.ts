import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { parseMonitorParams } from "@/lib/monitor";
import { serviceBaseUrl } from "@/lib/platforms/ebay";

// GET /api/monitor?q=<type>&margin=  — monitore UN type de produit sur DROUOT :
// ventes à venir + cote = médiane des estimations des commissaires-priseurs.
// Le service Flask produit déjà le payload complet (mêmes champs que l'UI) —
// on le relaie tel quel. Plus aucune source eBay.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyPayload(q: string) {
  return {
    query: q,
    median: null,
    basis: "estimations Drouot",
    dominantCategory: "Drouot",
    sampleSize: 0,
    reliableRange: null,
    low: null,
    high: null,
    maxProfitableBid: null,
    maxHours: 0,
    count: 0,
    lots: [],
    source: "drouot",
  };
}

export async function GET(req: Request): Promise<Response> {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: { code: "missing_query", message: "?q= requis" } }, { status: 422 });
  const { margin } = parseMonitorParams(url);

  try {
    const res = await fetch(`${serviceBaseUrl()}/drouot/monitor?q=${encodeURIComponent(q)}&margin=${margin}`, {
      cache: "no-store",
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    // service injoignable → payload vide, l'UI dégrade proprement
  }
  return NextResponse.json(emptyPayload(q));
}

// Helpers d'affichage — chiffres toujours en JetBrains Mono côté UI.

/** 58 → "0:58" · 1450 → "24:10" · 4320 → "1:12:00" */
export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function euro(n: number): string {
  return `€${Math.round(n)}`;
}

/** edge vs médiane de la cote : edgeOf(95, 280) → -66 */
export function edgeOf(value: number, median: number): number {
  return -Math.round((1 - value / median) * 100);
}

/** -62 → "−62%" (vrai signe moins, comme le proto) */
export function fmtEdge(pct: number): string {
  if (pct === 0) return "à la cote";
  const sign = pct < 0 ? "−" : "+";
  return `${sign}${Math.abs(Math.round(pct))}%`;
}

/** secondes depuis la dernière enchère → "à l'instant" / "il y a 12 s" */
export function fmtLastBid(secAgo: number): string {
  return secAgo <= 1 ? "à l'instant" : `il y a ${secAgo} s`;
}

export function platformLabel(p: "ebay" | "catawiki" | "drouot"): string {
  return p === "ebay" ? "eBay" : p === "catawiki" ? "Catawiki" : "Drouot";
}

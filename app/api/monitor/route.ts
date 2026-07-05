import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { getMonitorData, parseMonitorParams } from "@/lib/monitor";
import { serviceBaseUrl } from "@/lib/platforms/ebay";

// GET /api/monitor?q=<type>&margin=&max_hours=&source=  — monitore UN type de
// produit. source=ebay (défaut) : enchères eBay filtrées + cote Gemini.
// source=drouot : ventes Drouot à venir + cote = médiane des estimations
// (secours quand le quota eBay est épuisé). Même forme de payload.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: { code: "missing_query", message: "?q= requis" } }, { status: 422 });
  const { margin, maxHours } = parseMonitorParams(url);

  if (url.searchParams.get("source") === "drouot") {
    // le service Flask produit déjà le payload complet — on relaie tel quel
    try {
      const res = await fetch(`${serviceBaseUrl()}/drouot/monitor?q=${encodeURIComponent(q)}&margin=${margin}`, {
        cache: "no-store",
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // service injoignable → payload vide, l'UI dégrade proprement
    }
    return NextResponse.json({
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
    });
  }

  return NextResponse.json(await getMonitorData(q, margin, maxHours));
}

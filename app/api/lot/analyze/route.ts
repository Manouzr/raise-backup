import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { getEbayAdapter } from "@/lib/platforms";
import { serviceBaseUrl } from "@/lib/platforms/ebay";

// GET /api/lot/analyze?itemId=&median= — verdict IA du CONTEXTE d'un lot
// (état réel, red flags, prix max conseillé). Pré-filtre respecté : l'UI ne
// demande l'analyse que pour les lots déjà sous la cote (worth_bidding).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const itemId = (url.searchParams.get("itemId") ?? "").trim();
  if (!itemId) {
    return NextResponse.json({ error: { code: "missing_item", message: "?itemId= requis" } }, { status: 422 });
  }
  const medianRaw = Number(url.searchParams.get("median"));
  const median = Number.isFinite(medianRaw) && medianRaw > 0 ? medianRaw : null;

  // lot Drouot (id "drouot-<n>") → analyse IA via le service Drouot (Gemini sur
  // la description), pas via l'API eBay.
  if (itemId.startsWith("drouot-")) {
    const drouotId = itemId.slice("drouot-".length);
    try {
      const res = await fetch(
        `${serviceBaseUrl()}/drouot/lot/analyze?id=${encodeURIComponent(drouotId)}${median != null ? `&median=${median}` : ""}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { verdict: unknown };
        return NextResponse.json({ itemId, verdict: data.verdict });
      }
    } catch {
      // service injoignable
    }
    return NextResponse.json(
      { error: { code: "analysis_unavailable", message: "Analyse Drouot indisponible" } },
      { status: 503 },
    );
  }

  const verdict = await getEbayAdapter().analyzeLot(itemId, median);
  if (!verdict) {
    return NextResponse.json(
      { error: { code: "analysis_unavailable", message: "Analysis unavailable — check the Gemini key and the eBay service" } },
      { status: 503 },
    );
  }
  return NextResponse.json({ itemId, verdict });
}

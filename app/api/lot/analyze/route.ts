import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { serviceBaseUrl } from "@/lib/platforms/ebay";

// GET /api/lot/analyze?itemId=&median= — verdict IA du CONTEXTE d'un lot Drouot
// (état réel, red flags, prix max conseillé). L'IA lit la description riche du
// lot (fiche commissaire-priseur) via le service Flask (Gemini). Les itemId
// sont de la forme "drouot-<n>".

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

  // id nu attendu par le service (on retire le préfixe "drouot-")
  const drouotId = itemId.startsWith("drouot-") ? itemId.slice("drouot-".length) : itemId;

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

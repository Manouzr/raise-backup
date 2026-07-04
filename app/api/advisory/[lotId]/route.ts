import { NextResponse } from "next/server";
import { getEngine } from "@/lib/simulator/engine";

// GET /api/advisory/[lotId]?ceiling=210 — recalcule le BidAdvisory à chaque
// appel (le client re-fetch à l'ouverture de l'overlay et après chaque
// surenchère). `learnsFrom` n'est PAS rempli ici : le journal vit en
// localStorage, c'est lib/taste côté client qui le fusionne.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lotId: string }> },
): Promise<Response> {
  const { lotId } = await params;
  const url = new URL(req.url);
  const ceilingRaw = Number(url.searchParams.get("ceiling"));
  const ceiling = Number.isFinite(ceilingRaw) && ceilingRaw > 0 ? Math.round(ceilingRaw) : undefined;

  const advisory = getEngine().advisoryFor(lotId, ceiling);
  if (!advisory) {
    return NextResponse.json({ error: { code: "unknown_lot", message: "Lot inconnu" } }, { status: 404 });
  }
  return NextResponse.json(advisory);
}

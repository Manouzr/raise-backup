import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/platforms";
import { getEngine } from "@/lib/simulator/engine";

// POST /api/bid { lotId, amount } — la SEULE écriture du système.
// Délègue à l'adapter de la plateforme du lot (MockAdapter en v0 : latence
// 300–600 ms puis succès). Toujours déclenchée par un tap humain côté client ;
// le serveur n'initie jamais rien.

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "invalid_body", message: "Body JSON attendu" } }, { status: 422 });
  }

  const { lotId, amount } = (body ?? {}) as { lotId?: unknown; amount?: unknown };
  if (typeof lotId !== "string" || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "{ lotId: string, amount: number } attendu" } },
      { status: 422 },
    );
  }

  const engine = getEngine();
  const found = engine.getLot(lotId);
  if (!found) {
    return NextResponse.json({ error: { code: "unknown_lot", message: "Lot inconnu" } }, { status: 404 });
  }

  const adapter = getAdapter(found.lot.platform);
  const res = await adapter.placeBid(lotId, Math.round(amount));

  if (!res.ok) {
    return NextResponse.json(
      {
        error: {
          code: "bid_rejected",
          message: `Enchère refusée — l'enchère courante est à €${res.newCurrentBid}`,
        },
        newCurrentBid: res.newCurrentBid,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, newCurrentBid: res.newCurrentBid, youAreLeading: true });
}

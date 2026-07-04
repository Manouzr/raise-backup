import type { FeedEvent } from "@/lib/contracts";
import { getEngine } from "@/lib/simulator/engine";

// GET /api/feed — flux SSE du simulateur.
// À la connexion : event `snapshot` (état complet du radar), puis `lot` +
// `meta` toutes les ~1 s pour le lot chaud, `outbid` à la surenchère adverse,
// `closed` à 0:00, `scan` pour la progression des scans, `ping` en keep-alive.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

function sse(ev: FeedEvent): Uint8Array {
  return encoder.encode(`event: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`);
}

export async function GET(req: Request): Promise<Response> {
  const engine = getEngine();

  let unsubscribe: (() => void) | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        if (pingTimer) clearInterval(pingTimer);
        try {
          controller.close();
        } catch {
          // déjà fermé
        }
      };

      const safeSend = (ev: FeedEvent) => {
        if (closed) return;
        try {
          controller.enqueue(sse(ev));
        } catch {
          cleanup();
        }
      };

      // reconnexion auto rapide (wifi de venue pourri)
      controller.enqueue(encoder.encode("retry: 2000\n\n"));

      // s'abonner AVANT le snapshot : c'est subscribe() qui remet la démo à
      // zéro si la vente est finie depuis > 30 s — le snapshot doit refléter
      // l'état d'après reset.
      unsubscribe = engine.subscribe(safeSend);
      safeSend({ type: "snapshot", data: engine.snapshot() });
      pingTimer = setInterval(() => safeSend({ type: "ping", data: { t: Date.now() } }), 15_000);

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      unsubscribe?.();
      if (pingTimer) clearInterval(pingTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

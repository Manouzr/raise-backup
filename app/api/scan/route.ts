import type { ScanProgress } from "@/lib/contracts";
import { getEngine } from "@/lib/simulator/engine";

// GET /api/scan?category=ram-ddr5&label=RAM%20DDR5 — SSE court qui suit un
// scan de catégorie : events `scan` (étapes ventes passées → recherche live →
// calibration) puis un dernier event `scan` avec step "done" + la cote.
// GET car EventSource ne supporte que GET. Idempotent : re-suivre un scan
// déjà fini renvoie immédiatement l'état "done".

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

function sse(data: ScanProgress): Uint8Array {
  return encoder.encode(`event: scan\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const category = (url.searchParams.get("category") ?? "").trim();
  if (!category) {
    return new Response(JSON.stringify({ error: { code: "missing_category", message: "?category= requis" } }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }
  const label = (url.searchParams.get("label") ?? category).trim();

  const engine = getEngine();
  engine.startScan(category, label);

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // déjà fermé
        }
      };

      controller.enqueue(encoder.encode("retry: 2000\n\n"));

      const current = engine.getScan(category);
      if (current) {
        controller.enqueue(sse(current));
        if (current.step === "done") {
          cleanup();
          return;
        }
      }

      unsubscribe = engine.subscribe((ev) => {
        if (closed || ev.type !== "scan" || ev.data.category !== category.toLowerCase()) return;
        try {
          controller.enqueue(sse(ev.data));
        } catch {
          cleanup();
          return;
        }
        if (ev.data.step === "done") cleanup();
      });

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      unsubscribe?.();
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

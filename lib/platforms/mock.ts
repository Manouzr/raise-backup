import type { LotEvent } from "@/lib/contracts";
import { getEngine } from "@/lib/simulator/engine";
import type { PlatformAdapter } from "./adapter";

// Adapter mocké, alimenté par le simulateur en mémoire.
// Latence simulée sur placeBid : 300–600 ms, puis succès.

export class MockAdapter implements PlatformAdapter {
  constructor(public readonly id: PlatformAdapter["id"]) {}

  async searchListings(category: string): Promise<LotEvent[]> {
    const snap = getEngine().snapshot();
    const all = [snap.hot, snap.upcoming, ...snap.watch, ...snap.finds];
    return all.filter((l) => l.platform === this.id && (category === "" || l.category === category));
  }

  async getPastSales(category: string): Promise<{ title: string; soldPrice: number; date: string }[]> {
    const snap = getEngine().snapshot();
    const seen = new Set<string>();
    const sales: { title: string; soldPrice: number; date: string }[] = [];
    for (const [lotId, detail] of Object.entries(snap.details)) {
      const lot = [snap.hot, snap.upcoming, ...snap.watch, ...snap.finds].find((l) => l.lotId === lotId);
      if (category !== "" && lot?.category !== category) continue;
      for (const c of detail.comparables) {
        const key = `${c.title}-${c.date}`;
        if (seen.has(key)) continue;
        seen.add(key);
        sales.push({ title: c.title, soldPrice: c.soldPrice, date: c.date });
      }
    }
    return sales;
  }

  subscribeLot(lotId: string, cb: (e: LotEvent) => void): () => void {
    return getEngine().subscribe((ev) => {
      if (ev.type === "lot" && ev.data.lotId === lotId) cb(ev.data);
    });
  }

  async placeBid(lotId: string, amount: number): Promise<{ ok: boolean; newCurrentBid: number }> {
    // Latence réseau simulée : 300–600 ms.
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));
    const res = getEngine().placeUserBid(lotId, amount);
    if (res.ok) return { ok: true, newCurrentBid: res.newCurrentBid };
    const lot = getEngine().getLot(lotId);
    return { ok: false, newCurrentBid: lot?.lot.currentBid ?? amount };
  }
}

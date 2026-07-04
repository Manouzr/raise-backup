import type { LotEvent } from "@/lib/contracts";

// Interface unique de la couche plateformes. Aujourd'hui : MockAdapter.
// Post-hackathon : brancher eBay/Catawiki/Drouot = implémenter cette
// interface, sans toucher ni aux routes API ni à l'UI.

export interface PlatformAdapter {
  id: "ebay" | "catawiki" | "drouot";
  searchListings(category: string): Promise<LotEvent[]>;
  getPastSales(category: string): Promise<{ title: string; soldPrice: number; date: string }[]>;
  subscribeLot(lotId: string, cb: (e: LotEvent) => void): () => void;
  /**
   * Place UNE enchère. Toujours appelée depuis un geste utilisateur
   * (POST /api/bid ← tap) — aucun appel automatique, nulle part.
   */
  placeBid(lotId: string, amount: number): Promise<{ ok: boolean; newCurrentBid: number }>;
}

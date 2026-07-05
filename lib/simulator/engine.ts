import type {
  BidAdvisory,
  FeedEvent,
  FeedSnapshot,
  HotMeta,
  LotDetail,
  LotEvent,
  ScanProgress,
} from "@/lib/contracts";
import {
  BID_INCREMENT,
  DEFAULT_CEILING,
  FIND_IDS,
  HOT_BAND,
  HOT_DURATION_SEC,
  HOT_LOT_ID,
  STATIC_LOTS,
  UPCOMING_DURATION_SEC,
  UPCOMING_LOT_ID,
  WATCH_IDS,
  edgePct,
} from "./data";

// Simulateur live — tout en mémoire côté serveur, un singleton partagé par
// toutes les connexions SSE. Dramaturgie du prototype :
//  · lot chaud Seiko à €95, ferme en 58 s, 6 enchérisseurs ;
//  · l'utilisateur enchérit → il mène ; 5 s plus tard, UNE surenchère adverse
//    (+€5) → "Surenchéri" + nouvelle suggestion ; s'il répond, plus de contre ;
//  · à 0:00 la vente finit (panneau "Enchère terminée" côté client).
// Aucune enchère n'est jamais initiée ici : placeUserBid n'est appelé que par
// POST /api/bid, lui-même déclenché par un tap humain.

type Listener = (ev: FeedEvent) => void;

type HotState = {
  currentBid: number;
  bidCount: number;
  closesInSec: number;
  lastBidSecAgo: number;
  leader: "user" | "other" | null;
  outbid: boolean;
  counterFired: boolean;
  /** ticks écoulés depuis la dernière enchère utilisateur (pour la contre à +5 s) */
  sinceUserBid: number;
  phase: "live" | "ended";
  finalBid: number | null;
  userWasLeading: boolean;
  endedAt: number | null;
  startPrice: number;
};

type ScanState = ScanProgress & { ratePerSec: number };

const START_PRICE = 40; // prix de départ affiché dans "Enchère terminée"

class SimEngine {
  private hot: HotState = SimEngine.freshHot();
  private upcomingClosesIn = UPCOMING_DURATION_SEC;
  private scans = new Map<string, ScanState>();
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastEmptyAt: number | null = Date.now();

  constructor() {
    // Le scan RAM du proto démarre à 34 % et avance de 0,9 %/s.
    this.scans.set("ram-ddr5", {
      category: "ram-ddr5",
      label: "RAM DDR5 / composants",
      pct: 34,
      step: "live-search",
      pastSalesCount: 214,
      band: null,
      ratePerSec: 0.9,
    });
  }

  private static freshHot(): HotState {
    return {
      currentBid: STATIC_LOTS[HOT_LOT_ID].lot.currentBid,
      bidCount: STATIC_LOTS[HOT_LOT_ID].lot.bidCount,
      closesInSec: HOT_DURATION_SEC,
      lastBidSecAgo: 12,
      leader: null,
      outbid: false,
      counterFired: false,
      sinceUserBid: 0,
      phase: "live",
      finalBid: null,
      userWasLeading: false,
      endedAt: null,
      startPrice: START_PRICE,
    };
  }

  // ————————————————————————— cycle de vie —————————————————————————

  subscribe(cb: Listener): () => void {
    // Démo toujours fraîche : si la vente est finie depuis > 30 s, ou si
    // personne ne regardait depuis > 2 min, on repart au début.
    // staleEnded exige AUSSI que personne ne regarde depuis > 5 s : sinon une
    // reconnexion wifi (retry 2 s), un 2e onglet ou un scan de catégorie
    // réinitialiserait la démo pendant que l'utilisateur est encore devant
    // le panneau « Enchère terminée », avant qu'il ait déclaré son résultat.
    const now = Date.now();
    const emptySince = this.listeners.size === 0 && this.lastEmptyAt !== null ? now - this.lastEmptyAt : 0;
    const staleEnded =
      emptySince > 5_000 &&
      this.hot.phase === "ended" &&
      this.hot.endedAt !== null &&
      now - this.hot.endedAt > 30_000;
    const staleIdle = emptySince > 120_000;
    if (staleEnded || staleIdle) this.reset();

    this.listeners.add(cb);
    this.lastEmptyAt = null;
    this.ensureLoop();
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) {
        this.lastEmptyAt = Date.now();
        this.stopLoop();
      }
    };
  }

  reset(): void {
    this.hot = SimEngine.freshHot();
    this.upcomingClosesIn = UPCOMING_DURATION_SEC;
    const ram = this.scans.get("ram-ddr5");
    if (ram && ram.pct >= 100) {
      // la cote RAM reste établie une fois le scan fini — pas de retour arrière
    }
  }

  private ensureLoop(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private stopLoop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private emit(ev: FeedEvent): void {
    for (const cb of this.listeners) {
      try {
        cb(ev);
      } catch {
        // un flux fermé ne doit pas casser les autres
      }
    }
  }

  // ————————————————————————— tick 1 s —————————————————————————

  private tick(): void {
    const h = this.hot;
    if (h.phase === "live") {
      h.closesInSec = Math.max(0, h.closesInSec - 1);
      h.lastBidSecAgo = Math.min(h.lastBidSecAgo + 1, 99);

      if (h.leader === "user") {
        h.sinceUserBid++;
        // UNE seule surenchère adverse, 5 s après la première enchère du user,
        // jamais dans les 8 dernières secondes.
        if (!h.counterFired && h.sinceUserBid >= 5 && h.closesInSec > 8) {
          h.counterFired = true;
          h.leader = "other";
          h.outbid = true;
          h.currentBid += BID_INCREMENT;
          h.bidCount++;
          h.lastBidSecAgo = 0;
          this.emit({ type: "outbid", data: { lotId: HOT_LOT_ID, newCurrentBid: h.currentBid } });
        }
      }

      if (h.closesInSec <= 0) {
        h.phase = "ended";
        h.finalBid = h.currentBid;
        h.userWasLeading = h.leader === "user";
        h.endedAt = Date.now();
        this.emit({
          type: "closed",
          data: { lotId: HOT_LOT_ID, finalBid: h.finalBid, userWasLeading: h.userWasLeading },
        });
      }

      this.emit({ type: "lot", data: this.hotLotEvent() });
      this.emit({ type: "meta", data: this.hotMeta() });
    }

    if (this.upcomingClosesIn > 0) this.upcomingClosesIn--;
    else this.upcomingClosesIn = UPCOMING_DURATION_SEC; // un autre kit RAM prend la suite
    this.emit({ type: "lot", data: this.upcomingLotEvent() });

    for (const scan of this.scans.values()) {
      if (scan.pct < 100) {
        scan.pct = Math.min(100, scan.pct + scan.ratePerSec);
        if (scan.pct < 35) scan.step = "past-sales";
        else if (scan.pct < 75) scan.step = "live-search";
        else if (scan.pct < 100) scan.step = "calibration";
        if (scan.pct >= 100) {
          scan.step = "done";
          scan.band = scan.band ?? SimEngine.bandFor(scan.category);
        }
        this.emit({ type: "scan", data: this.scanProgress(scan) });
      }
    }
  }

  private static bandFor(category: string): ScanProgress["band"] {
    if (category === "ram-ddr5") {
      return { low: 120, median: 140, high: 160, salesCount: 214, sources: ["eBay", "Catawiki"] };
    }
    // cote générée pour les catégories ajoutées à la volée (mock)
    const seed = Array.from(category).reduce((a, c) => a + c.charCodeAt(0), 0);
    const median = 80 + (seed % 12) * 35;
    return {
      low: Math.round(median * 0.7),
      median,
      high: Math.round(median * 1.45),
      salesCount: 40 + (seed % 90),
      sources: ["eBay", "Catawiki"],
    };
  }

  // ————————————————————————— lectures —————————————————————————

  private hotLotEvent(): LotEvent {
    const base = STATIC_LOTS[HOT_LOT_ID].lot;
    return {
      ...base,
      id: `${HOT_LOT_ID}-${Date.now()}`,
      ts: Date.now(),
      currentBid: this.hot.currentBid,
      bidCount: this.hot.bidCount,
      closesInSec: this.hot.closesInSec,
    };
  }

  private upcomingLotEvent(): LotEvent {
    const base = STATIC_LOTS[UPCOMING_LOT_ID].lot;
    return {
      ...base,
      id: `${UPCOMING_LOT_ID}-${Date.now()}`,
      ts: Date.now(),
      closesInSec: this.upcomingClosesIn,
    };
  }

  private hotMeta(): HotMeta {
    const h = this.hot;
    return {
      lotId: HOT_LOT_ID,
      phase: h.phase,
      leader: h.leader,
      outbid: h.outbid && h.leader !== "user",
      lastBidSecAgo: h.lastBidSecAgo,
      finalBid: h.finalBid,
      userWasLeading: h.userWasLeading,
      startPrice: h.startPrice,
    };
  }

  private scanProgress(s: ScanState): ScanProgress {
    const { ratePerSec: _rate, ...progress } = s;
    return { ...progress, pct: Math.round(s.pct) };
  }

  snapshot(): FeedSnapshot {
    const details: Record<string, LotDetail> = {};
    for (const [id, def] of Object.entries(STATIC_LOTS)) details[id] = def.detail;

    const toEvent = (id: string): LotEvent => ({
      ...STATIC_LOTS[id].lot,
      id: `${id}-${Date.now()}`,
      ts: Date.now(),
    });

    return {
      serverTime: Date.now(),
      hot: this.hotLotEvent(),
      hotMeta: this.hotMeta(),
      upcoming: { ...toEvent(UPCOMING_LOT_ID), closesInSec: this.upcomingClosesIn },
      watch: WATCH_IDS.map(toEvent),
      finds: FIND_IDS.map(toEvent),
      details,
      scans: Array.from(this.scans.values()).map((s) => this.scanProgress(s)),
    };
  }

  getLot(lotId: string): { lot: LotEvent; detail: LotDetail } | null {
    if (lotId === HOT_LOT_ID) {
      return { lot: this.hotLotEvent(), detail: STATIC_LOTS[HOT_LOT_ID].detail };
    }
    const def = STATIC_LOTS[lotId];
    if (!def) return null;
    return { lot: { ...def.lot, id: `${lotId}-${Date.now()}`, ts: Date.now() }, detail: def.detail };
  }

  advisoryFor(lotId: string, userCeiling: number = DEFAULT_CEILING): BidAdvisory | null {
    const found = this.getLot(lotId);
    if (!found) return null;
    const { lot, detail } = found;
    const suggestedBid = lot.currentBid + BID_INCREMENT;
    const band = lotId === HOT_LOT_ID ? HOT_BAND : detail.band;
    const edge = edgePct(suggestedBid, band.median);
    const edgeAbs = Math.abs(edge);

    const overCeiling = suggestedBid > userCeiling;
    let advisory: string;
    if (lotId === HOT_LOT_ID && this.hot.leader === "user") {
      advisory = `Tu es en tête à €${lot.currentBid}, très en dessous de la cote (€${band.low}–${band.high}). Ne relance pas contre toi-même — on attend.`;
    } else if (overCeiling) {
      advisory = `Le prochain pas est à €${suggestedBid}, au-dessus de ta limite €${userCeiling} — je ne conseille pas de suivre. Perdre au-dessus du plan, c'est gagner.`;
    } else if (lotId === HOT_LOT_ID && this.hot.outbid) {
      advisory = `À €${suggestedBid} tu restes ${edgeAbs}% sous la cote. Répondre reste largement rentable — à toi de voir.`;
    } else {
      advisory = `À €${suggestedBid} tu es ~${edgeAbs}% sous la cote (${band.salesCount} ventes, ${band.sources.length} sources). Même surenchéri jusqu'à €${userCeiling}, ça reste une bonne affaire. Je te repropose à chaque surenchère — c'est toi qui tapes.`;
    }

    return {
      lotId,
      suggestedBid,
      userCeiling,
      currency: "EUR",
      marketBand: band,
      edgePct: edge,
      comparables: detail.comparables,
      agentRead: detail.read,
      advisory,
      // learnsFrom est fusionné côté client (le journal vit en localStorage)
    };
  }

  /**
   * Enregistre une enchère HUMAINE. Uniquement appelée par POST /api/bid,
   * jamais par le moteur lui-même — c'est la règle produit.
   */
  placeUserBid(lotId: string, amount: number): { ok: true; newCurrentBid: number } | { ok: false; code: number; message: string } {
    if (lotId !== HOT_LOT_ID) {
      const def = STATIC_LOTS[lotId];
      if (!def) return { ok: false, code: 404, message: "Unknown lot" };
      return { ok: false, code: 409, message: "This lot isn't open for suggestions yet" };
    }
    const h = this.hot;
    if (h.phase !== "live") return { ok: false, code: 409, message: "This auction has ended" };
    if (amount <= h.currentBid) {
      return { ok: false, code: 409, message: `The current bid is already €${h.currentBid}` };
    }
    // Garde-fou serveur : le CTA ne propose jamais autre chose que le tick
    // suivant — toute requête au-delà (curl, client altéré) est refusée pour
    // protéger le simulateur partagé et la règle « jamais au-dessus du plan ».
    if (amount > h.currentBid + BID_INCREMENT) {
      return { ok: false, code: 409, message: `Enchère hors tick — maximum €${h.currentBid + BID_INCREMENT}` };
    }
    h.currentBid = amount;
    h.bidCount++;
    h.leader = "user";
    h.outbid = false;
    h.sinceUserBid = 0;
    h.lastBidSecAgo = 0;
    this.emit({ type: "lot", data: this.hotLotEvent() });
    this.emit({ type: "meta", data: this.hotMeta() });
    return { ok: true, newCurrentBid: amount };
  }

  /** Démarre (ou reprend) le scan d'une catégorie ajoutée par l'utilisateur. */
  startScan(category: string, label: string): ScanProgress {
    const key = category.trim().toLowerCase();
    let scan = this.scans.get(key);
    if (!scan) {
      scan = {
        category: key,
        label,
        pct: 0,
        step: "past-sales",
        pastSalesCount: 60 + (Array.from(key).reduce((a, c) => a + c.charCodeAt(0), 0) % 160),
        band: null,
        ratePerSec: 12, // scan express (~8 s) pour les catégories ajoutées en live
      };
      this.scans.set(key, scan);
      this.ensureLoop();
    }
    return this.scanProgress(scan);
  }

  getScan(category: string): ScanProgress | null {
    const scan = this.scans.get(category.trim().toLowerCase());
    return scan ? this.scanProgress(scan) : null;
  }
}

// Singleton robuste au hot-reload de Next en dev.
const globalStore = globalThis as unknown as { __bidedgeEngine?: SimEngine };

export function getEngine(): SimEngine {
  if (!globalStore.__bidedgeEngine) globalStore.__bidedgeEngine = new SimEngine();
  return globalStore.__bidedgeEngine;
}

export type { SimEngine };

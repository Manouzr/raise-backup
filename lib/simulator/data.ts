import type { LotDetail, LotEvent, MarketBand } from "@/lib/contracts";

// Données mock — port fidèle du prototype "BidEdge App v2.dc.html".
// Tous les visuels sont des dégradés CSS (comme le proto).

export const HOT_LOT_ID = "seiko-6139";
export const UPCOMING_LOT_ID = "ram-ddr5-64";
export const HOT_DURATION_SEC = 58;
export const UPCOMING_DURATION_SEC = 220; // 3:40
export const BID_INCREMENT = 5;
export const DEFAULT_CEILING = 210;

export const HOT_BAND: MarketBand = {
  low: 240,
  median: 280,
  high: 320,
  salesCount: 124,
  sources: ["eBay", "Catawiki", "Drouot"],
};

type StaticLot = {
  lot: Omit<LotEvent, "id" | "ts">;
  detail: LotDetail;
};

const g = {
  watchDark: "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.18),transparent 46%),linear-gradient(140deg,#353b44,#101318)",
  omega: "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.16),transparent 46%),linear-gradient(140deg,#4a3f33,#171310)",
  gpu: "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.12),transparent 46%),linear-gradient(140deg,#2e2b3d,#131020)",
  ram: "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.12),transparent 46%),linear-gradient(140deg,#1c3a2a,#0c1710)",
  skx: "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.14),transparent 46%),linear-gradient(140deg,#39404d,#12151b)",
  s6105: "linear-gradient(140deg,#39404d,#12151b)",
  rtx3090: "linear-gradient(140deg,#2e2b3d,#131020)",
  ddr5ecc: "linear-gradient(140deg,#1c3a2a,#0c1710)",
};

export const STATIC_LOTS: Record<string, StaticLot> = {
  [HOT_LOT_ID]: {
    lot: {
      lotId: HOT_LOT_ID,
      title: "Seiko 6139 chrono 1972",
      platform: "ebay",
      currentBid: 95,
      currency: "EUR",
      bidCount: 6,
      closesInSec: HOT_DURATION_SEC,
      category: "montres-seiko-vintage",
      seller: { name: "TokyoTimeShop", kind: "pro", sales: 1842, positivePct: 99.2, memberSince: "2016", location: "Osaka, JP" },
      attributes: { "État annoncé": "chrono automatique, cadran d'origine" },
    },
    detail: {
      gradient: g.watchDark,
      etat: "chrono automatique, cadran d'origine",
      read: { text: "annonce cohérente avec les photos", tone: "ok" },
      comparables: [
        { title: "6139-6002 cadran Pepsi", soldPrice: 290, source: "eBay", date: "05/26" },
        { title: "6139-6000 révisée", soldPrice: 340, source: "Catawiki", date: "04/26" },
        { title: "6139 cadran abîmé", soldPrice: 185, source: "eBay", date: "06/26" },
      ],
      band: HOT_BAND,
      categoryLabel: "Montres Seiko vintage",
      filterKey: "montres",
      sellerMeta: "membre depuis 2016 · Osaka, JP",
      sellerInitials: "TT",
      sellerTrust: { text: "fiable", tone: "ok" },
    },
  },
  [UPCOMING_LOT_ID]: {
    lot: {
      lotId: UPCOMING_LOT_ID,
      title: "Kit RAM DDR5 64 Go",
      platform: "ebay",
      currentBid: 88,
      currency: "EUR",
      bidCount: 3,
      closesInSec: UPCOMING_DURATION_SEC,
      category: "ram-ddr5",
      seller: { name: "hw-deals-fr", kind: "particulier", sales: 320, positivePct: 97.4, memberSince: "2020", location: "Lille, FR" },
      attributes: { "État annoncé": "2 × 32 Go 6000 MHz, testées" },
    },
    detail: {
      gradient: g.ram,
      etat: "2 × 32 Go 6000 MHz, testées",
      read: { text: "kit homogène, références identiques", tone: "ok" },
      comparables: [
        { title: "Kit 64 Go 6000 MHz", soldPrice: 145, source: "eBay", date: "06/26" },
        { title: "Kit 64 Go 5600 MHz", soldPrice: 128, source: "eBay", date: "05/26" },
        { title: "Kit 64 Go, sans dissipateur", soldPrice: 112, source: "Catawiki", date: "05/26" },
      ],
      band: { low: 120, median: 135, high: 160, salesCount: 214, sources: ["eBay", "Catawiki"] },
      categoryLabel: "RAM DDR5 / composants",
      filterKey: "ram",
      sellerMeta: "membre depuis 2020 · Lille, FR",
      sellerInitials: "HD",
      sellerTrust: { text: "fiable", tone: "ok" },
    },
  },
  omega: {
    lot: {
      lotId: "omega",
      title: "Omega Seamaster 1968",
      platform: "catawiki",
      currentBid: 410,
      currency: "EUR",
      bidCount: 9,
      closesInSec: 1450,
      category: "montres-vintage",
      seller: { name: "TokyoTimeShop", kind: "pro", sales: 1842, positivePct: 99.2, memberSince: "2016", location: "Osaka, JP" },
      attributes: { "État annoncé": "révisée 2024, boîte d'origine" },
    },
    detail: {
      gradient: g.omega,
      etat: "révisée 2024, boîte d'origine",
      read: { text: "annonce cohérente avec les photos", tone: "ok" },
      comparables: [
        { title: "Seamaster 1969, révisée", soldPrice: 520, source: "Catawiki", date: "05/26" },
        { title: "Seamaster 1968, cadran patiné", soldPrice: 455, source: "eBay", date: "04/26" },
        { title: "Seamaster 1967, non révisée", soldPrice: 390, source: "eBay", date: "06/26" },
      ],
      band: { low: 455, median: 500, high: 545, salesCount: 42, sources: ["Catawiki", "eBay"] },
      categoryLabel: "Montres vintage",
      filterKey: "montres",
      sellerMeta: "membre depuis 2016 · Osaka, JP",
      sellerInitials: "TT",
      sellerTrust: { text: "fiable", tone: "ok" },
    },
  },
  rtx4090: {
    lot: {
      lotId: "rtx4090",
      title: "RTX 4090 Founders",
      platform: "ebay",
      currentBid: 520,
      currency: "EUR",
      bidCount: 12,
      closesInSec: 3062,
      category: "gpu",
      seller: { name: "gpu_farm_lyon", kind: "particulier", sales: 214, positivePct: 98.1, memberSince: "2021", location: "Lyon, FR" },
      attributes: { "État annoncé": "jamais minée, facture 2024" },
    },
    detail: {
      gradient: g.gpu,
      etat: "jamais minée, facture 2024",
      read: { text: "numéro de série visible sur les photos", tone: "ok" },
      comparables: [
        { title: "4090 Founders, sous garantie", soldPrice: 780, source: "eBay", date: "05/26" },
        { title: "4090 MSI Suprim", soldPrice: 690, source: "eBay", date: "04/26" },
        { title: "4090 Founders, boîte abîmée", soldPrice: 610, source: "Catawiki", date: "06/26" },
      ],
      band: { low: 690, median: 775, high: 860, salesCount: 89, sources: ["eBay", "Catawiki"] },
      categoryLabel: "GPU / cartes graphiques",
      filterKey: "gpu",
      sellerMeta: "membre depuis 2021 · Lyon, FR",
      sellerInitials: "GF",
      sellerTrust: { text: "fiable", tone: "ok" },
    },
  },
  ddr4: {
    lot: {
      lotId: "ddr4",
      title: "Lot 32 barrettes DDR4",
      platform: "catawiki",
      currentBid: 40,
      currency: "EUR",
      bidCount: 4,
      closesInSec: 510,
      category: "ram-ddr5",
      seller: { name: "server-parts-eu", kind: "pro", sales: 5210, positivePct: 99.6, memberSince: "2018", location: "Rotterdam, NL" },
      attributes: { "État annoncé": "32 × 8 Go ECC, testées" },
    },
    detail: {
      gradient: g.ram,
      etat: "32 × 8 Go ECC, testées",
      read: { text: "lot homogène, références identiques", tone: "ok" },
      comparables: [
        { title: "Lot 32 × 8 Go ECC", soldPrice: 55, source: "eBay", date: "06/26" },
        { title: "Lot 24 × 8 Go", soldPrice: 52, source: "eBay", date: "05/26" },
        { title: "Lot 32 × 4 Go", soldPrice: 48, source: "Catawiki", date: "05/26" },
      ],
      band: { low: 48, median: 53, high: 58, salesCount: 61, sources: ["eBay", "Catawiki"] },
      categoryLabel: "RAM DDR5 / composants",
      filterKey: "ram",
      sellerMeta: "membre depuis 2018 · Rotterdam, NL",
      sellerInitials: "SP",
      sellerTrust: { text: "fiable", tone: "ok" },
    },
  },
  skx: {
    lot: {
      lotId: "skx",
      title: "Seiko SKX007",
      platform: "drouot",
      currentBid: 120,
      currency: "EUR",
      bidCount: 5,
      closesInSec: 4320,
      category: "montres-seiko-vintage",
      seller: { name: "Étude Millon", kind: "maison", sales: 12400, positivePct: null, location: "Paris 9e" },
      attributes: { "État annoncé": "verre rayé, mouvement tourne" },
    },
    detail: {
      gradient: g.skx,
      etat: "verre rayé, mouvement tourne",
      read: { text: "photos limitées — demander le dos du boîtier", tone: "warn" },
      comparables: [
        { title: "SKX007, bracelet jubilé", soldPrice: 150, source: "eBay", date: "06/26" },
        { title: "SKX007, révisée", soldPrice: 160, source: "Catawiki", date: "05/26" },
        { title: "SKX009", soldPrice: 115, source: "eBay", date: "04/26" },
      ],
      band: { low: 110, median: 120, high: 160, salesCount: 57, sources: ["eBay", "Catawiki"] },
      categoryLabel: "Montres Seiko vintage",
      filterKey: "montres",
      sellerMeta: "Drouot · Paris 9e",
      sellerInitials: "É",
      sellerTrust: { text: "maison de vente", tone: "neutral" },
    },
  },
  s6105: {
    lot: {
      lotId: "s6105",
      title: "Seiko 6105 diver",
      platform: "ebay",
      currentBid: 150,
      currency: "EUR",
      bidCount: 2,
      closesInSec: 7440,
      category: "montres-seiko-vintage",
      seller: { name: "vintage.watch.attic", kind: "particulier", sales: 89, positivePct: 100, memberSince: "2019", location: "Nantes, FR" },
      attributes: { "État annoncé": "de grenier, non testée" },
    },
    detail: {
      gradient: g.s6105,
      etat: "de grenier, non testée",
      read: { text: "cadran original probable — fort potentiel", tone: "ok" },
      comparables: [
        { title: "6105-8110, révisée", soldPrice: 880, source: "Catawiki", date: "05/26" },
        { title: "6105-8000", soldPrice: 720, source: "eBay", date: "04/26" },
        { title: "6105, cadran repeint", soldPrice: 640, source: "eBay", date: "03/26" },
      ],
      band: { low: 600, median: 750, high: 900, salesCount: 33, sources: ["Catawiki", "eBay"] },
      categoryLabel: "Montres Seiko vintage",
      filterKey: "montres",
      sellerMeta: "membre depuis 2019 · Nantes, FR",
      sellerInitials: "VW",
      sellerTrust: { text: "peu de volume — vérifier", tone: "warn" },
      findSub: "départ €150 · cote €600–900",
    },
  },
  rtx3090: {
    lot: {
      lotId: "rtx3090",
      title: "RTX 3090 Ti",
      platform: "ebay",
      currentBid: 300,
      currency: "EUR",
      bidCount: 3,
      closesInSec: 12000,
      category: "gpu",
      seller: { name: "pc-builder-33", kind: "particulier", sales: 156, positivePct: 97.8, memberSince: "2020", location: "Bordeaux, FR" },
      attributes: { "État annoncé": "repâtée 2025, benchmarks fournis" },
    },
    detail: {
      gradient: g.rtx3090,
      etat: "repâtée 2025, benchmarks fournis",
      read: { text: "photos et benchs cohérents", tone: "ok" },
      comparables: [
        { title: "3090 Ti Founders", soldPrice: 620, source: "eBay", date: "05/26" },
        { title: "3090 Ti EVGA", soldPrice: 540, source: "eBay", date: "04/26" },
        { title: "3090 (non Ti)", soldPrice: 480, source: "Catawiki", date: "06/26" },
      ],
      band: { low: 480, median: 550, high: 620, salesCount: 47, sources: ["eBay", "Catawiki"] },
      categoryLabel: "GPU / cartes graphiques",
      filterKey: "gpu",
      sellerMeta: "membre depuis 2020 · Bordeaux, FR",
      sellerInitials: "PC",
      sellerTrust: { text: "fiable", tone: "ok" },
      findSub: "départ €300 · cote €480–620",
    },
  },
  ddr5ecc: {
    lot: {
      lotId: "ddr5ecc",
      title: "DDR5 128 Go ECC",
      platform: "ebay",
      currentBid: 60,
      currency: "EUR",
      bidCount: 1,
      closesInSec: 20700,
      category: "ram-ddr5",
      seller: { name: "datacenter-liquidation", kind: "pro", sales: 18220, positivePct: 99.1, memberSince: "2015", location: "Francfort, DE" },
      attributes: { "État annoncé": "sortie de serveur, garantie 30 j" },
    },
    detail: {
      gradient: g.ddr5ecc,
      etat: "sortie de serveur, garantie 30 j",
      read: { text: "liquidation classique — références vérifiées", tone: "ok" },
      comparables: [
        { title: "128 Go ECC RDIMM", soldPrice: 340, source: "eBay", date: "06/26" },
        { title: "128 Go ECC, kit 4×32", soldPrice: 310, source: "eBay", date: "05/26" },
        { title: "96 Go ECC", soldPrice: 250, source: "Catawiki", date: "04/26" },
      ],
      band: { low: 290, median: 320, high: 350, salesCount: 74, sources: ["eBay"] },
      categoryLabel: "RAM DDR5 / composants",
      filterKey: "ram",
      sellerMeta: "membre depuis 2015 · Francfort, DE",
      sellerInitials: "DC",
      sellerTrust: { text: "fiable", tone: "ok" },
      findSub: "départ €60 · cote €290–350",
    },
  },
};

export const WATCH_IDS = ["omega", "rtx4090", "ddr4", "skx"];
export const FIND_IDS = ["s6105", "rtx3090", "ddr5ecc"];

export const PLATFORM_LABEL: Record<LotEvent["platform"], string> = {
  ebay: "eBay",
  catawiki: "Catawiki",
  drouot: "Drouot",
};

/** edge vs médiane de la cote, ex. -62 */
export function edgePct(value: number, median: number): number {
  return -Math.round((1 - value / median) * 100);
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LotEvent } from "@/lib/contracts";
import { euro, fmtEdge, fmtTime } from "@/lib/format";
import type { PlanSummary } from "@/lib/platforms/ebay";
import { RiskBadge, confidencePct, finalMaxBid, useLotVerdict } from "@/components/LotAnalysis";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/provider";

// Radar — flux d'opportunités RÉELLES (Drouot, données live via /api/monitor).
// L'utilisateur monitore des « types de produits » (requêtes) : montres en
// exemple, et il peut en ajouter. Chaque lot montre son écart à la cote ; les
// lots sous la cote sont mis en avant. Aucune enchère n'est placée : on ouvre
// la fiche Drouot et l'humain enchérit lui-même (position produit permanente).
// Rafraîchissement : POLLING de /api/monitor (séquentiel, /60 s) — pas de SSE,
// qui time-out sur serverless (Vercel) et fait boucler l'EventSource.

type MonitorLot = LotEvent & { edgePct: number | null; belowMarket: boolean };

type MonitorResult = {
  query: string;
  median: number | null;
  basis: "sold_90d" | "active_listings" | null;
  dominantCategory: string | null;
  plan: PlanSummary | null;
  sampleSize: number;
  low: number | null;
  high: number | null;
  maxProfitableBid: number | null;
  maxHours: number;
  lots: MonitorLot[];
};


// une opportunité + la cote de son type (pour analyser l'IA en amont)
type OppRow = { lot: MonitorLot; type: string; median: number | null; maxProfitableBid: number | null };

const WINDOWS: { value: 6 | 24 | 72; labelKey: string }[] = [
  { value: 6, labelKey: "radar.windows.6h" },
  { value: 24, labelKey: "radar.windows.24h" },
  { value: 72, labelKey: "radar.windows.3d" },
];

// seuil d'alerte : lot au moins 30 % sous la cote
const ALERT_EDGE_PCT = -30;

export default function RadarPage() {
  const t = useT();
  const categories = useApp((s) => s.categories);
  const setCategories = useApp((s) => s.setCategories);
  const hydrated = useApp((s) => s.hydrated);
  const follow = useApp((s) => s.follow);
  const notify = useApp((s) => s.notify);

  const [results, setResults] = useState<Record<string, MonitorResult & { fetchedAt: number }>>({});
  // horloge locale : fait tourner les comptes à rebours à la seconde entre
  // deux rafraîchissements réseau (temps réel perçu)
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeType, setActiveType] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"edge" | "closing">("edge");
  const [newType, setNewType] = useState("");
  const [maxHours, setMaxHours] = useState<6 | 24 | 72>(24);
  const [alertsOn, setAlertsOn] = useState(true);
  const [selected, setSelected] = useState<
    { lot: MonitorLot; type: string; median: number | null; maxProfitableBid: number | null } | null
  >(null);
  const [oppLimit, setOppLimit] = useState(6);
  const [showRest, setShowRest] = useState(false);

  // flags hors rendu : alertes déjà émises, cloche
  const alertedIdsRef = useRef<Set<string>>(new Set());
  const alertsOnRef = useRef(true);

  const types = categories;

  useEffect(() => {
    alertsOnRef.current = alertsOn;
  }, [alertsOn]);

  // permission notifications navigateur (null = API absente)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | null>(null);

  // préférence cloche persistée (après montage — pas de mismatch SSR).
  // La cloche est ACTIVE par défaut → on demande la permission navigateur dès
  // l'arrivée, sinon elle n'est jamais demandée et aucune notification ne sort.
  useEffect(() => {
    let on = true;
    try {
      if (localStorage.getItem("bidedge.alertsOn") === "false") {
        setAlertsOn(false);
        on = false;
      }
    } catch {
      // localStorage indisponible — on reste sur le défaut
    }
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotifPerm(Notification.permission);
    if (on && Notification.permission === "default") {
      Notification.requestPermission()
        .then((p) => setNotifPerm(p))
        .catch(() => {});
    }
  }, []);

  // alerte les lots franchement sous la cote (une seule fois par lot)
  const maybeAlert = useCallback(
    (payload: MonitorResult) => {
      for (const lot of payload.lots) {
        if (lot.edgePct == null || lot.edgePct > ALERT_EDGE_PCT) continue;
        if (alertedIdsRef.current.has(lot.lotId)) continue;
        alertedIdsRef.current.add(lot.lotId);
        if (!alertsOnRef.current) continue;
        const short = lot.title.length > 52 ? `${lot.title.slice(0, 52).trimEnd()}…` : lot.title;
        const body = t("radar.notify.belowMarket", {
          title: short,
          price: euro(lot.currentBid),
          edge: fmtEdge(lot.edgePct),
        });
        notify(body);
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(t("radar.notify.belowMarketTitle"), { body });
          } catch {
            // constructeur indisponible (mobile) — le toast suffit
          }
        }
      }
    },
    [notify, t],
  );

  const fetchType = useCallback(
    async (type: string) => {
      setLoading((l) => ({ ...l, [type]: true }));
      try {
        const res = await fetch(`/api/monitor?q=${encodeURIComponent(type)}&max_hours=${maxHours}`);
        if (res.ok) {
          const data = (await res.json()) as MonitorResult;
          setResults((r) => ({ ...r, [type]: { ...data, fetchedAt: Date.now() } }));
          maybeAlert(data);
        }
      } catch {
        // service injoignable — on garde ce qu'on a
      } finally {
        setLoading((l) => ({ ...l, [type]: false }));
      }
    },
    [maxHours, maybeAlert],
  );

  // POLLING (pas de SSE) — sur serverless (Vercel) un flux SSE finit par
  // time-out, l'EventSource se reconnecte en boucle et martèle l'API eBay
  // (429) jusqu'à faire crasher l'onglet. On interroge donc /api/monitor
  // directement, EN SÉQUENCE (un type après l'autre, pas de rafale) et à
  // intervalle large pour rester sous les quotas eBay.
  useEffect(() => {
    if (!hydrated || types.length === 0) return;
    let cancelled = false;

    const runOnce = async (onlyMissing: boolean) => {
      for (const type of types) {
        if (cancelled) return;
        if (onlyMissing && results[type]) continue;
        await fetchType(type);
      }
    };

    void runOnce(true); // premier chargement : seulement les types sans données
    const iv = setInterval(() => void runOnce(false), 60_000); // rafraîchit tout /60 s

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, types.join("|"), maxHours, fetchType]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const changeWindow = (h: 6 | 24 | 72) => {
    if (h === maxHours) return;
    setMaxHours(h);
    setResults({}); // fenêtre différente = lots différents — on repart à zéro
  };

  // ouvre le détail d'un lot en emportant la cote Drouot de son type (médiane +
  // prix max) — le modal n'a plus besoin d'appeler l'API eBay pour l'analyser.
  const openLot = (lot: MonitorLot, type: string) => {
    const r = results[type];
    setSelected({ lot, type, median: r?.median ?? null, maxProfitableBid: r?.maxProfitableBid ?? null });
  };

  const toggleAlerts = () => {
    const next = !alertsOn;
    setAlertsOn(next);
    try {
      localStorage.setItem("bidedge.alertsOn", String(next));
    } catch {
      // localStorage indisponible — préférence non persistée
    }
    if (!next || typeof window === "undefined" || !("Notification" in window)) return;
    // à l'activation : permission + notification de TEST (preuve visible)
    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then((p) => {
          setNotifPerm(p);
          if (p === "granted") {
            try {
              new Notification("BidEdge", {
                body: t("radar.alerts.enabledBody", { n: Math.abs(ALERT_EDGE_PCT) }),
              });
            } catch {
              // constructeur indisponible — le toast suffit
            }
          } else if (p === "denied") {
            notify(t("radar.alerts.blockedNotify"));
          }
        })
        .catch(() => {});
    } else if (Notification.permission === "granted") {
      setNotifPerm("granted");
      try {
        new Notification("BidEdge", { body: t("radar.alerts.enabledShort") });
      } catch {
        // le toast suffit
      }
    } else {
      notify(t("radar.alerts.blockedNotify"));
    }
  };

  const addType = () => {
    const val = newType.trim();
    if (!val) {
      notify(t("radar.notify.nameType"));
      return;
    }
    if (types.some((x) => x.toLowerCase() === val.toLowerCase())) {
      notify(t("radar.notify.alreadyMonitored"));
      setNewType("");
      return;
    }
    setCategories([...types, val]);
    setNewType("");
    notify(t("radar.notify.monitoringStarted", { type: val }));
  };

  const removeType = (val: string) => {
    setCategories(types.filter((x) => x !== val));
    setResults((r) => {
      const n = { ...r };
      delete n[val];
      return n;
    });
    if (activeType === val) setActiveType(null);
  };

  // agrège les lots de tous les types (ou du type filtré)
  const shownTypes = activeType ? [activeType] : types;
  const allLots = useMemo(() => {
    const rows: { lot: MonitorLot; type: string }[] = [];
    for (const t of shownTypes) {
      const r = results[t];
      if (r) {
        const drift = Math.floor((now - r.fetchedAt) / 1000);
        for (const lot of r.lots) {
          rows.push({ lot: { ...lot, closesInSec: lot.closesInSec > 0 ? Math.max(0, lot.closesInSec - drift) : 0 }, type: t });
        }
      }
    }
    rows.sort((a, b) => {
      if (sortKey === "closing") return a.lot.closesInSec - b.lot.closesInSec;
      const ea = a.lot.edgePct ?? 0;
      const eb = b.lot.edgePct ?? 0;
      return ea - eb; // plus négatif (meilleur edge) d'abord
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, shownTypes.join("|"), sortKey, now]);

  const opportunities = allLots.filter((r) => r.lot.belowMarket);
  const anyLoading = shownTypes.some((t) => loading[t]);
  const activePlan = activeType ? (results[activeType]?.plan ?? null) : null;

  // opportunités enrichies de la cote de leur type — permet d'analyser l'IA
  // AVANT l'affichage (prix/risque sur la carte, sans attendre le clic)
  const oppRows: OppRow[] = opportunities.map(({ lot, type }) => {
    const rr = results[type];
    return { lot, type, median: rr?.median ?? null, maxProfitableBid: rr?.maxProfitableBid ?? null };
  });
  // héros : la meilleure affaire AVEC de l'activité (évite le lot à 1 € sans enchère)
  const hero = oppRows.find((o) => o.lot.bidCount >= 1) ?? oppRows[0] ?? null;
  const restOpps = hero ? oppRows.filter((o) => o.lot.lotId !== hero.lot.lotId) : oppRows;
  const restMarket = allLots.filter((r) => !r.lot.belowMarket);

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto bg-night px-8 py-[26px]">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="headline text-[34px] text-white">{t("radar.title")}</span>
        <span className="inline-flex items-center gap-[7px] rounded-full bg-accent/12 px-3 py-[5px] text-xs font-semibold text-accent-dark">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-dark" />
          {t("radar.liveBadge")}
        </span>
        <span className="flex-1" />
        {/* contrôles regroupés — discrets, pas des tuiles de dashboard */}
        <div className="flex items-center gap-2 text-[11.5px]">
          <div className="flex items-center rounded-full bg-night-elev p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                onClick={() => changeWindow(w.value)}
                title={t("radar.windowTooltip", { window: t(w.labelKey) })}
                className={`rounded-full px-2.5 py-1 font-mono font-semibold transition-colors ${
                  maxHours === w.value ? "bg-night-border2 text-white" : "text-night-dim hover:text-white"
                }`}
              >
                {t(w.labelKey)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortKey((k) => (k === "closing" ? "edge" : "closing"))}
            className="rounded-full bg-night-elev px-3 py-[7px] font-medium text-night-text transition-colors hover:bg-night-border"
          >
            {sortKey === "closing" ? t("radar.sort.closing") : t("radar.sort.edge")} ⇅
          </button>
          <button
            onClick={toggleAlerts}
            title={
              alertsOn
                ? notifPerm === "denied"
                  ? t("radar.alerts.blockedTitle")
                  : t("radar.alerts.onTitle")
                : t("radar.alerts.offTitle")
            }
            className={`flex items-center justify-center rounded-full p-2 transition-colors ${
              alertsOn
                ? notifPerm === "denied"
                  ? "bg-[rgba(227,69,58,0.12)] text-down"
                  : "bg-accent/12 text-accent-dark"
                : "bg-night-elev text-night-dim hover:text-white"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              {!alertsOn && <path d="M3 3l18 18" stroke="currentColor" />}
            </svg>
          </button>
        </div>
      </div>

      {/* sous-titre narratif — on guide, on ne mesure pas */}
      <div className="mt-1.5 text-[13.5px] text-night-text">
        {opportunities.length > 0 ? (
          <>
            {t("radar.subtitle.dealsPrefix")}{" "}
            <span className="font-semibold text-accent-dark">{opportunities.length}</span> {t("radar.subtitle.dealsSuffix")}
          </>
        ) : anyLoading ? (
          t("radar.subtitle.loading")
        ) : (
          t("radar.subtitle.watching")
        )}
      </div>

      {/* types monitorés + ajout */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveType(null)}
          className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeType === null ? "border-night-border2 bg-night-elev text-white" : "border-night-border bg-night-card text-night-text hover:bg-night-elev"
          }`}
        >
          {t("radar.chips.all")} · {types.length}
        </button>
        {types.map((type) => {
          const r = results[type];
          const active = activeType === type;
          const opps = r?.lots.filter((l) => l.belowMarket).length ?? 0;
          return (
            <span
              key={type}
              className={`group inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-3.5 pr-2 text-xs font-semibold transition-colors ${
                active ? "border-accent-dark/40 bg-accent/12 text-accent-dark" : "border-night-border bg-night-card text-night-text hover:bg-night-elev"
              }`}
            >
              <button onClick={() => setActiveType(active ? null : type)} className="flex items-center gap-1.5">
                {type}
                {opps > 0 && <span className="font-mono text-accent-dark">· {opps}</span>}
                {loading[type] && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-dark" />}
              </button>
              <button
                onClick={() => removeType(type)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-night-dim transition-colors hover:bg-night-elev hover:text-down"
                title={t("radar.chips.removeTitle")}
              >
                ×
              </button>
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-night-border2 bg-night-card py-1 pl-3 pr-1">
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addType();
            }}
            placeholder={t("radar.addPlaceholder")}
            className="w-[220px] bg-transparent text-xs text-white outline-none placeholder:text-night-dim"
          />
          <button
            onClick={addType}
            className="flex h-7 items-center rounded-full bg-accent-dark px-3 text-xs font-semibold text-night transition-colors hover:bg-accent-dark2"
          >
            {t("radar.addButton")}
          </button>
        </span>
      </div>

      {/* ce que Gemini a compris de la requête du type filtré */}
      {activePlan && (
        <div className="mt-2 text-[12px] text-night-dim">
          {t("radar.plan.understood", { query: activePlan.searchQuery ?? activeType ?? "" })}
          {activePlan.excludeKeywords && activePlan.excludeKeywords.length > 0 && (
            <>
              {" "}· {t("radar.plan.excluded", { list: activePlan.excludeKeywords.slice(0, 3).join(", ") })}
              {activePlan.excludeKeywords.length > 3 ? "…" : ""}
            </>
          )}
          {activePlan.maxPrice != null && (
            <>
              {" "}· {t("radar.plan.capLabel")} <span className="font-mono">€{Math.round(activePlan.maxPrice)}</span>
            </>
          )}
          {(activePlan.excludedAsParts ?? 0) > 0 && (
            <>
              {" "}· <span className="font-mono">{activePlan.excludedAsParts}</span> {t("radar.plan.partsExcluded")}
            </>
          )}
        </div>
      )}

      {/* rien à montrer encore */}
      {allLots.length === 0 && (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <div className="text-[15px] font-semibold text-white">
            {anyLoading ? t("radar.empty.scanningTitle") : t("radar.empty.noneTitle")}
          </div>
          <div className="max-w-[420px] text-[13px] text-night-text">
            {anyLoading ? t("radar.empty.scanningHint") : t("radar.empty.noneHint")}
          </div>
        </div>
      )}

      {/* aucune affaire mais des enchères existent */}
      {allLots.length > 0 && !hero && (
        <div className="mt-8 rounded-[24px] bg-night-elev px-6 py-8 text-center">
          <div className="text-[14px] font-semibold text-white">{t("radar.noDeals.title")}</div>
          <div className="mx-auto mt-1 max-w-[440px] text-[12.5px] leading-relaxed text-night-text">
            {t("radar.noDeals.body", { n: restMarket.length })}
          </div>
        </div>
      )}

      {/* ————— LE PARCOURS : la meilleure affaire, puis les suivantes ————— */}
      {hero && (
        <section className="mt-6">
          <div className="overline mb-3">{t("radar.section.bestNow")}</div>
          <HeroOpportunity row={hero} onOpen={() => openLot(hero.lot, hero.type)} onFollow={follow} />
        </section>
      )}

      {restOpps.length > 0 && (
        <section className="mt-8">
          <div className="overline mb-3">{t("radar.section.next")} · {restOpps.length}</div>
          <div className="flex flex-col gap-2.5">
            {restOpps.slice(0, oppLimit).map((row, i) => (
              <OpportunityRow
                key={row.lot.lotId}
                row={row}
                autoAnalyze={i < 4}
                index={i}
                onOpen={() => openLot(row.lot, row.type)}
              />
            ))}
          </div>
          {restOpps.length > oppLimit && (
            <button
              onClick={() => setOppLimit((n) => n + 8)}
              className="mt-3 rounded-full bg-night-elev px-4 py-2 text-[12.5px] font-semibold text-night-text transition-colors hover:bg-night-border"
            >
              {t("radar.section.showMore", { n: Math.min(8, restOpps.length - oppLimit) })} ↓
            </button>
          )}
        </section>
      )}

      {/* le marché au prix courant — replié, on ne noie pas le parcours */}
      {restMarket.length > 0 && (
        <section className="mt-8">
          <button
            onClick={() => setShowRest((v) => !v)}
            className="overline flex items-center gap-1.5 transition-colors hover:text-white"
          >
            {t("radar.section.rest")} · {restMarket.length}
            <span className="text-[10px]">{showRest ? "▲" : "▼"}</span>
          </button>
          {showRest && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {restMarket.map(({ lot, type }, i) => (
                <LotCard key={lot.lotId} lot={lot} index={i} onOpen={() => openLot(lot, type)} />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mb-1.5 mt-8 text-[11.5px] text-night-dim">
        {t("radar.footer")}
      </div>

      <AnimatePresence>
        {selected && (
          <AdvisoryModal
            lot={selected.lot}
            type={selected.type}
            median={selected.median}
            maxProfitableBid={selected.maxProfitableBid}
            onClose={() => setSelected(null)}
            onFollow={follow}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LotCard({ lot, index = 0, onOpen }: { lot: MonitorLot; index?: number; onOpen: () => void }) {
  const t = useT();
  const closingSoon = lot.closesInSec > 0 && lot.closesInSec <= 3600;
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ y: -2 }}
      style={{ animationDelay: `${Math.min(index, 11) * 0.06}s` }}
      className={`animate-rise flex flex-col gap-2 rounded-[21px] border bg-night-card p-3 text-left transition-colors ${
        lot.belowMarket ? "border-accent-dark" : "border-night-border hover:border-night-border2"
      }`}
    >
      <div className="relative h-[92px] overflow-hidden rounded-[11px] bg-night-elev">
        {lot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lot.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : null}
        {lot.belowMarket && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-accent-dark px-2 py-0.5 text-[10px] font-bold text-night">
            {t("radar.card.belowMarket")}
          </span>
        )}
      </div>
      <div className="line-clamp-2 min-h-[32px] text-[12.5px] font-semibold leading-[1.25] text-white">{lot.title}</div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-sm font-semibold text-white">{euro(lot.currentBid)}</span>
        {lot.edgePct != null && (
          <span
            className="font-mono text-[11px] font-semibold"
            style={{ color: lot.edgePct < 0 ? "#34d16c" : "#6f6f7a" }}
          >
            {fmtEdge(lot.edgePct)}
          </span>
        )}
      </div>
      <div className="flex justify-between text-[10.5px] text-night-dim">
        <span className="font-mono" style={{ color: closingSoon ? "#e3453a" : undefined }}>
          {lot.closesInSec > 0 ? fmtTime(lot.closesInSec) : "—"}
        </span>
        <span>{t("radar.card.bids", { n: lot.bidCount })}</span>
      </div>
    </motion.button>
  );
}

/* mini-viz : bande de cote — situe l'enchère actuelle par rapport à la cote
   médiane et au prix max conseillé. Le remplissage se dévoile de gauche à
   droite (scaleX 0→1), dans l'esprit du CoteSpark de la landing. */
function CoteBand({ currentBid, median, maxBid }: { currentBid: number; median: number | null; maxBid: number | null }) {
  const t = useT();
  if (median == null || median <= 0) return null;
  const scale = Math.max(median, currentBid, maxBid ?? 0) * 1.08;
  const pos = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  return (
    <div className="mt-3">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-night-elev">
        {/* remplissage : enchère actuelle */}
        <motion.div
          className="absolute inset-y-0 left-0 origin-left rounded-full bg-accent-dark/70"
          style={{ width: pos(currentBid) }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
        {/* repère prix max conseillé */}
        {maxBid != null && (
          <span className="absolute inset-y-0 w-0.5 rounded-full bg-accent-dark" style={{ left: pos(maxBid) }} />
        )}
        {/* repère cote médiane */}
        <span className="absolute inset-y-[-2px] w-px bg-white/70" style={{ left: pos(median) }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-night-dim">
        <span className="font-mono">{euro(currentBid)}</span>
        <span>{t("radar.band.market", { price: euro(median) })}</span>
      </div>
    </div>
  );
}

/* ————————————— HÉROS : la meilleure affaire, lue par l'IA en amont ————————————— */

function HeroOpportunity({ row, onOpen, onFollow }: { row: OppRow; onOpen: () => void; onFollow: (id: string) => void }) {
  const t = useT();
  const { lot, median, maxProfitableBid } = row;
  const guardrails = useApp((s) => s.guardrails);
  const { verdict, state, risk } = useLotVerdict(lot.lotId, median, true); // analysé d'emblée
  const maxBid = finalMaxBid(maxProfitableBid, verdict);
  const withinBudget = lot.currentBid <= guardrails.defaultCeiling;
  const closingSoon = lot.closesInSec > 0 && lot.closesInSec <= 3600;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex flex-col gap-5 rounded-[21px] border border-night-border bg-night-card p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:flex-row sm:p-6">
        {/* visuel */}
        <div className="relative h-[200px] w-full flex-none overflow-hidden rounded-[18px] bg-night-elev sm:h-[210px] sm:w-[280px]">
          {lot.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lot.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-accent-dark px-2.5 py-1 text-[11px] font-bold text-night">
            {lot.edgePct != null ? t("radar.market.edgeVsMarket", { edge: fmtEdge(lot.edgePct) }) : t("radar.hero.belowMarket")}
          </span>
        </div>

        {/* détail + décision */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="overline">{row.type}</span>
            <span className="flex-1" />
            {lot.closesInSec > 0 && (
              <span className="font-mono text-[15px] font-semibold" style={{ color: closingSoon ? "#e3453a" : "#ffffff" }}>
                {t("radar.hero.closesIn", { time: fmtTime(lot.closesInSec) })}
              </span>
            )}
          </div>

          <div className="headline mt-1 text-[22px] leading-tight text-white">{lot.title}</div>

          {/* l'IA a déjà lu l'annonce — état + risque AVANT le clic */}
          <div className="mt-1.5 min-h-[18px] text-[12.5px] text-night-text">
            {state === "loading" || state === "idle" ? (
              <span className="inline-flex items-center gap-1.5 text-night-dim">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-dark" />
                {t("radar.hero.aiReading")}
              </span>
            ) : verdict?.etatReel ? (
              <>
                {t("radar.hero.realConditionLabel")} <span className="font-semibold text-white">{verdict.etatReel}</span>
              </>
            ) : null}
          </div>

          {/* prix + risque */}
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <span>
              <span className="text-[10.5px] font-bold uppercase tracking-[.07em] text-night-dim">{t("radar.currentBidLabel")}</span>
              <br />
              <span className="font-mono text-[26px] font-semibold text-white">{euro(lot.currentBid)}</span>
            </span>
            {risk && <RiskBadge risk={risk} className="mb-1.5" />}
            <span
              className={`mb-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                withinBudget ? "bg-accent/12 text-accent-dark" : "bg-night-elev text-night-dim"
              }`}
            >
              {withinBudget ? (
                <>{t("radar.budget.within")} ·&nbsp;<span className="font-mono">€{guardrails.defaultCeiling}</span></>
              ) : (
                <>{t("radar.budget.over")}&nbsp;<span className="font-mono">€{guardrails.defaultCeiling}</span></>
              )}
            </span>
          </div>

          {/* cote + prix max (fusionné cote×marge / conseil IA) */}
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-night-text">
            {median != null && (
              <span>
                {t("radar.market.median")} <span className="font-mono font-semibold text-white">{euro(median)}</span>
              </span>
            )}
            {maxBid != null && (
              <span>
                {t("radar.market.maxPrice")} <span className="font-mono font-semibold text-accent-dark">{euro(maxBid)}</span>
              </span>
            )}
          </div>

          {/* bande de cote — situe l'enchère vs cote médiane / prix max */}
          {median != null && <CoteBand currentBid={lot.currentBid} median={median} maxBid={maxBid} />}

          {verdict?.resume && (
            <div className="mt-2.5 rounded-[14px] bg-night-elev px-3.5 py-2.5 text-[12.5px] leading-relaxed text-night-text">
              {verdict.resume}
            </div>
          )}

          {/* actions */}
          <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
            {lot.itemWebUrl && (
              <a
                href={lot.itemWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center rounded-full bg-accent-dark px-5 text-[13.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2"
              >
                {t("radar.actions.openEbay")} →
              </a>
            )}
            <button
              onClick={onOpen}
              className="flex h-11 items-center rounded-full bg-night-elev px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-night-border"
            >
              {t("radar.actions.viewDetail")}
            </button>
            <button
              onClick={() => onFollow(lot.lotId)}
              className="flex h-11 items-center rounded-full px-4 text-[13px] font-semibold text-night-dim transition-colors hover:text-white"
            >
              {t("radar.actions.follow")}
            </button>
            {risk === "eviter" && (
              <span className="text-[11px] font-semibold text-down">{t("radar.hero.aiAvoid")}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ————————————— FEED : opportunité en ligne, risque calculé en amont ————————————— */

function OpportunityRow({ row, autoAnalyze, index = 0, onOpen }: { row: OppRow; autoAnalyze: boolean; index?: number; onOpen: () => void }) {
  const t = useT();
  const { lot, median, maxProfitableBid } = row;
  const [asked, setAsked] = useState(false);
  const enabled = autoAnalyze || asked;
  const { verdict, state, risk } = useLotVerdict(lot.lotId, median, enabled);
  const maxBid = finalMaxBid(maxProfitableBid, verdict);
  const closingSoon = lot.closesInSec > 0 && lot.closesInSec <= 3600;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-4 rounded-[18px] border border-night-border bg-night-card p-3 transition-colors hover:border-night-border2"
    >
      {lot.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lot.imageUrl} alt="" loading="lazy" className="h-14 w-14 flex-none rounded-[12px] bg-night-elev object-cover" />
      ) : (
        <div className="h-14 w-14 flex-none rounded-[12px] bg-night-elev" />
      )}

      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[13px] font-semibold text-white">{lot.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-night-dim">
          <span className="font-mono" style={{ color: closingSoon ? "#e3453a" : undefined }}>
            {lot.closesInSec > 0 ? fmtTime(lot.closesInSec) : "—"}
          </span>
          <span>· {t("radar.card.bids", { n: lot.bidCount })}</span>
          {/* risque IA — visible avant le clic */}
          {enabled && (state === "loading" || state === "idle") && (
            <span className="inline-flex items-center gap-1">
              · <span className="h-1 w-1 animate-blink rounded-full bg-accent-dark" /> {t("radar.row.aiReading")}
            </span>
          )}
          {state === "done" && risk && (
            <>
              <span>·</span>
              <RiskBadge risk={risk} />
              {maxBid != null && (
                <span>
                  · {t("radar.row.maxLabel")} <span className="font-mono font-semibold text-accent-dark">{euro(maxBid)}</span>
                </span>
              )}
            </>
          )}
          {!enabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAsked(true);
              }}
              className="font-semibold text-night-dim transition-colors hover:text-accent-dark"
            >
              · {t("radar.row.analyze")}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-none flex-col items-end gap-0.5">
        <span className="font-mono text-[15px] font-semibold text-white">{euro(lot.currentBid)}</span>
        {lot.edgePct != null && (
          <span className="font-mono text-[11px] font-semibold text-accent-dark">{fmtEdge(lot.edgePct)}</span>
        )}
      </div>

      {lot.itemWebUrl && (
        <a
          href={lot.itemWebUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-none rounded-full bg-night-elev px-3 py-2 text-[11.5px] font-semibold text-accent-dark transition-colors hover:bg-night-border"
        >
          Drouot →
        </a>
      )}
    </motion.div>
  );
}

function AdvisoryModal({
  lot,
  type,
  median,
  maxProfitableBid,
  onClose,
  onFollow,
}: {
  lot: MonitorLot;
  type: string;
  median: number | null;
  maxProfitableBid: number | null;
  onClose: () => void;
  onFollow: (lotId: string) => void;
}) {
  const t = useT();
  const guardrails = useApp((s) => s.guardrails);

  // Lot Drouot : la cote (médiane des estimations des commissaires-priseurs) et
  // le pré-filtre « sous la cote » sont déjà calculés à la source. On lit
  // SYSTÉMATIQUEMENT l'annonce avec l'IA (Gemini sur la description de la fiche)
  // — l'utilisateur a ouvert le lot. Plus aucune dépendance à l'API eBay.
  const { verdict, state: verdictState, risk } = useLotVerdict(lot.lotId, median, true);
  const worth = lot.belowMarket;
  const withinBudget = lot.currentBid <= guardrails.defaultCeiling;
  const confPct = confidencePct(verdict);
  // prix max FINAL : le plus prudent entre marge sur cote et conseil IA
  const maxBid = finalMaxBid(maxProfitableBid, verdict);
  const aiAdjusted = maxBid != null && maxProfitableBid != null && maxBid < Math.round(maxProfitableBid);
  const estimation = lot.attributes?.["Estimation"] ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-[rgba(0,0,0,0.72)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative flex max-h-[92vh] w-[620px] max-w-[92vw] flex-col gap-4 overflow-y-auto rounded-[30px] border border-night-border bg-night-card p-[26px] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.22 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">Drouot · {type}</span>
          <span className="flex-1" />
          {lot.closesInSec > 0 && (
            <span className="font-mono text-lg font-semibold" style={{ color: lot.closesInSec <= 1800 ? "#e3453a" : "#ffffff" }}>
              {fmtTime(lot.closesInSec)}
            </span>
          )}
        </div>

        <div className="flex gap-4">
          <div className="h-[110px] w-[120px] flex-none overflow-hidden rounded-[14px] bg-night-elev">
            {lot.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lot.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="headline text-[17px] leading-snug text-white">{lot.title}</div>
            {/* le verdict IA fait partie du détail produit */}
            {verdict?.etatReel && (
              <div className="text-[12px] text-night-text">
                {t("radar.hero.realConditionLabel")} <span className="font-semibold text-white">{verdict.etatReel}</span>
              </div>
            )}
            <div className="flex items-end gap-3">
              <span>
                <span className="text-[10.5px] font-bold uppercase tracking-[.07em] text-night-dim">{t("radar.currentBidLabel")}</span>
                <br />
                <span className="font-mono text-[22px] font-semibold text-white">{euro(lot.currentBid)}</span>
              </span>
              {lot.edgePct != null && (
                <span
                  className="mb-1 inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-bold"
                  style={{
                    background: lot.edgePct < 0 ? "rgba(52,209,108,0.12)" : "#1a1a1f",
                    color: lot.edgePct < 0 ? "#34d16c" : "#a1a1aa",
                  }}
                >
                  {t("radar.market.edgeVsMarket", { edge: fmtEdge(lot.edgePct) })}
                </span>
              )}
              {risk && <RiskBadge risk={risk} className="mb-1" />}
            </div>
          </div>
        </div>

        {/* cote Drouot + décision */}
        <div
          className="rounded-[14px] border border-night-border p-4"
          style={{
            background: worth ? (risk === "eviter" ? "rgba(227,69,58,0.12)" : "rgba(52,209,108,0.12)") : "#1a1a1f",
          }}
        >
          {median != null ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[13.5px] font-semibold"
                  style={{ color: worth ? (risk === "eviter" ? "#e3453a" : "#34d16c") : "#ffffff" }}
                >
                  {worth
                    ? risk === "eviter"
                      ? t("radar.verdict.belowRisky")
                      : t("radar.verdict.belowMargin")
                    : t("radar.verdict.noMargin")}
                </span>
                <span className="inline-flex items-center rounded-full bg-night-card px-2 py-0.5 text-[10px] font-semibold text-night-dim">
                  {t("radar.modal.basisLabel")} {t("radar.basis.drouot")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                    withinBudget ? "bg-accent/12 text-accent-dark" : "bg-night-elev text-night-dim"
                  }`}
                >
                  {withinBudget ? (
                    <>
                      {t("radar.budget.within")} ·&nbsp;<span className="font-mono">€{guardrails.defaultCeiling}</span>
                    </>
                  ) : (
                    <>
                      {t("radar.budget.over")}&nbsp;<span className="font-mono">€{guardrails.defaultCeiling}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-[12.5px] text-night-text">
                <span>
                  {t("radar.market.median")} <span className="font-mono font-semibold text-white">{euro(median)}</span>
                </span>
                {estimation && (
                  <span className="text-night-dim">
                    {t("radar.market.rangeLabel")} <span className="font-mono">{estimation}</span>
                  </span>
                )}
                {maxBid != null && (
                  <span>
                    {t("radar.market.maxPrice")}{" "}
                    <span className="font-mono font-semibold text-accent-dark">{euro(maxBid)}</span>
                    {aiAdjusted && <span className="text-[11px] text-night-dim"> {t("radar.market.aiAdjusted")}</span>}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-night-text">
              {t("radar.modal.quoteUnavailable")}
            </div>
          )}
        </div>

        {/* lecture IA de l'annonce — lancée d'emblée : signaux + résumé */}
        <div className="rounded-[14px] bg-night-elev p-4">
          <div className="overline mb-2">{t("radar.modal.aiReadingTitle")}</div>
          {verdictState === "loading" || verdictState === "idle" ? (
            <div className="text-[13px] text-night-dim">{t("radar.modal.aiReadingLoading")}</div>
          ) : verdictState === "done" && verdict ? (
            <div className="flex flex-col gap-2">
              {verdict.redFlags.length > 0 ? (
                <ul className="flex flex-col gap-0.5 text-[12.5px] leading-relaxed text-warn">
                  {verdict.redFlags.map((flag, i) => (
                    <li key={i}>· {flag}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-[12.5px] text-accent-dark">{t("radar.modal.noRedFlags")}</div>
              )}
              {verdict.resume && <div className="text-[12.5px] leading-relaxed text-night-text">{verdict.resume}</div>}
              {confPct != null && (
                <div className="text-[11.5px] text-night-dim">
                  {t("radar.modal.confidenceLabel")} <span className="font-mono">{confPct}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[12.5px] text-night-dim">{t("radar.modal.aiUnavailable")}</div>
          )}
        </div>

        {/* actions — jamais d'enchère automatique */}
        <div className="flex items-center gap-3">
          {risk === "eviter" ? (
            <span className="text-[11px] font-semibold text-down">
              {t("radar.modal.aiAvoid")}
            </span>
          ) : (
            <span className="text-[11px] text-night-dim">{t("radar.modal.selfBid")}</span>
          )}
          <span className="flex-1" />
          <button
            onClick={() => {
              onFollow(lot.lotId);
              onClose();
            }}
            className="flex h-11 items-center rounded-full bg-night-elev px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-night-border"
          >
            {t("radar.actions.follow")}
          </button>
          {lot.itemWebUrl && (
            <a
              href={lot.itemWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center rounded-full bg-accent-dark px-5 text-[13.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2"
            >
              {t("radar.actions.openEbay")} →
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

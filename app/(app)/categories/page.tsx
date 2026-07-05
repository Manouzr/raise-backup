"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import type { LotEvent } from "@/lib/contracts";
import type { PlanSummary } from "@/lib/platforms/ebay";
import { euro, fmtEdge, fmtTime } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/provider";
import { CoteBand } from "@/components/CoteBand";
import { finalMaxBid, RiskBadge, useLotVerdict, VerdictBody } from "@/components/LotAnalysis";
import { MarketChart } from "@/components/MarketChart";
import { Reveal, WidgetChip } from "@/components/ui/taap";

// Catégories — la cote réelle de chaque type de produit monitoré (eBay).
// La liste est PARTAGÉE avec le radar (store.categories) : ajouter une
// catégorie ici lance son monitoring partout. Chaque panneau établit la
// cote (médiane + fourchette fiable), pointe les meilleures opportunités
// et fait lire chaque annonce par l'IA avant que tu n'enchérisses.

type MonitorLot = LotEvent & { edgePct: number | null; belowMarket: boolean };

type MonitorResult = {
  query: string;
  median: number | null;
  basis: "sold_90d" | "active_listings" | null;
  dominantCategory: string | null;
  sampleSize: number;
  reliableRange: [number, number] | null;
  low: number | null;
  high: number | null;
  maxProfitableBid: number | null;
  count: number;
  lots: MonitorLot[];
  /** plan de recherche Gemini — ce que le scan a compris de la demande */
  plan: PlanSummary | null;
  maxHours?: number;
};

// Clés i18n — résolues via t() au rendu (le libellé dépend de la locale).
const BASIS_LABEL: Record<string, string> = {
  sold_90d: "categories.basis.sold90d",
  active_listings: "categories.basis.activeListings",
};

/* ————————————————————————— surfaces « Nuit » —————————————————————————
   Mêmes arrondis que le kit clair (taap), mais tokens sombres — le kit
   partagé reste clair (utilisé aussi ailleurs), on redéfinit donc ici. */

function Panel({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[30px] border border-night-border bg-night-card ${className}`} {...rest}>
      {children}
    </div>
  );
}

function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[21px] border border-night-border bg-night-elev ${className}`} {...rest}>
      {children}
    </div>
  );
}

function PillButton({ className = "", children, ...rest }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center rounded-full bg-accent-dark font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2 ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export default function CategoriesPage() {
  const tr = useT();
  const hydrated = useApp((s) => s.hydrated);
  const categories = useApp((s) => s.categories);
  const setCategories = useApp((s) => s.setCategories);
  const notify = useApp((s) => s.notify);

  const [input, setInput] = useState("");
  const [results, setResults] = useState<Record<string, MonitorResult | "error">>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchType = useCallback(async (type: string) => {
    setLoading((l) => ({ ...l, [type]: true }));
    try {
      const res = await fetch(`/api/monitor?q=${encodeURIComponent(type)}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as MonitorResult;
      setResults((r) => ({ ...r, [type]: data }));
    } catch {
      setResults((r) => ({ ...r, [type]: "error" }));
    } finally {
      setLoading((l) => ({ ...l, [type]: false }));
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    for (const t of categories) if (!results[t]) fetchType(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, categories.join("|")]);

  const addCategory = () => {
    const t = input.trim();
    if (!t) {
      notify(tr("categories.notify.nameFirst"));
      return;
    }
    if (categories.some((c) => c.toLowerCase() === t.toLowerCase())) {
      notify(tr("categories.notify.already"));
      setInput("");
      return;
    }
    setCategories([...categories, t]);
    setInput("");
    notify(tr("categories.notify.scanStarted", { name: t }));
  };

  const removeCategory = (t: string) => {
    setCategories(categories.filter((c) => c !== t));
    setResults((r) => {
      const n = { ...r };
      delete n[t];
      return n;
    });
    notify(tr("categories.notify.removed", { name: t }));
  };

  // stat-chips du header — calculées sur les scans déjà arrivés
  const loaded = categories
    .map((t) => results[t])
    .filter((x): x is MonitorResult => !!x && x !== "error");
  const totalActive = loaded.reduce((s, r) => s + r.count, 0);
  const totalBelow = loaded.reduce((s, r) => s + r.lots.filter((l) => l.belowMarket).length, 0);

  return (
    <div className="flex-1 animate-rise overflow-y-auto bg-night px-8 py-8">
      {/* header : titre + stat-chips */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="headline text-[34px] text-white">{tr("categories.title")}</h1>
          <div className="mt-2 text-[13.5px] text-night-text">
            {tr("categories.subtitle")}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <StatChip
            n={categories.length}
            label={categories.length === 1 ? tr("categories.stat.category") : tr("categories.stat.categories")}
            delay={0.05}
          />
          <StatChip n={totalActive} label={tr("categories.stat.activeAuctions")} delay={0.15} />
          <StatChip n={totalBelow} label={tr("categories.stat.belowMarket")} delay={0.25} accent />
        </div>
      </div>

      {/* barre d'ajout */}
      <div className="mt-7 flex gap-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addCategory();
          }}
          placeholder={tr("categories.addPlaceholder")}
          className="h-11 flex-1 rounded-full border border-night-border bg-night-elev px-5 text-[13.5px] text-white outline-none transition-colors placeholder:text-night-dim focus:border-accent-dark"
        />
        <PillButton onClick={addCategory} className="h-11 px-6 text-[13.5px]">
          {tr("categories.scan")}
        </PillButton>
      </div>
      <div className="mt-2 px-5 text-[11.5px] text-night-dim">
        {tr("categories.naturalHint")}
      </div>

      {/* panneaux de cote */}
      <div className="mt-7 flex flex-col gap-5 pb-8">
        {categories.map((type, i) => (
          <Reveal key={type} delay={Math.min(i * 0.12, 0.5)}>
            <CategoryPanel
              type={type}
              result={results[type]}
              loading={!!loading[type]}
              onRemove={() => removeCategory(type)}
              onRetry={() => fetchType(type)}
            />
          </Reveal>
        ))}
        {categories.length === 0 && (
          <Reveal>
            <Panel className="flex flex-col items-center gap-2 px-8 py-16 text-center">
              <span className="headline text-[19px] text-white">{tr("categories.emptyTitle")}</span>
              <span className="max-w-[400px] text-[13px] leading-relaxed text-night-text">
                {tr("categories.emptyBody")}
              </span>
            </Panel>
          </Reveal>
        )}
      </div>

      <div className="mb-2 text-[11.5px] text-night-dim">
        {tr("categories.footer")}
      </div>
    </div>
  );
}

/* ————————————————————————— header : stat-chip ————————————————————————— */

function StatChip({
  n,
  label,
  delay,
  accent = false,
}: {
  n: number;
  label: string;
  delay: number;
  accent?: boolean;
}) {
  return (
    <WidgetChip
      appearDelay={delay}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] ${
        accent ? "bg-accent/12" : "bg-night-elev"
      }`}
    >
      <span className={`font-mono text-[13px] font-bold ${accent ? "text-accent-dark" : "text-white"}`}>{n}</span>
      <span className={accent ? "text-accent-dark" : "text-night-dim"}>{label}</span>
    </WidgetChip>
  );
}

/* ———————————————————————— panneau d'une catégorie ———————————————————————— */

function CategoryPanel({
  type,
  result,
  loading,
  onRemove,
  onRetry,
}: {
  type: string;
  result: MonitorResult | "error" | undefined;
  loading: boolean;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const tr = useT();
  const notify = useApp((s) => s.notify);
  const [alertOn, setAlertOn] = useState(true);

  const r = result !== "error" ? result : undefined;
  const hasCote = !!r && r.median != null && r.low != null && r.high != null;

  // la bande = fourchette FIABLE (p25–p75) — le min/max absolu des annonces
  // (1 € de départ, prix délirants) écraserait la viz ; l'échelle s'étend
  // autour de la fourchette fiable.
  const band: [number, number] = hasCote ? (r!.reliableRange ?? [r!.low!, r!.high!]) : [0, 1];
  const scaleMin = band[0] * 0.6;
  const scaleMax = band[1] * 1.35;
  const pct = (v: number) => Math.max(2, Math.min(98, ((v - scaleMin) / (scaleMax - scaleMin)) * 100));

  const opportunities = r?.lots.filter((l) => l.belowMarket) ?? [];
  const best = opportunities
    .filter((l) => l.currentBid > 0)
    .sort((a, b) => (a.edgePct ?? 0) - (b.edgePct ?? 0))
    .slice(0, 3);
  const pin = best[0];

  return (
    <Panel className="flex flex-col gap-4 p-6 sm:p-7">
      {/* rangée titre */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="headline text-[20px] text-white">{type}</span>
        {hasCote && (
          <span className="inline-flex items-center rounded-full bg-accent/12 px-3 py-1 text-[11px] font-bold text-accent-dark">
            {tr("categories.panel.rateSet")}
          </span>
        )}
        {loading && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-night-elev px-3 py-1 text-[11px] font-semibold text-night-text">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-dark" />
            {tr("categories.panel.scanning")}
          </span>
        )}
        {r?.dominantCategory && (
          <span className="inline-flex items-center rounded-full bg-night-elev px-2.5 py-1 text-[10.5px] font-semibold text-night-text">
            {r.dominantCategory}
          </span>
        )}
        {r?.basis && (
          <span className="inline-flex items-center rounded-full bg-night-elev px-2.5 py-1 text-[10.5px] font-medium text-night-dim">
            {BASIS_LABEL[r.basis] ? tr(BASIS_LABEL[r.basis]) : r.basis}
          </span>
        )}
        <span className="flex-1" />
        {r && (
          <span className="text-xs text-night-dim">
            <span className="font-mono">{r.sampleSize}</span> {tr("categories.panel.comparables")}
          </span>
        )}
        <button onClick={onRemove} className="text-xs font-semibold text-night-dim transition-colors hover:text-down">
          {tr("categories.panel.remove")}
        </button>
      </div>

      {/* plan Gemini — ce que le scan a compris de la demande */}
      {r?.plan && (
        <div className="-mt-2.5 text-[12px] text-night-dim">
          {r.plan.searchQuery && tr("categories.plan.understood", { query: r.plan.searchQuery })}
          {(r.plan.excludeKeywords?.length ?? 0) > 0 && (
            <>
              {" "}· {tr("categories.plan.excluded", { keywords: r.plan.excludeKeywords!.slice(0, 3).join(", ") })}
              {r.plan.excludeKeywords!.length > 3 ? "…" : ""}
            </>
          )}
          {(r.plan.excludedAsParts ?? 0) > 0 && (
            <>
              {" "}· <span className="font-mono">{r.plan.excludedAsParts}</span> {tr("categories.plan.partsExcluded")}
            </>
          )}
          {r.plan.maxPrice != null && (
            <>
              {" "}· {tr("categories.plan.cap")} <span className="font-mono">€{r.plan.maxPrice}</span>
            </>
          )}
        </div>
      )}

      {/* erreur — garde le retry */}
      {result === "error" && (
        <Card className="flex flex-wrap items-center gap-3 px-5 py-4 text-[13px] text-night-text">
          {tr("categories.panel.errorUnavailable")}
          <button onClick={onRetry} className="font-semibold text-accent-dark hover:underline">
            {tr("categories.panel.retry")}
          </button>
        </Card>
      )}

      {/* skeleton — blocs qui pulsent dans le panneau sombre */}
      {loading && !r && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[168px] animate-pulse rounded-[21px] bg-night-elev" />
          <div className="flex flex-col gap-2.5">
            <div className="h-[76px] animate-pulse rounded-[21px] bg-night-elev" />
            <div className="h-[76px] animate-pulse rounded-[21px] bg-night-elev" style={{ animationDelay: "0.15s" }} />
          </div>
        </div>
      )}

      {/* scan arrivé mais pas de cote exploitable */}
      {r && !hasCote && !loading && (
        <Card className="flex flex-wrap items-center gap-3 px-5 py-4 text-[13px] text-night-text">
          {tr("categories.panel.notEnough")}
          <button onClick={onRetry} className="font-semibold text-accent-dark hover:underline">
            {tr("categories.panel.rescan")}
          </button>
        </Card>
      )}

      {hasCote && r && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* GAUCHE — la viz signature dans un widget surélevé */}
          <Card className="flex min-w-0 flex-col p-5">
            <div>
              {/* la barre de cote se dévoile de gauche à droite */}
              <motion.div
                initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
                whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <CoteBand
                  bandLeftPct={pct(band[0])}
                  bandWidthPct={Math.max(4, pct(band[1]) - pct(band[0]))}
                  medianPct={pct(r.median!)}
                  medianLabel={euro(r.median!)}
                  lowPct={pct(band[0])}
                  lowLabel={euro(band[0])}
                  highPct={pct(band[1])}
                  highLabel={euro(band[1])}
                  pin={
                    pin
                      ? {
                          pct: pct(Math.max(scaleMin, pin.currentBid)),
                          label: tr("categories.panel.bestLot", { price: euro(pin.currentBid) }),
                        }
                      : undefined
                  }
                  className="mt-1"
                />
              </motion.div>
              <div className="mt-2 text-[11px] text-night-dim">
                {tr("categories.panel.bandHint")}
              </div>
            </div>

            {/* graphe des prix à la clôture — remplit l'espace, façon widget */}
            <div className="mt-4 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="overline">{tr("categories.panel.liveMarket")}</span>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-night-dim">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-dark" />
                  {tr("categories.panel.closingPrices")} ·{" "}
                  <span className="text-accent-dark">{tr("categories.panel.belowMarketDot")}</span>
                </span>
              </div>
              <MarketChart lots={r.lots} median={r.median} band={r.reliableRange} height={188} />
            </div>

            {/* rangée décision */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-night-border pt-3.5 text-[12.5px] text-night-text">
              <span>
                <span className="font-mono font-semibold text-white">
                  €{Math.round(band[0])}–{Math.round(band[1])}
                </span>{" "}
                {tr("categories.panel.reliableRange")}
              </span>
              {r.maxProfitableBid != null && (
                <span>
                  {tr("categories.panel.profitableUpTo")}{" "}
                  <span className="font-mono font-semibold text-accent-dark">{euro(r.maxProfitableBid)}</span>
                </span>
              )}
              <span>
                <span className="font-mono">{r.count}</span> {tr("categories.panel.auctions")} ·{" "}
                <span className="font-mono font-semibold text-accent-dark">{opportunities.length}</span>{" "}
                {tr("categories.panel.belowMarket")}
              </span>
              <Link
                href="/"
                className="ml-auto font-semibold text-accent-dark transition-colors hover:text-accent-dark2"
              >
                {tr("categories.panel.seeOnRadar")}
              </Link>
            </div>
          </Card>

          {/* DROITE — meilleures opportunités, lues par l'IA */}
          <div className="flex flex-col gap-2">
            <span className="overline px-1">{tr("categories.panel.bestOpportunities")}</span>
            {best.map((l, i) => (
              <OpportunityCard
                key={l.lotId}
                lot={l}
                index={i}
                median={r.median}
                maxProfitableBid={r.maxProfitableBid}
              />
            ))}
            {best.length === 0 && (
              <Card className="flex flex-1 flex-col items-center justify-center gap-1 px-5 py-8 text-center">
                <span className="text-[12.5px] font-semibold text-white">{tr("categories.panel.nothingBelow")}</span>
                <span className="text-[11.5px] leading-relaxed text-night-dim">
                  {tr("categories.panel.nothingBelowBody")}
                </span>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* pied de panneau — l'alerte −30 % */}
      {hasCote && (
        <>
          <div className="h-px bg-night-border" />
          <div className="flex items-center gap-3 text-[12.5px] text-night-text">
            <button
              onClick={() => {
                const next = !alertOn;
                // à l'activation, on demande la permission navigateur — les
                // alertes elles-mêmes sont émises par le radar.
                if (next && "Notification" in window && Notification.permission === "default") {
                  void Notification.requestPermission();
                }
                notify(next ? tr("categories.notify.alertOn") : tr("categories.notify.alertOff"));
                setAlertOn(next);
              }}
              aria-pressed={alertOn}
              className={`relative h-[21px] w-9 flex-none rounded-full transition-colors duration-200 ${
                alertOn ? "bg-accent-dark" : "bg-night-border"
              }`}
            >
              <span
                className="absolute top-0.5 h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-[left] duration-200"
                style={{ left: alertOn ? 17 : 2 }}
              />
            </button>
            <span>
              {tr("categories.panel.alertPre")} <b className="text-white">−30%</b> {tr("categories.panel.alertPost")}
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}

/* ——————————————— opportunité : mini-widget + analyse IA ——————————————— */
// Composant séparé : le hook useLotVerdict vit ici (jamais dans une boucle).
// Le lot n°1 (meilleur edge) est lu automatiquement, les suivants à la demande.

function OpportunityCard({
  lot,
  index,
  median,
  maxProfitableBid,
}: {
  lot: MonitorLot;
  index: number;
  median: number | null;
  maxProfitableBid: number | null;
}) {
  const tr = useT();
  const auto = index === 0;
  const [asked, setAsked] = useState(false);
  const [open, setOpen] = useState(false);
  const enabled = auto || asked;
  const { verdict, state, risk } = useLotVerdict(lot.lotId, median, enabled);
  const maxBid = finalMaxBid(maxProfitableBid, verdict);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="animate-widget-in"
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      <Card className="flex flex-col gap-2.5 p-3 transition-colors duration-200 hover:border-night-border2">
        {/* miniature + titre + prix */}
        <div className="flex items-start gap-3">
          {lot.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lot.imageUrl}
              alt=""
              loading="lazy"
              className="h-12 w-12 flex-none rounded-[10px] bg-night-elev object-cover"
            />
          ) : (
            <div className="h-12 w-12 flex-none rounded-[10px] bg-night-elev" />
          )}
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-[12.5px] font-medium leading-snug text-white">{lot.title}</div>
            <div className="mt-1 text-[11px] text-night-dim">
              <span className="font-mono">{lot.bidCount}</span> {tr("categories.opportunity.bids")}
              {lot.closesInSec > 0 && (
                <>
                  {" "}· {tr("categories.opportunity.closesIn")} <span className="font-mono">{fmtTime(lot.closesInSec)}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-none flex-col items-end gap-0.5">
            <span className="font-mono text-[13px] font-semibold text-white">{euro(lot.currentBid)}</span>
            {lot.edgePct != null && (
              <span className="font-mono text-[11px] font-semibold text-accent-dark">{fmtEdge(lot.edgePct)}</span>
            )}
          </div>
        </div>

        {/* ligne analyse : Analyser / Lecture… / verdict + ouvrir */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-night-border pt-2.5">
          {!enabled && state === "idle" && (
            <button
              onClick={() => setAsked(true)}
              className="text-[11.5px] font-semibold text-night-dim transition-colors hover:text-accent-dark"
            >
              {tr("categories.opportunity.analyze")}
            </button>
          )}
          {enabled && (state === "idle" || state === "loading") && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-night-dim">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-dark" />
              {tr("categories.opportunity.reading")}
            </span>
          )}
          {state === "error" && (
            <span className="text-[11.5px] text-night-dim">{tr("categories.opportunity.unavailable")}</span>
          )}
          {state === "done" && verdict && risk && (
            <>
              <RiskBadge risk={risk} />
              {maxBid != null && (
                <span className="text-[11.5px] text-night-text">
                  {tr("categories.opportunity.finalMax")}{" "}
                  <span className="font-mono font-semibold text-accent-dark">{euro(maxBid)}</span>
                </span>
              )}
            </>
          )}
          <span className="flex-1" />
          {lot.itemWebUrl && (
            <a
              href={lot.itemWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11.5px] font-semibold text-accent-dark transition-colors hover:text-accent-dark2"
            >
              {tr("categories.opportunity.open")}
            </a>
          )}
        </div>

        {/* résumé dépliable → VerdictBody compact */}
        {state === "done" && verdict && (
          open ? (
            <button
              onClick={() => setOpen(false)}
              className="rounded-[10px] bg-night-elev px-3 py-2.5 text-left"
            >
              <VerdictBody verdict={verdict} compact />
              <span className="mt-1.5 block text-[10.5px] font-semibold text-night-dim">
                {tr("categories.opportunity.collapse")}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="group -mt-0.5 text-left text-[11.5px] leading-snug text-night-text"
            >
              <span className="line-clamp-1">
                {verdict.resume ?? verdict.etatReel ?? tr("categories.opportunity.seeAnalysis")}
              </span>
              <span className="text-[10.5px] font-semibold text-night-dim transition-colors group-hover:text-accent-dark">
                {tr("categories.opportunity.details")}
              </span>
            </button>
          )
        )}
      </Card>
    </motion.div>
  );
}

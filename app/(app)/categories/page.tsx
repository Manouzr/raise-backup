"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { ScanProgress } from "@/lib/contracts";
import { edgeOf, euro, fmtEdge } from "@/lib/format";
import { useApp } from "@/lib/store";

// Catégories scannées — la cote comme objet visuel, pas comme tableau.
// L'utilisateur dit quoi chasser ; BidEdge établit la fourchette fiable.

type AddedCat = { name: string; slug: string; scan: ScanProgress | null };

const SCAN_STEP_LABELS: Record<ScanProgress["step"], string> = {
  "past-sales": "ventes passées…",
  "live-search": "recherche live des annonces…",
  calibration: "calibration de la cote…",
  done: "terminé",
};

/** "Objectifs M42" → "objectifs-m42" (minuscules, accents retirés, espaces → "-") */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function CoteBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-accent-tint px-[11px] py-1 text-[11.5px] font-bold text-accent-press">
      Cote établie
    </span>
  );
}

export default function CategoriesPage() {
  const hot = useApp((s) => s.hot);
  const scans = useApp((s) => s.scans);
  const ramScan = scans["ram-ddr5"];
  const notify = useApp((s) => s.notify);

  const [catInput, setCatInput] = useState("");
  const [alertOn, setAlertOn] = useState(true);
  const [added, setAdded] = useState<AddedCat[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Game Boy DMG",
    "Claviers mécaniques vintage",
    "Objectifs M42",
  ]);

  const sources = useRef<Map<string, EventSource>>(new Map());

  useEffect(() => {
    const map = sources.current;
    return () => {
      for (const es of map.values()) es.close();
      map.clear();
    };
  }, []);

  const addCategory = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    const slug = slugify(name);
    setSuggestions((prev) => prev.filter((s) => s !== name));
    setCatInput("");
    notify("Scan lancé : " + name);
    if (sources.current.has(slug)) return;
    setAdded((prev) => (prev.some((c) => c.slug === slug) ? prev : [...prev, { name, slug, scan: null }]));

    const es = new EventSource(`/api/scan?category=${encodeURIComponent(slug)}&label=${encodeURIComponent(name)}`);
    sources.current.set(slug, es);
    es.addEventListener("scan", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent<string>).data) as ScanProgress;
        setAdded((prev) => prev.map((c) => (c.slug === slug ? { ...c, scan: data } : c)));
        if (data.step === "done") {
          es.close();
          sources.current.delete(slug);
        }
      } catch {
        // event illisible — on attend le suivant
      }
    });
  };

  const addFromInput = () => {
    if (!catInput.trim()) {
      notify("Nomme une catégorie d'abord");
      return;
    }
    addCategory(catInput);
  };

  const toggleAlert = () => {
    notify(alertOn ? "Alerte désactivée" : "Alerte activée");
    setAlertOn(!alertOn);
  };

  // — carte Seiko : le lot en direct alimente le point sur la bande —
  const bid = hot?.currentBid ?? 95;

  // — carte RAM : pilotée par le flux SSE —
  const ramPct = Math.round(ramScan?.pct ?? 34);
  const ramDone = ramScan?.step === "done";
  const ramSales = ramScan?.pastSalesCount ?? 214;
  const ramMin = Math.max(1, Math.round((100 - ramPct) / 50));
  const ramBand = ramScan?.band;

  // — catégories ajoutées : le store (alimenté par le flux SSE global) est la
  // source de vérité — les cartes survivent aux allers-retours radar ↔ ici.
  // L'état local ne sert qu'au placeholder « en file d'attente… » avant le
  // premier event de scan.
  const addedCards: AddedCat[] = [
    ...Object.values(scans)
      .filter((s) => s.category !== "ram-ddr5")
      .map((s) => ({ name: s.label, slug: s.category, scan: s })),
    ...added.filter((c) => !scans[c.slug]),
  ];
  const visibleSuggestions = suggestions.filter((name) => !scans[slugify(name)]);

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto px-8 py-[26px]">
      <div className="text-[28px] font-normal tracking-[-0.02em]">Catégories scannées</div>
      <div className="mt-[5px] text-[13px] text-body">
        Dis quoi chasser — BidEdge établit la cote via les ventes passées et une recherche live.
      </div>

      {/* ajout */}
      <div className="mt-[18px] flex gap-2.5">
        <input
          value={catInput}
          onChange={(e) => setCatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addFromInput();
          }}
          placeholder="Ajouter une catégorie… ex. « montres Seiko vintage »"
          className="h-11 flex-1 rounded-full border border-hairline bg-white px-5 text-[13.5px] text-ink"
        />
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={addFromInput}
          className="inline-flex h-11 items-center rounded-full bg-accent px-[22px] text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-press"
        >
          Scanner
        </motion.button>
      </div>

      {/* ===== carte Seiko — la viz de cote signature ===== */}
      <div className="mt-4 flex flex-col gap-[13px] rounded-[18px] bg-white px-5 py-[18px] shadow-card">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[15px] font-semibold">Montres Seiko vintage</span>
          <CoteBadge />
          <span className="inline-flex items-center rounded-full bg-up-tint px-2.5 py-1 text-[11px] font-bold text-up-strong">
            cote +8% sur 3 mois
          </span>
          <span className="flex-1" />
          <span className="text-xs text-muted">124 ventes analysées · maj il y a 3 min</span>
        </div>

        <div className="flex gap-5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {/* rangée haute : fourchette + médiane */}
            <div className="relative h-[70px]">
              <span className="absolute left-[26%] top-5 -translate-x-1/2 font-mono text-[13px] font-medium">€180</span>
              <span className="absolute left-[46%] top-0 -translate-x-1/2 text-center leading-[1.05]">
                <span className="font-mono text-[20px] font-semibold text-accent-press">€280</span>
                <br />
                <span className="text-[9px] font-semibold uppercase tracking-[.07em] text-muted">médiane</span>
              </span>
              <span className="absolute left-[74%] top-5 -translate-x-1/2 font-mono text-[13px] font-medium">€420</span>
              <div className="absolute inset-x-0 top-[50px] h-[14px] rounded-full bg-control" />
              <div
                className="absolute left-[26%] top-[50px] h-[14px] w-[48%] rounded-full"
                style={{ background: "linear-gradient(90deg,rgba(20,120,121,.3),#147879 42%,rgba(20,120,121,.3))" }}
              />
              <div className="absolute left-[46%] top-[44px] h-[26px] w-[2.5px] rounded-[2px] bg-accent-press" />
            </div>
            {/* rangée basse : le lot live pointé sur la bande */}
            <div className="relative h-14">
              <div className="absolute left-[9%] top-0 h-4 w-0.5 bg-accent" />
              <div className="absolute left-[9%] top-[13px] h-[13px] w-[13px] -translate-x-[45%] rounded-full border-[2.5px] border-white bg-accent shadow-[0_1px_4px_rgba(0,0,0,.25)]" />
              <span className="absolute left-[3%] top-[34px] whitespace-nowrap text-[11px] font-semibold">
                Seiko 6139 · live <span className="font-mono">{euro(bid)}</span>
              </span>
              <span className="absolute left-[13.5%] top-[19px] w-[11.5%] border-t-[1.5px] border-dashed border-[rgba(20,120,121,.6)]" />
              <span className="absolute left-[25%] top-[13px] text-[10px] text-[rgba(20,120,121,.85)]">›</span>
              <span className="absolute left-[26.8%] top-2 inline-flex items-center rounded-full bg-up-tint px-[11px] py-[3px] text-[11.5px] font-bold text-up-strong">
                ton edge ·&nbsp;{fmtEdge(edgeOf(bid, 280))}
              </span>
            </div>
            <div className="text-[11px] text-muted">
              la zone teal = ce que le marché paie (124 ventes) · le point = le lot en direct
            </div>
          </div>

          <div className="flex w-[180px] flex-none flex-col gap-[5px] text-[11.5px] text-body">
            <span>
              <span className="font-mono">€180–420</span> fourchette fiable
            </span>
            <span>
              eBay <span className="font-mono">78</span> · Catawiki <span className="font-mono">32</span> · Drouot{" "}
              <span className="font-mono">14</span>
            </span>
            <Link href="/" className="font-semibold text-accent transition-colors hover:text-accent-press">
              9 lots actifs au radar →
            </Link>
          </div>
        </div>

        {/* sous-modèles */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-app px-3 py-[5px] text-xs font-medium text-body">
            6139 chrono ·&nbsp;<span className="font-mono">€240–320</span>
          </span>
          <span className="inline-flex items-center rounded-full bg-app px-3 py-[5px] text-xs font-medium text-body">
            SKX007 ·&nbsp;<span className="font-mono">€110–160</span>
          </span>
          <span className="inline-flex items-center rounded-full bg-app px-3 py-[5px] text-xs font-medium text-body">
            6105 diver ·&nbsp;<span className="font-mono">€600–900</span>
          </span>
          <button
            onClick={() => notify("Bientôt disponible")}
            className="inline-flex items-center rounded-full bg-app px-3 py-[5px] text-xs font-medium text-body transition-colors hover:bg-control"
          >
            5 sous-modèles ▾
          </button>
        </div>

        <div className="h-px bg-control" />

        {/* alerte */}
        <div className="flex items-center gap-[11px] text-[12.5px]">
          <button
            onClick={toggleAlert}
            aria-pressed={alertOn}
            className="relative h-[21px] w-9 flex-none rounded-full transition-colors duration-200"
            style={{ background: alertOn ? "#147879" : "#c7ccd3" }}
          >
            <span
              className="absolute top-0.5 h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-[left] duration-200"
              style={{ left: alertOn ? 17 : 2 }}
            />
          </button>
          <span>
            M&apos;alerter quand un lot passe sous <b>−30%</b> de la cote
          </span>
          <span className="flex-1" />
          <button
            onClick={() => notify("Bientôt disponible")}
            className="text-xs text-muted transition-colors hover:text-ink"
          >
            Pause · Retirer
          </button>
        </div>
      </div>

      {/* ===== carte RAM — scan en direct via SSE ===== */}
      <div className="mt-3.5 flex flex-col gap-[11px] rounded-[18px] bg-white px-5 py-[18px] shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold">RAM DDR5 / composants</span>
          {ramDone ? (
            <CoteBadge />
          ) : (
            <span className="inline-flex items-center rounded-full bg-control px-[11px] py-1 text-[11.5px] font-semibold text-body">
              Scan en cours…
            </span>
          )}
          <span className="flex-1" />
          {ramDone ? (
            <span className="text-xs text-muted">{ramSales} ventes analysées · à l&apos;instant</span>
          ) : (
            <span className="text-xs text-muted">
              <span className="font-mono">{ramPct}%</span> · ~<span className="font-mono">{ramMin}</span> min
            </span>
          )}
        </div>

        {ramDone ? (
          <div className="flex animate-fade-up items-baseline gap-2.5">
            <span className="font-mono text-[15px] font-medium">
              {euro(ramBand?.low ?? 120)} – {euro(ramBand?.high ?? 160)}
            </span>
            <span className="text-xs text-muted">
              médiane <span className="font-mono">{euro(ramBand?.median ?? 140)}</span>
            </span>
            <span className="flex-1" />
            <span className="text-xs text-muted">{(ramBand?.sources ?? ["eBay", "Catawiki"]).join(" · ")}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[7px] text-[12.5px]">
            <div className="flex items-center gap-[9px]">
              <span className="text-up-strong">✓</span>
              <span>
                Ventes passées collectées — <span className="font-mono">{ramSales}</span> transactions
              </span>
            </div>
            <div className="flex items-center gap-[9px]">
              <span className="text-accent">▶</span>
              <span>Recherche live des annonces (eBay)</span>
              <span className="h-1.5 max-w-[170px] flex-1 overflow-hidden rounded-full bg-control">
                <span
                  className="block h-full bg-accent transition-[width] duration-1000 ease-linear"
                  style={{ width: `${ramPct}%` }}
                />
              </span>
            </div>
            <div className="flex items-center gap-[9px] text-muted">
              <span>·</span>
              <span>Calibration de la cote (comparaison des sources)</span>
            </div>
          </div>
        )}
      </div>

      {/* ===== carte GPU — compacte ===== */}
      <div className="mt-3.5 flex items-center gap-2.5 rounded-[18px] bg-white px-5 py-[15px] shadow-card">
        <span className="text-[15px] font-semibold">GPU / cartes graphiques</span>
        <CoteBadge />
        <span className="text-xs text-muted">
          <span className="font-mono">€310–780</span> · médiane <span className="font-mono">€540</span> · 89 ventes
        </span>
        <span className="flex-1" />
        <button
          onClick={() => notify("Bientôt disponible")}
          className="text-xs text-muted transition-colors hover:text-ink"
        >
          détails ▾
        </button>
      </div>

      {/* ===== catégories ajoutées ===== */}
      {addedCards.map((c) => {
        const done = c.scan?.step === "done";
        return (
          <div
            key={done ? `${c.slug}-done` : c.slug}
            className="mt-3.5 flex animate-fade-up items-center gap-2.5 rounded-[18px] bg-white px-5 py-[15px] shadow-card"
          >
            <span className="text-[15px] font-semibold">{c.name}</span>
            {done && c.scan ? (
              <>
                <CoteBadge />
                <span className="text-xs text-muted">
                  <span className="font-mono">
                    {euro(c.scan.band?.low ?? 0)} – {euro(c.scan.band?.high ?? 0)}
                  </span>{" "}
                  · médiane <span className="font-mono">{euro(c.scan.band?.median ?? 0)}</span>
                </span>
                <span className="flex-1" />
                <span className="text-xs text-muted">{c.scan.pastSalesCount} ventes analysées · à l&apos;instant</span>
              </>
            ) : c.scan ? (
              <>
                <span className="inline-flex items-center rounded-full bg-control px-[11px] py-1 text-[11.5px] font-semibold text-body">
                  Scan en cours…
                </span>
                <span className="text-xs text-muted">{SCAN_STEP_LABELS[c.scan.step]}</span>
                <span className="flex-1" />
                <span className="font-mono text-xs text-muted">{Math.round(c.scan.pct)}%</span>
                <span className="h-1.5 w-[130px] overflow-hidden rounded-full bg-control">
                  <span
                    className="block h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                    style={{ width: `${Math.round(c.scan.pct)}%` }}
                  />
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full bg-control px-[11px] py-1 text-[11.5px] font-semibold text-body">
                  en file d&apos;attente…
                </span>
                <span className="flex-1" />
                <span className="relative h-1.5 w-[130px] overflow-hidden rounded-full bg-control">
                  <span
                    className="absolute left-0 top-0 h-full w-2/5 animate-slide-bar rounded-full"
                    style={{ background: "linear-gradient(90deg,transparent,#147879,transparent)" }}
                  />
                </span>
              </>
            )}
          </div>
        );
      })}

      {/* ===== suggestions ===== */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-body">
        <span className="text-muted">Suggestions, d&apos;après ton journal :</span>
        {visibleSuggestions.map((name) => (
          <motion.button
            key={name}
            whileTap={{ scale: 0.96 }}
            onClick={() => addCategory(name)}
            className="inline-flex items-center rounded-full border border-dashed border-[#c9ced6] bg-white px-[13px] py-1.5 text-xs font-medium text-body transition-colors hover:border-accent hover:text-accent-press"
          >
            + {name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

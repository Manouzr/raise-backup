"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { LotEvent } from "@/lib/contracts";
import { edgeOf, euro, fmtEdge, fmtLastBid, fmtTime, platformLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

// Le Radar — un flux d'opportunités priorisées, PAS un dashboard.
// Chaque chiffre affiché est un argument pour une décision.

type FilterKey = "all" | "montres" | "ram" | "gpu";

const FILTER_LABELS: Record<Exclude<FilterKey, "all">, string> = {
  montres: "Montres",
  ram: "RAM",
  gpu: "GPU",
};

function kindShort(kind: LotEvent["seller"]["kind"]): string {
  return kind === "pro" ? "pro" : kind === "particulier" ? "part." : "maison";
}

export default function RadarPage() {
  const router = useRouter();
  const hot = useApp((s) => s.hot);
  const meta = useApp((s) => s.hotMeta);
  const upcoming = useApp((s) => s.upcoming);
  const watch = useApp((s) => s.watch);
  const finds = useApp((s) => s.finds);
  const details = useApp((s) => s.details);
  const followed = useApp((s) => s.followed);
  const declared = useApp((s) => s.declared);
  const follow = useApp((s) => s.follow);
  const openAdvisory = useApp((s) => s.openAdvisory);
  const openDone = useApp((s) => s.openDone);
  const ceilingFor = useApp((s) => s.ceilingFor);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<"time" | "edge">("time");

  const live = meta?.phase === "live";
  const mine = live && meta?.leader === "user";
  const outbid = live && !!meta?.outbid;
  const idle = live && !mine && !outbid;
  const ended = meta?.phase === "ended";

  const filterOf = (lot: LotEvent): string => details[lot.lotId]?.filterKey ?? "autres";

  const watchList = useMemo(() => {
    const followedFinds = finds.filter((f) => followed.includes(f.lotId));
    const list = [...watch, ...followedFinds].filter(
      (l) => filter === "all" || filterOf(l) === filter,
    );
    return list.sort((a, b) => {
      if (sortKey === "time") return a.closesInSec - b.closesInSec;
      const ea = edgeOf(a.currentBid, details[a.lotId]?.band.median ?? a.currentBid);
      const eb = edgeOf(b.currentBid, details[b.lotId]?.band.median ?? b.currentBid);
      return ea - eb; // le plus négatif (meilleur edge) d'abord
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, finds, followed, filter, sortKey, details]);

  const findList = useMemo(
    () =>
      finds
        .filter((f) => !followed.includes(f.lotId))
        .filter((l) => filter === "all" || filterOf(l) === filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finds, followed, filter, details],
  );

  const hotVisible = !!hot && (filter === "all" || filter === "montres");
  const ramVisible = !!upcoming && (filter === "all" || filter === "ram");

  const counts = useMemo(() => {
    const allWatch = [...watch, ...finds.filter((f) => followed.includes(f.lotId))];
    const by = (k: string) => allWatch.filter((l) => filterOf(l) === k).length;
    return {
      all: allWatch.length + (hot ? 1 : 0) + (upcoming ? 1 : 0),
      montres: by("montres") + (hot ? 1 : 0),
      ram: by("ram") + (upcoming ? 1 : 0),
      gpu: by("gpu"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, finds, followed, hot, upcoming, details]);

  const hotDetail = hot ? details[hot.lotId] : undefined;
  const hotBand = hotDetail?.band;
  const sug = hot ? hot.currentBid + 5 : 0;
  // au-dessus de la limite, on n'affiche plus de montant à enchérir —
  // l'advisory explique et son CTA est désactivé
  const sugOverCeiling = hot ? sug > ceilingFor(hot.lotId) : false;
  const timeColor = hot && hot.closesInSec <= 30 && live ? "#cf202f" : live ? "#0a0b0d" : "#7c828a";
  const hotBorder = outbid ? "#cf202f" : live ? "#147879" : "#dee1e6";

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto px-8 py-[26px]">
      {/* header */}
      <div className="flex items-center gap-3.5">
        <span className="text-[28px] font-normal tracking-[-0.02em]">Radar</span>
        <span className="inline-flex items-center gap-[7px] rounded-full bg-accent-tint px-3 py-[5px] text-xs font-semibold text-accent-press">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
          en direct
        </span>
        <span className="flex-1" />
        <button
          onClick={() => setSortKey((k) => (k === "time" ? "edge" : "time"))}
          className="rounded-full border border-hairline bg-white px-[15px] py-2 text-[12.5px] font-medium text-body transition-colors hover:bg-control"
        >
          Tri : {sortKey === "time" ? "ferment bientôt" : "meilleur edge"} ⇅
        </button>
      </div>

      {/* filtres */}
      <div className="mt-4 flex gap-2">
        {(["all", "montres", "ram", "gpu"] as const).map((k) => {
          const active = filter === k;
          const label = k === "all" ? `Tous · ${counts.all}` : `${FILTER_LABELS[k]} · ${counts[k]}`;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? "border-ink bg-ink text-white" : "border-hairline bg-white text-body hover:bg-control"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ferme bientôt */}
      {(hotVisible || ramVisible) && (
        <div className="mb-2.5 mt-[22px] text-[11px] font-bold uppercase tracking-[.08em] text-muted">
          Ferme bientôt
        </div>
      )}

      {hotVisible && hot && meta && (
        <div
          className={`flex items-center gap-4 rounded-[18px] bg-white p-4 shadow-soft ${
            outbid ? "animate-pulse-red" : live ? "animate-pulse-teal" : ""
          }`}
          style={{ border: `1.5px solid ${hotBorder}` }}
        >
          <div className="h-[86px] w-[116px] flex-none rounded-xl" style={{ background: hotDetail?.gradient }} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-[9px]">
              <span className="text-[15px] font-semibold">{hot.title}</span>
              <span className="text-[11.5px] text-muted">
                {hot.seller.name} · {hot.seller.kind === "pro" ? "Pro" : hot.seller.kind} ·{" "}
                {hot.seller.positivePct?.toLocaleString("fr-FR")}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[9px]">
              <span className="font-mono text-[19px] font-semibold">{euro(hot.currentBid)}</span>
              {hotBand && (
                <span className="inline-flex items-center rounded-full bg-up-tint px-2.5 py-[3px] text-[11px] font-bold text-up-strong">
                  {fmtEdge(edgeOf(hot.currentBid, hotBand.median))}&nbsp;vs cote €{hotBand.low}–{hotBand.high}
                </span>
              )}
              <span className="text-[11.5px] text-muted">
                {hot.bidCount} enchérisseurs&nbsp;· surenchère&nbsp;{fmtLastBid(meta.lastBidSecAgo)}
              </span>
            </div>
            <div className="flex h-5 items-end gap-0.5">
              {[
                { h: 5, c: "#dee1e6" },
                { h: 7, c: "#dee1e6" },
                { h: 8, c: "#dee1e6" },
                { h: 11, c: "#dee1e6" },
                { h: 14, c: "#a9c6c6" },
                { h: 19, c: "#147879" },
              ].map((b, i) => (
                <span
                  key={i}
                  className="w-[7px] origin-bottom rounded-[2px]"
                  style={{ height: b.h, background: b.c, animation: `growY .5s ${0.05 + i * 0.07}s ease both` }}
                />
              ))}
              <span className="ml-[7px] text-[10.5px] text-muted">activité des 10 dernières minutes</span>
            </div>
          </div>
          <div className="flex flex-none flex-col items-end gap-[9px]">
            <span className="font-mono text-2xl font-semibold" style={{ color: timeColor }}>
              {fmtTime(hot.closesInSec)}
            </span>

            {idle && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openAdvisory}
                className="inline-flex h-10 items-center rounded-full bg-accent px-[19px] text-[13px] font-semibold text-white transition-colors hover:bg-accent-press"
              >
                {sugOverCeiling ? "Voir la suggestion" : <>Voir la suggestion ·&nbsp;{euro(sug)}</>}
              </motion.button>
            )}

            {mine && (
              <>
                <span className="inline-flex items-center rounded-full bg-up-tint px-4 py-[9px] text-[12.5px] font-bold text-up-strong">
                  Tu mènes ·&nbsp;{euro(hot.currentBid)}
                </span>
                <button onClick={openAdvisory} className="text-xs font-semibold text-body transition-colors hover:text-ink">
                  détails →
                </button>
              </>
            )}

            {outbid && (
              <>
                <span className="inline-flex animate-pulse-red items-center rounded-full bg-down-tint px-3.5 py-[7px] text-xs font-bold text-down">
                  Surenchéri ·&nbsp;{euro(hot.currentBid)}
                </span>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={openAdvisory}
                  className="inline-flex h-[38px] items-center rounded-full bg-accent px-[17px] text-[13px] font-semibold text-white transition-colors hover:bg-accent-press"
                >
                  {sugOverCeiling ? "Voir le conseil" : <>Répondre ·&nbsp;{euro(sug)}</>}
                </motion.button>
              </>
            )}

            {ended && !declared && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openDone}
                className="inline-flex h-10 items-center rounded-full bg-ink px-[19px] text-[13px] font-semibold text-white transition-colors hover:bg-[#2b2f36]"
              >
                Déclarer le résultat
              </motion.button>
            )}

            {ended && declared && (
              <>
                <span className="inline-flex items-center rounded-full bg-control px-4 py-[9px] text-[12.5px] font-bold text-accent-press">
                  Résultat enregistré
                </span>
                <Link href="/journal" className="text-xs font-semibold text-body transition-colors hover:text-ink">
                  voir le Journal →
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {ramVisible && upcoming && (
        <div className="mt-2.5 flex items-center gap-4 rounded-[18px] border border-hairline bg-white p-4">
          <div
            className="h-[86px] w-[116px] flex-none rounded-xl"
            style={{ background: details[upcoming.lotId]?.gradient }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-[9px]">
              <span className="text-[15px] font-semibold">{upcoming.title}</span>
              <span className="text-[11.5px] text-muted">
                {upcoming.seller.name} · Particulier · {upcoming.seller.positivePct?.toLocaleString("fr-FR")}%
              </span>
            </div>
            <div className="flex items-center gap-[9px]">
              <span className="font-mono text-[19px] font-semibold">{euro(upcoming.currentBid)}</span>
              <span className="inline-flex items-center rounded-full bg-up-tint px-2.5 py-[3px] text-[11px] font-bold text-up-strong">
                {fmtEdge(edgeOf(upcoming.currentBid, details[upcoming.lotId]?.band.median ?? 135))} vs cote €
                {details[upcoming.lotId]?.band.low}–{details[upcoming.lotId]?.band.high}
              </span>
              <span className="text-[11.5px] text-muted">{upcoming.bidCount} enchérisseurs · calme depuis 2 min</span>
            </div>
          </div>
          <div className="flex flex-none flex-col items-end gap-[9px]">
            <span className="font-mono text-2xl font-semibold text-ink">{fmtTime(upcoming.closesInSec)}</span>
            <span className="inline-flex items-center rounded-full bg-accent-tint px-[15px] py-2 text-xs font-semibold text-accent-press">
              suggestion en préparation…
            </span>
          </div>
        </div>
      )}

      {/* à surveiller */}
      <div className="mb-2.5 mt-[22px] text-[11px] font-bold uppercase tracking-[.08em] text-muted">
        À surveiller
      </div>
      <div className="grid grid-cols-4 gap-3">
        {watchList.map((w) => {
          const d = details[w.lotId];
          const edge = d ? edgeOf(w.currentBid, d.band.median) : 0;
          return (
            <motion.button
              key={w.lotId}
              onClick={() => router.push(`/lot/${w.lotId}`)}
              whileHover={{ y: -2 }}
              className="flex animate-fade-up flex-col gap-2 rounded-2xl border border-hairline bg-white p-3 text-left transition-shadow hover:shadow-[0_8px_22px_rgba(10,11,13,.08)]"
            >
              <div className="h-[72px] rounded-[11px]" style={{ background: d?.gradient }} />
              <div className="text-[13px] font-semibold leading-[1.2]">{w.title}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm font-semibold">{euro(w.currentBid)}</span>
                <span className="font-mono text-[11px]" style={{ color: edge === 0 ? "#5b616e" : "#05b169" }}>
                  {fmtEdge(edge)}
                </span>
              </div>
              <div className="flex justify-between text-[10.5px] text-muted">
                <span className="font-mono">{fmtTime(w.closesInSec)}</span>
                <span>
                  {platformLabel(w.platform)} · {kindShort(w.seller.kind)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* trouvés par le scan */}
      {findList.length > 0 && (
        <>
          <div className="mb-2.5 mt-[22px] text-[11px] font-bold uppercase tracking-[.08em] text-muted">
            Trouvés par le scan · il y a 3 min
          </div>
          <div className="grid grid-cols-3 gap-3">
            {findList.map((f) => {
              const d = details[f.lotId];
              return (
                <div
                  key={f.lotId}
                  className="flex animate-fade-up items-center gap-[11px] rounded-2xl border-[1.5px] border-dashed border-[#c9ced6] bg-[rgba(255,255,255,.65)] p-3"
                >
                  <div className="h-11 w-11 flex-none rounded-[10px]" style={{ background: d?.gradient }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold leading-[1.2]">{f.title}</div>
                    <div className="text-[10.5px] text-muted">{d?.findSub}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => follow(f.lotId)}
                    className="rounded-full border-[1.5px] border-accent px-[13px] py-1.5 text-[11.5px] font-bold text-accent-press transition-colors hover:bg-accent-tint"
                  >
                    + Suivre
                  </motion.button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mb-1.5 mt-3.5 text-[11.5px] text-muted">
        Le scan propose, toi tu choisis ce qui entre au radar — rien ne s&apos;ajoute tout seul.
      </div>
    </div>
  );
}

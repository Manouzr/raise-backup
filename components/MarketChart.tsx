"use client";

import { useId, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { euro } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";

// Graphe de marché — ligne + aire dégradée verte, animée façon taap.it
// (la ligne se TRACE via pathLength quand le chart entre dans le viewport,
// l'aire fond en fondu, les points « poppent »). Version DA « Nuit » : fond
// sombre, grille discrète, accent vert accent-dark, axes en night-dim.
// Données RÉELLES : le prix courant de chaque enchère active, ordonné par
// heure de clôture (la plus proche à gauche). La cote médiane sert de repère.
// SVG pur, aucune dépendance de charts.

type ChartLot = { currentBid: number; closesInSec: number; belowMarket: boolean };

type Props = {
  lots: ChartLot[];
  median: number | null;
  band?: [number, number] | null;
  className?: string;
  height?: number;
};

const W = 600;
const PAD_T = 14;
const PAD_B = 24;
const PAD_L = 12;
const PAD_R = 44;

// palette « Nuit »
const C_GRID = "#26262c"; // night-border — grille discrète
const C_LINE = "#34d16c"; // accent-dark — ligne / aire / médiane
const C_AXIS = "#6f6f7a"; // night-dim — labels d'axes
const C_HOLE = "#141418"; // night-card — « trou » des points sur fond sombre

const EASE = [0.4, 0, 0.2, 1] as const;

function niceCeil(v: number): number {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

export function MarketChart({ lots, median, band, className = "", height = 200 }: Props) {
  const t = useT();
  const uid = useId().replace(/[:]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  // temps avant clôture, compacté pour l'axe X (libellés i18n)
  const compactTime = (s: number): string => {
    if (s <= 0) return t("lot.chart.ended");
    const d = Math.floor(s / 86400);
    if (d >= 1) return t("lot.chart.days", { n: d });
    const h = Math.floor(s / 3600);
    if (h >= 1) return t("lot.chart.hours", { n: h });
    return t("lot.chart.mins", { n: Math.max(1, Math.floor(s / 60)) });
  };
  // animé = dans le viewport, ou immédiatement si l'utilisateur réduit les animations
  const on = inView || !!reduce;

  const H = height;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // enchères ordonnées par clôture la plus proche, prix exploitable
  const pts = lots
    .filter((l) => l.currentBid > 0 && l.closesInSec > 0)
    .sort((a, b) => a.closesInSec - b.closesInSec)
    .slice(0, 32);

  if (pts.length < 3) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-center text-[12px] text-night-dim ${className}`}
        style={{ height }}
      >
        {t("lot.chart.empty")}
      </div>
    );
  }

  const prices = pts.map((p) => p.currentBid);
  const yMax = niceCeil(Math.max(...prices, median ?? 0, band?.[1] ?? 0) * 1.05);
  const x = (i: number) => PAD_L + (i / (pts.length - 1)) * innerW;
  const y = (v: number) => PAD_T + (1 - Math.min(v, yMax) / yMax) * innerH;

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.currentBid).toFixed(1)}`).join("");
  const areaPath = `${linePath}L${x(pts.length - 1).toFixed(1)},${(PAD_T + innerH).toFixed(1)}L${x(0).toFixed(1)},${(
    PAD_T + innerH
  ).toFixed(1)}Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
  const xIdx = [0, Math.floor((pts.length - 1) / 3), Math.floor((2 * (pts.length - 1)) / 3), pts.length - 1];
  const medianY = median != null ? y(median) : null;

  // durée « instantanée » quand prefers-reduced-motion
  const dLine = reduce ? 0 : 1.05;
  const dFade = reduce ? 0 : 0.35;

  return (
    <div ref={ref} className={className} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`mcg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C_LINE} stopOpacity="0.24" />
            <stop offset="95%" stopColor={C_LINE} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grille horizontale — discrète, apparaît en fondu */}
        {yTicks.map((t, i) => (
          <motion.line
            key={i}
            x1={PAD_L}
            x2={PAD_L + innerW}
            y1={y(t)}
            y2={y(t)}
            stroke={C_GRID}
            strokeWidth={1}
            initial={{ opacity: 0 }}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: dFade, delay: reduce ? 0 : 0.1, ease: EASE }}
          />
        ))}

        {/* repère de cote médiane */}
        {medianY != null && (
          <>
            <motion.line
              x1={PAD_L}
              x2={PAD_L + innerW}
              y1={medianY}
              y2={medianY}
              stroke={C_LINE}
              strokeWidth={1.4}
              strokeDasharray="5 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: on ? 0.5 : 0 }}
              transition={{ duration: dFade, delay: reduce ? 0 : 0.15, ease: EASE }}
            />
            <motion.text
              x={PAD_L + innerW + 6}
              y={medianY}
              dominantBaseline="central"
              fontSize={11}
              fontFamily="var(--font-jetbrains), monospace"
              fill={C_LINE}
              initial={{ opacity: 0 }}
              animate={{ opacity: on ? 1 : 0 }}
              transition={{ duration: dFade, delay: reduce ? 0 : 0.55, ease: EASE }}
            >
              {euro(median!)}
            </motion.text>
          </>
        )}

        {/* aire — se dévoile en fondu une fois la ligne amorcée */}
        <motion.path
          d={areaPath}
          fill={`url(#mcg-${uid})`}
          stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: on ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.45, ease: "easeInOut" }}
        />

        {/* ligne — TRAÇAGE PROGRESSIF via pathLength à l'entrée dans le viewport */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={C_LINE}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: on ? 1 : 0 }}
          transition={{ duration: dLine, ease: EASE }}
        />

        {/* points — les lots sous la cote sont pleins et vifs ; ils « poppent » après le tracé */}
        {pts.map((p, i) => (
          <motion.circle
            key={i}
            cx={x(i)}
            cy={y(p.currentBid)}
            r={p.belowMarket ? 4 : 3}
            fill={p.belowMarket ? C_LINE : C_HOLE}
            stroke={p.belowMarket ? C_HOLE : C_LINE}
            strokeWidth={1.5}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0 }}
            transition={{
              duration: reduce ? 0 : 0.24,
              delay: reduce ? 0 : 0.6 + i * 0.02,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ))}

        {/* labels Y (prix, à droite) */}
        {yTicks.map((t, i) => (
          <motion.text
            key={i}
            x={PAD_L + innerW + 6}
            y={y(t)}
            dominantBaseline="central"
            fontSize={11}
            fontFamily="var(--font-jetbrains), monospace"
            fill={C_AXIS}
            initial={{ opacity: 0 }}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: dFade, delay: reduce ? 0 : 0.55, ease: EASE }}
          >
            {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}k` : t}
          </motion.text>
        ))}

        {/* labels X (temps avant clôture) */}
        {xIdx.map((idx, k) => (
          <motion.text
            key={k}
            x={x(idx)}
            y={H - 6}
            textAnchor={k === 0 ? "start" : k === xIdx.length - 1 ? "end" : "middle"}
            fontSize={11}
            fontFamily="var(--font-jetbrains), monospace"
            fill={C_AXIS}
            initial={{ opacity: 0 }}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: dFade, delay: reduce ? 0 : 0.55, ease: EASE }}
          >
            {compactTime(pts[idx].closesInSec)}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}

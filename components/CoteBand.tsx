"use client";

import { motion } from "motion/react";

// La bande de cote — viz signature, DA « Nuit » (identique à la section
// « La cote » de la landing). Zone verte accent-dark = ce que le marché paie,
// tick = médiane, point live = le lot en direct. La zone se DÉVOILE (scaleX),
// le point live PULSE et GLISSE (motion) à chaque changement de prix : deux
// des moments animés notés.

export type CoteBandProps = {
  /** position gauche de la zone teal, en % */
  bandLeftPct: number;
  /** largeur de la zone teal, en % */
  bandWidthPct: number;
  medianPct: number;
  medianLabel: string;
  lowPct?: number;
  lowLabel?: string;
  highPct?: number;
  highLabel?: string;
  /** le lot en direct */
  pin?: { pct: number; label: string };
  className?: string;
};

const SLIDE = { duration: 0.5, ease: [0.2, 0.9, 0.3, 1] as const };

export function CoteBand({
  bandLeftPct,
  bandWidthPct,
  medianPct,
  medianLabel,
  lowPct,
  lowLabel,
  highPct,
  highLabel,
  pin,
  className,
}: CoteBandProps) {
  return (
    <div className={`relative h-[58px] ${className ?? ""}`}>
      {/* piste sombre */}
      <div className="absolute inset-x-0 top-[22px] h-3 rounded-full bg-night-elev" />
      {/* zone du marché — se dévoile de gauche à droite */}
      <motion.div
        className="absolute top-[22px] h-3 origin-left rounded-full"
        style={{
          left: `${bandLeftPct}%`,
          width: `${bandWidthPct}%`,
          background: "linear-gradient(90deg,rgba(52,209,108,.25),#34d16c 42%,rgba(52,209,108,.25))",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* marqueur médiane */}
      <div
        className="absolute top-4 h-6 w-[2.5px] rounded-[2px] bg-accent-dark"
        style={{ left: `${medianPct}%` }}
      />
      <span
        className="absolute top-0 -translate-x-1/2 font-mono text-[11px] text-accent-dark"
        style={{ left: `${medianPct}%` }}
      >
        {medianLabel}
      </span>
      {/* les bornes s'effacent si le label du pin passerait dessus */}
      {lowPct !== undefined && lowLabel && (pin === undefined || Math.abs(lowPct - pin.pct) > 14) && (
        <span
          className="absolute top-10 -translate-x-1/2 font-mono text-[10.5px] text-night-dim"
          style={{ left: `${lowPct}%` }}
        >
          {lowLabel}
        </span>
      )}
      {highPct !== undefined && highLabel && (pin === undefined || Math.abs(highPct - pin.pct) > 14) && (
        <span
          className="absolute top-10 -translate-x-1/2 font-mono text-[10.5px] text-night-dim"
          style={{ left: `${highPct}%` }}
        >
          {highLabel}
        </span>
      )}
      {pin && (
        <>
          {/* halo live qui pulse, suit le pin */}
          <motion.div
            className="pointer-events-none absolute top-[18px] h-[13px] w-[13px] -translate-x-1/2 rounded-full bg-accent-dark/40"
            initial={false}
            animate={{ left: `${pin.pct}%`, scale: [1, 2.4], opacity: [0.5, 0] }}
            transition={{
              left: SLIDE,
              scale: { duration: 1.8, repeat: Infinity, ease: "easeOut" },
              opacity: { duration: 1.8, repeat: Infinity, ease: "easeOut" },
            }}
          />
          {/* point live */}
          <motion.div
            className="absolute top-[18px] h-[13px] w-[13px] -translate-x-1/2 rounded-full border-[2.5px] border-night-card bg-accent-dark shadow-[0_0_10px_rgba(52,209,108,0.6)]"
            initial={false}
            animate={{ left: `${pin.pct}%` }}
            transition={SLIDE}
          />
          <motion.span
            className="absolute top-[38px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent/15 px-2 py-0.5 text-[10.5px] font-bold text-accent-dark"
            initial={false}
            animate={{ left: `${Math.max(8, Math.min(92, pin.pct))}%` }}
            transition={SLIDE}
          >
            {pin.label}
          </motion.span>
        </>
      )}
    </div>
  );
}

"use client";

// Les 3 cartes flottantes du hero — advisory Seiko, edge, lot gagné.
// Entrée orchestrée via motion, flottement continu via les keyframes floaty/floaty2.
import { motion } from "motion/react";
import { euro, fmtEdge, fmtTime } from "@/lib/format";

const enter = {
  initial: { opacity: 0, y: 28, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export default function HeroCards() {
  return (
    <div className="relative h-[440px] flex-1 min-w-0">
      {/* Carte advisory — Seiko 6139 */}
      <motion.div
        {...enter}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.9, 0.3, 1] }}
        className="absolute right-0 top-6 w-[330px]"
      >
        <div className="animate-floaty rounded-3xl bg-dark-card border border-dark-border p-[22px] shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold tracking-[0.07em] uppercase text-muted">
              Seiko 6139 chrono 1972
            </span>
            <span className="flex-1" />
            <span className="font-mono font-semibold text-[17px] text-[#f0616d]">
              {fmtTime(58)}
            </span>
          </div>
          <div className="flex items-end gap-3 mt-4">
            <span>
              <span className="text-[9.5px] font-bold tracking-[0.07em] uppercase text-muted">
                Actuelle
              </span>
              <br />
              <span className="font-mono text-[16px] text-dark-text">{euro(95)}</span>
            </span>
            <span className="text-body pb-0.5">→</span>
            <span>
              <span className="text-[9.5px] font-bold tracking-[0.07em] uppercase text-accent-dark">
                Suggérée
              </span>
              <br />
              <span className="font-mono font-semibold text-[28px] text-accent-dark">
                {euro(100)}
              </span>
            </span>
            <span className="flex-1" />
            <span className="text-right">
              <span className="text-[9.5px] font-bold tracking-[0.07em] uppercase text-muted">
                Cote
              </span>
              <br />
              <span className="font-mono text-[13px] text-[#e6e8ea]">€240–320</span>
            </span>
          </div>
          <div className="relative h-2.5 mt-[18px]">
            <div className="absolute left-0 right-0 top-px h-2 bg-dark-border rounded-full" />
            <div className="absolute left-[44%] w-[40%] top-px h-2 rounded-full bg-[linear-gradient(90deg,rgba(63,182,183,0.3),#3fb6b7_45%,rgba(63,182,183,0.3))]" />
            <div className="absolute left-[11%] -top-0.5 w-[13px] h-[13px] rounded-full bg-accent-dark border-[2.5px] border-dark-card" />
          </div>
          <div className="flex items-center justify-center h-11 rounded-full bg-accent text-white text-[13.5px] font-semibold mt-[18px]">
            Enchérir {euro(100)} maintenant
          </div>
          <div className="text-center text-[10px] text-body mt-2.5">
            une enchère = un tap · pas d&apos;autobid
          </div>
        </div>
      </motion.div>

      {/* Carte edge */}
      <motion.div
        {...enter}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.2, 0.9, 0.3, 1] }}
        className="absolute right-[262px] top-[210px] w-[212px]"
      >
        <div className="animate-floaty2 rounded-[20px] bg-dark-card border border-dark-border p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-muted">
            Ton edge
          </div>
          <div className="font-mono font-semibold text-[24px] text-accent-dark2 mt-1.5">
            {fmtEdge(-64)}
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            sous la cote · 124 ventes comparées
          </div>
        </div>
      </motion.div>

      {/* Carte lot gagné */}
      <motion.div
        {...enter}
        transition={{ duration: 0.6, delay: 0.45, ease: [0.2, 0.9, 0.3, 1] }}
        className="absolute right-14 top-[342px] w-[236px]"
      >
        <div className="[animation:floaty_10s_ease-in-out_infinite_alternate-reverse] rounded-[20px] bg-dark-card border border-dark-border py-3.5 px-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-[9px]">
            <span className="w-[26px] h-[26px] rounded-lg bg-[linear-gradient(140deg,#39404d,#12151b)]" />
            <span className="text-[11.5px] font-semibold text-[#e6e8ea]">Seiko SKX007</span>
            <span className="ml-auto inline-flex rounded-full bg-[rgba(5,177,105,0.14)] text-[#37c98e] text-[10px] font-bold px-[9px] py-[3px]">
              Gagné · {euro(118)}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

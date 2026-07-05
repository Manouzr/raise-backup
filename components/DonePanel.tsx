"use client";

import { AnimatePresence, motion } from "motion/react";
import { euro, fmtEdge, edgeOf, platformLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/provider";

// Panneau "Enchère terminée" — slide depuis la droite (240 ms ease-out).
// L'utilisateur DÉCLARE le résultat ("J'ai gagné / J'ai perdu") → écrit dans
// le journal (localStorage) et nourrit les prochaines suggestions.

export function DonePanel() {
  const open = useApp((s) => s.doneOpen);
  const close = useApp((s) => s.closeDone);
  const declare = useApp((s) => s.declareResult);
  const hot = useApp((s) => s.hot);
  const meta = useApp((s) => s.hotMeta);
  const details = useApp((s) => s.details);
  const t = useT();

  if (!hot || !meta) return null;

  const detail = details[hot.lotId];
  const finalBid = meta.finalBid ?? hot.currentBid;
  const band = detail?.band;
  const edge = band ? fmtEdge(edgeOf(finalBid, band.median)) : null;

  return (
    <AnimatePresence>
      {open && meta.phase === "ended" && (
        <div className="fixed inset-0 z-[65]">
          <motion.div
            className="absolute inset-0 cursor-pointer bg-gradient-to-r from-[rgba(0,0,0,.2)] to-[rgba(0,0,0,.6)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />
          <motion.div
            className="absolute bottom-[18px] right-[18px] top-[18px] flex w-[360px] flex-col gap-[13px] rounded-3xl border border-night-border bg-night-card p-6 shadow-[-16px_0_56px_rgba(0,0,0,.5)]"
            initial={{ x: 64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 64, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[.08em] text-night-dim">
                {t("common.done.tracked_ended")}
              </span>
              <span className="flex-1" />
              <button onClick={close} className="text-xs font-semibold text-night-dim transition-colors hover:text-white">
                {t("common.done.later")}
              </button>
            </div>

            <span className="text-2xl font-normal tracking-[-0.02em] text-white">{t("common.done.title")}</span>

            <div className="h-[110px] rounded-[14px]" style={{ background: detail?.gradient }} />

            <div>
              <div className="text-[14.5px] font-semibold text-white">{hot.title}</div>
              <div className="text-xs text-night-dim">
                {platformLabel(hot.platform)} · {hot.seller.name}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-[14px] bg-night-elev p-[13px] px-[15px]">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-night-text">{t("common.done.starting_price")}</span>
                <span className="font-mono text-white">{euro(meta.startPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-night-text">{t("common.done.final_price")}</span>
                <span className="font-mono text-[17px] font-semibold text-white">{euro(finalBid)}</span>
              </div>
              <div className="h-px bg-night-border" />
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-night-text">{t("common.done.market_rating")}</span>
                <span className="flex items-center gap-[7px]">
                  <span className="font-mono text-white">{band ? `€${band.low}–${band.high}` : "—"}</span>
                  {edge && (
                    <span className="inline-flex rounded-full bg-accent/12 px-2 py-0.5 text-[10.5px] font-bold text-accent-dark">
                      {edge} {t("common.done.vs_rating")}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex-1" />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => declare(true)}
              className="flex h-[46px] items-center justify-center rounded-full bg-accent-dark text-sm font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2"
            >
              {t("common.done.won")}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => declare(false)}
              className="flex h-[46px] items-center justify-center rounded-full bg-night-elev text-sm font-semibold text-white transition-colors hover:bg-night-border"
            >
              {t("common.done.lost")}
            </motion.button>

            <div className="text-center text-[11px] text-night-dim">
              {t("common.done.footer")}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

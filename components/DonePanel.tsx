"use client";

import { AnimatePresence, motion } from "motion/react";
import { euro, fmtEdge, edgeOf, platformLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

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
            className="absolute inset-0 cursor-pointer bg-gradient-to-r from-[rgba(10,11,13,.12)] to-[rgba(10,11,13,.4)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />
          <motion.div
            className="absolute bottom-[18px] right-[18px] top-[18px] flex w-[360px] flex-col gap-[13px] rounded-3xl bg-white p-6 shadow-[-16px_0_56px_rgba(10,11,13,.28)]"
            initial={{ x: 64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 64, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">
                Produit tracké · vente finie
              </span>
              <span className="flex-1" />
              <button onClick={close} className="text-xs font-semibold text-muted transition-colors hover:text-ink">
                Plus tard
              </button>
            </div>

            <span className="text-2xl font-normal tracking-[-0.02em]">Enchère terminée</span>

            <div className="h-[110px] rounded-[14px]" style={{ background: detail?.gradient }} />

            <div>
              <div className="text-[14.5px] font-semibold">{hot.title}</div>
              <div className="text-xs text-muted">
                {platformLabel(hot.platform)} · {hot.seller.name}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-[14px] bg-app p-[13px] px-[15px]">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-body">Prix de départ</span>
                <span className="font-mono">{euro(meta.startPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-body">Prix final</span>
                <span className="font-mono text-[17px] font-semibold">{euro(finalBid)}</span>
              </div>
              <div className="h-px bg-hairline" />
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-body">Cote marché</span>
                <span className="flex items-center gap-[7px]">
                  <span className="font-mono">{band ? `€${band.low}–${band.high}` : "—"}</span>
                  {edge && (
                    <span className="inline-flex rounded-full bg-up-tint px-2 py-0.5 text-[10.5px] font-bold text-up-strong">
                      {edge} vs cote
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex-1" />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => declare(true)}
              className="flex h-[46px] items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-press"
            >
              J&apos;ai gagné l&apos;enchère
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => declare(false)}
              className="flex h-[46px] items-center justify-center rounded-full bg-control text-sm font-semibold text-ink transition-colors hover:bg-control-hover"
            >
              J&apos;ai perdu l&apos;enchère
            </motion.button>

            <div className="text-center text-[11px] text-muted">
              Ta réponse nourrit le Journal et les prochaines suggestions.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

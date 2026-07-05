"use client";

import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store";

// Toast pill sombre, bas centre — déclenché via useApp().notify(message).

export function Toast() {
  const toast = useApp((s) => s.toast);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[26px] z-[90] flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="whitespace-nowrap rounded-full border border-night-border bg-night-elev px-5 py-[11px] text-[13px] font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

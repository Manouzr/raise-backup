"use client";

import { motion } from "motion/react";
import type { JournalEntry } from "@/lib/contracts";
import { euro } from "@/lib/format";
import { useApp } from "@/lib/store";

// Journal — la mémoire des décisions. Chaque motif appris est réinjecté
// dans les advisories suivantes : le copilote s'adapte, l'humain décide.

function badgeOf(e: JournalEntry): { label: string; className: string } {
  if (e.outcome === "won")
    return { label: `Gagné · ${e.price != null ? euro(e.price) : "—"}`, className: "bg-up-tint text-up-strong" };
  if (e.outcome === "lost")
    return { label: `Perdu · parti ${e.price != null ? euro(e.price) : "—"}`, className: "bg-down-tint text-down" };
  return { label: "Passé", className: "bg-control text-body" };
}

export default function JournalPage() {
  const journal = useApp((s) => s.journal);
  const wonCount = journal.filter((e) => e.outcome === "won").length;

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto px-8 py-[26px]">
      {/* header */}
      <div className="flex items-baseline gap-3">
        <span className="text-[28px] font-normal tracking-[-0.02em]">Journal</span>
        <span className="text-[13px] text-body">
          {journal.length} décisions · {wonCount} {wonCount > 1 ? "gagnées" : "gagnée"}
        </span>
      </div>

      {/* décisions */}
      <div className="mt-4 rounded-[18px] bg-white px-[18px] py-1 shadow-card">
        {journal.map((e) => {
          const badge = badgeOf(e);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3.5 border-b border-control py-[13px]"
            >
              <div className="h-11 w-11 flex-none rounded-[11px]" style={{ background: e.gradient }} />
              <div className="w-[215px] flex-none">
                <div className="text-[13.5px] font-semibold">{e.lotTitle}</div>
                <div className="text-[11.5px] text-muted">{e.meta}</div>
              </div>
              <span className="flex-1 rounded-[9px] bg-accent-tint px-[11px] py-[7px] text-xs text-accent-press">
                {e.learn}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-[13px] py-1.5 text-xs font-bold ${badge.className}`}
              >
                <span className="font-mono">{badge.label}</span>
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3.5 rounded-[14px] bg-accent-tint px-4 py-[13px] text-[12.5px] text-accent-press">
        {"Ces motifs sont réinjectés dans chaque advisory — « tu as tenu sous €240 la dernière fois, je suggère €220 ici »."}
      </div>
    </div>
  );
}

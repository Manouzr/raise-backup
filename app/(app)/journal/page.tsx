"use client";

import { motion } from "motion/react";
import type { JournalEntry } from "@/lib/contracts";
import { euro } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useT, type TFunc } from "@/lib/i18n/provider";
import { Reveal } from "@/components/ui/taap";

// Journal — la mémoire des décisions. Chaque motif appris est réinjecté
// dans les advisories suivantes : le copilote s'adapte, l'humain décide.

function badgeOf(e: JournalEntry, t: TFunc): { text: string; price: string | null; className: string } {
  if (e.outcome === "won")
    return {
      text: t("journal.badge.won"),
      price: e.price != null ? euro(e.price) : "—",
      className: "bg-accent/12 text-accent-dark",
    };
  if (e.outcome === "lost")
    return {
      text: t("journal.badge.lost"),
      price: e.price != null ? euro(e.price) : "—",
      className: "bg-[rgba(227,69,58,0.12)] text-down",
    };
  return { text: t("journal.badge.skipped"), price: null, className: "bg-night-elev text-night-text" };
}

export default function JournalPage() {
  const t = useT();
  const journal = useApp((s) => s.journal);
  const wonCount = journal.filter((e) => e.outcome === "won").length;

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto bg-night px-8 py-[26px]">
      {/* header */}
      <div className="overline">{t("journal.overline")}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <h1 className="headline text-[34px] text-white">{t("journal.title")}</h1>
        <span className="text-[13px] text-night-text">
          <span className="font-mono">{journal.length}</span> {t("journal.decisions")} ·{" "}
          <span className="font-mono">{wonCount}</span> {t("journal.won")}
        </span>
      </div>

      {/* décisions — mini-cartes « widget », apparition en cascade */}
      <div className="mt-5 flex flex-col gap-2">
        {journal.map((e, i) => {
          const badge = badgeOf(e, t);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.6), ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3.5 rounded-widget border border-night-border bg-night-card px-3 py-2.5"
            >
              <div className="h-11 w-11 flex-none rounded-xl" style={{ background: e.gradient }} />
              <div className="w-[215px] flex-none">
                <div className="text-[13.5px] font-semibold text-white">{e.lotTitle}</div>
                <div className="text-[11.5px] text-night-dim">{e.meta}</div>
              </div>
              <span className="flex-1 rounded-lg bg-accent/12 px-[11px] py-[7px] text-xs text-accent-dark">
                {t("journal.learned")}
                {e.learn.replace("appris : ", "")}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-[13px] py-1.5 text-xs font-semibold ${badge.className}`}
              >
                {badge.text}
                {badge.price != null && <span className="font-mono">{badge.price}</span>}
              </span>
            </motion.div>
          );
        })}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-4 rounded-widget bg-accent/12 px-5 py-3.5 text-[12.5px] text-accent-dark">
          {t("journal.banner")}
        </div>
      </Reveal>
    </div>
  );
}

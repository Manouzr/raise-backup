"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import type { LotEvent } from "@/lib/contracts";
import { edgeOf, euro, fmtEdge, fmtTime, platformLabel } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { useApp } from "@/lib/store";

// Fiche lot — tout ce qu'il faut pour décider : vendeur, état, cote, limite.
// Aucune enchère ne part d'ici : on prépare la décision, c'est tout.

const TRUST_COLORS = {
  ok: "text-accent-dark",
  warn: "text-warn",
  neutral: "text-night-text",
} as const;

/** repli si la donnée n'a pas d'initiales curées : "TokyoTimeShop" → "TO" */
function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function LotPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();

  const hot = useApp((s) => s.hot);
  const upcoming = useApp((s) => s.upcoming);
  const watch = useApp((s) => s.watch);
  const finds = useApp((s) => s.finds);
  const details = useApp((s) => s.details);
  const ceiling = useApp((s) => s.ceilingFor(id));
  const setLimit = useApp((s) => s.setLimit);
  const notify = useApp((s) => s.notify);

  // null → l'utilisateur n'a pas encore touché le champ, on affiche le plafond courant
  const [limitVal, setLimitVal] = useState<string | null>(null);

  const candidates: LotEvent[] = [];
  if (hot) candidates.push(hot);
  if (upcoming) candidates.push(upcoming);
  candidates.push(...watch, ...finds);
  const lot = candidates.find((l) => l.lotId === id);
  const detail = details[id];

  // snapshot pas encore arrivé — le flux remplit en moins d'une seconde
  if (!lot || !detail) return <div className="flex-1 bg-night" />;

  const edge = edgeOf(lot.currentBid, detail.band.median);
  const inputValue = limitVal ?? `€ ${ceiling}`;

  const saveLimit = () => {
    const n = Number.parseInt(inputValue.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    setLimit(id, n);
    notify(t("lot.limitSaved"));
  };

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto bg-night px-8 py-[26px]">
      {/* header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[13px] font-semibold text-night-text transition-colors hover:text-white">
          {t("lot.backRadar")}
        </Link>
        <span className="flex-1" />
        <span className="inline-flex items-center rounded-full border border-night-border bg-night-card px-3.5 py-1.5 text-xs font-medium text-night-text">
          {platformLabel(lot.platform)}
        </span>
        <span className="inline-flex items-center rounded-full border border-night-border bg-night-card px-3.5 py-1.5 text-xs font-medium text-night-text">
          {t("lot.closesIn")} <span className="ml-[5px] font-mono">{fmtTime(lot.closesInSec)}</span>
        </span>
      </div>

      <div className="mt-[18px] flex gap-[22px]">
        {/* galerie */}
        <div className="flex w-[300px] flex-none flex-col gap-2.5">
          <div className="h-[230px] rounded-[18px]" style={{ background: detail.gradient }} />
          <div className="flex gap-2.5">
            <div className="h-[62px] flex-1 rounded-[11px] opacity-80" style={{ background: detail.gradient }} />
            <div className="h-[62px] flex-1 rounded-[11px] opacity-65" style={{ background: detail.gradient }} />
            <div className="h-[62px] flex-1 rounded-[11px] opacity-50" style={{ background: detail.gradient }} />
          </div>
        </div>

        {/* colonne décision */}
        <div className="flex min-w-0 flex-1 flex-col gap-[13px]">
          <div className="text-2xl font-normal tracking-[-0.02em] text-white">{lot.title}</div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">
              {t("lot.currentBid")}
            </span>
            <span className="font-mono text-[21px] font-semibold text-white">{euro(lot.currentBid)}</span>
            <span
              className={`inline-flex items-center rounded-full px-[11px] py-1 text-[11.5px] font-bold ${
                edge < 0 ? "bg-accent/12 text-accent-dark" : "bg-night-elev text-night-text"
              }`}
            >
              {t("lot.vsQuote", { edge: fmtEdge(edge) })}
            </span>
          </div>

          {/* vendeur */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2.5 rounded-2xl border border-night-border bg-night-card px-4 py-3.5"
          >
            <div className="flex items-center gap-[11px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-[12.5px] font-bold text-accent-dark">
                {detail?.sellerInitials ?? initialsOf(lot.seller.name)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{lot.seller.name}</span>
                  <span className="inline-flex items-center rounded-full bg-accent/15 px-[9px] py-0.5 text-[10.5px] font-bold text-accent-dark">
                    {t(`lot.sellerKind.${lot.seller.kind}`)}
                  </span>
                </div>
                <div className="text-[11.5px] text-night-dim">{detail.sellerMeta}</div>
              </div>
            </div>
            <div className="flex gap-4 text-[12.5px] text-night-text">
              <span>
                <span className="font-mono font-medium text-white">{lot.seller.sales.toLocaleString("fr-FR")}</span>{" "}
                <span className="text-night-dim">{t("lot.sales")}</span>
              </span>
              <span>
                <span className="font-mono font-medium text-accent-dark">
                  {lot.seller.positivePct != null ? `${lot.seller.positivePct.toLocaleString("fr-FR")}%` : "—"}
                </span>{" "}
                <span className="text-night-dim">{t("lot.positiveFeedback")}</span>
              </span>
              <span className={`font-semibold ${TRUST_COLORS[detail.sellerTrust.tone]}`}>
                {detail.sellerTrust.text}
              </span>
            </div>
          </motion.div>

          {/* attributs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col rounded-2xl border border-night-border bg-night-card px-4 py-1"
          >
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">{t("lot.category")}</span>
              <Link href="/categories" className="font-semibold text-accent-dark transition-colors hover:text-accent-dark2">
                {detail.categoryLabel} →
              </Link>
            </div>
            <div className="h-px bg-night-border" />
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">{t("lot.statedCondition")}</span>
              <span className="text-white">{detail.etat}</span>
            </div>
            <div className="h-px bg-night-border" />
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">{t("lot.agentRead")}</span>
              <span className={`font-medium ${detail.read.tone === "ok" ? "text-accent-dark" : "text-warn"}`}>
                {detail.read.text}
              </span>
            </div>
            <div className="h-px bg-night-border" />
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">{t("lot.yourLimit")}</span>
              <span className="flex items-center gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setLimitVal(e.target.value)}
                  className="h-9 w-[90px] rounded-full border border-night-border bg-night-elev px-3.5 text-center font-mono text-[13px] text-white placeholder:text-night-dim"
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={saveLimit}
                  className="inline-flex h-9 items-center rounded-full bg-night-elev px-[15px] text-[12.5px] font-semibold text-white transition-colors hover:bg-night-border"
                >
                  {t("lot.save")}
                </motion.button>
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* comparables */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex flex-col rounded-2xl border border-night-border bg-night-card px-[18px] py-4"
      >
        <span className="mb-1.5 text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">
          {t("lot.comparables")}
        </span>
        {detail.comparables.map((cp) => (
          <div
            key={`${cp.title}-${cp.date}`}
            className="flex justify-between border-b border-night-border py-2 text-[13px] text-night-text"
          >
            <span>
              {cp.title} — <span className="font-mono text-white">{euro(cp.soldPrice)}</span>
            </span>
            <span className="text-night-dim">
              {cp.source} · {cp.date}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

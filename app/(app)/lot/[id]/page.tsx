"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import type { LotEvent } from "@/lib/contracts";
import { edgeOf, euro, fmtEdge, fmtTime, platformLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

// Fiche lot — tout ce qu'il faut pour décider : vendeur, état, cote, limite.
// Aucune enchère ne part d'ici : on prépare la décision, c'est tout.

const KIND_LABELS: Record<LotEvent["seller"]["kind"], string> = {
  pro: "Pro",
  particulier: "Particulier",
  maison: "Maison",
};

const TRUST_COLORS = {
  ok: "text-up-strong",
  warn: "text-warn",
  neutral: "text-body",
} as const;

/** repli si la donnée n'a pas d'initiales curées : "TokyoTimeShop" → "TO" */
function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function LotPage() {
  const { id } = useParams<{ id: string }>();

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
  if (!lot || !detail) return <div className="flex-1" />;

  const edge = edgeOf(lot.currentBid, detail.band.median);
  const inputValue = limitVal ?? `€ ${ceiling}`;

  const saveLimit = () => {
    const n = Number.parseInt(inputValue.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    setLimit(id, n);
    notify("Limite enregistrée — l'advisory s'en servira");
  };

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto px-8 py-[26px]">
      {/* header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[13px] font-semibold text-body transition-colors hover:text-ink">
          ← Radar
        </Link>
        <span className="flex-1" />
        <span className="inline-flex items-center rounded-full border border-hairline bg-white px-3.5 py-1.5 text-xs font-medium text-body">
          {platformLabel(lot.platform)}
        </span>
        <span className="inline-flex items-center rounded-full border border-hairline bg-white px-3.5 py-1.5 text-xs font-medium text-body">
          Ferme dans <span className="ml-[5px] font-mono">{fmtTime(lot.closesInSec)}</span>
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
          <div className="text-2xl font-normal tracking-[-0.02em]">{lot.title}</div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[.07em] text-muted">
              Enchère actuelle
            </span>
            <span className="font-mono text-[21px] font-semibold">{euro(lot.currentBid)}</span>
            <span
              className={`inline-flex items-center rounded-full px-[11px] py-1 text-[11.5px] font-bold ${
                edge < 0 ? "bg-up-tint text-up-strong" : "bg-control text-body"
              }`}
            >
              {fmtEdge(edge)} vs cote
            </span>
          </div>

          {/* vendeur */}
          <div className="flex flex-col gap-2.5 rounded-2xl bg-white px-4 py-3.5 shadow-card">
            <div className="flex items-center gap-[11px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-tint text-[12.5px] font-bold text-accent-press">
                {detail?.sellerInitials ?? initialsOf(lot.seller.name)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{lot.seller.name}</span>
                  <span className="inline-flex items-center rounded-full bg-accent-tint px-[9px] py-0.5 text-[10.5px] font-bold text-accent-press">
                    {KIND_LABELS[lot.seller.kind]}
                  </span>
                </div>
                <div className="text-[11.5px] text-muted">{detail.sellerMeta}</div>
              </div>
            </div>
            <div className="flex gap-4 text-[12.5px]">
              <span>
                <span className="font-mono font-medium">{lot.seller.sales.toLocaleString("fr-FR")}</span>{" "}
                <span className="text-muted">ventes</span>
              </span>
              <span>
                <span className="font-mono font-medium text-up-strong">
                  {lot.seller.positivePct != null ? `${lot.seller.positivePct.toLocaleString("fr-FR")}%` : "—"}
                </span>{" "}
                <span className="text-muted">d&apos;avis positifs</span>
              </span>
              <span className={`font-semibold ${TRUST_COLORS[detail.sellerTrust.tone]}`}>
                {detail.sellerTrust.text}
              </span>
            </div>
          </div>

          {/* attributs */}
          <div className="flex flex-col rounded-2xl bg-white px-4 py-1 shadow-card">
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-muted">Catégorie</span>
              <Link href="/categories" className="font-semibold text-accent transition-colors hover:text-accent-press">
                {detail.categoryLabel} →
              </Link>
            </div>
            <div className="h-px bg-control" />
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-muted">État annoncé</span>
              <span>{detail.etat}</span>
            </div>
            <div className="h-px bg-control" />
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-muted">Lecture agent</span>
              <span className={`font-medium ${detail.read.tone === "ok" ? "text-up-strong" : "text-warn"}`}>
                {detail.read.text}
              </span>
            </div>
            <div className="h-px bg-control" />
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-muted">Ta limite</span>
              <span className="flex items-center gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setLimitVal(e.target.value)}
                  className="h-9 w-[90px] rounded-full border border-hairline bg-white px-3.5 text-center font-mono text-[13px]"
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={saveLimit}
                  className="inline-flex h-9 items-center rounded-full bg-control px-[15px] text-[12.5px] font-semibold text-ink transition-colors hover:bg-control-hover"
                >
                  Enregistrer
                </motion.button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* comparables */}
      <div className="mt-4 flex flex-col rounded-2xl bg-white px-[18px] py-4 shadow-card">
        <span className="mb-1.5 text-[11px] font-bold uppercase tracking-[.07em] text-muted">
          Cote du produit — ventes comparables
        </span>
        {detail.comparables.map((cp) => (
          <div
            key={`${cp.title}-${cp.date}`}
            className="flex justify-between border-b border-control py-2 text-[13px]"
          >
            <span>
              {cp.title} — <span className="font-mono">{euro(cp.soldPrice)}</span>
            </span>
            <span className="text-muted">
              {cp.source} · {cp.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { LotVerdict } from "@/lib/platforms/ebay";
import { euro } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";

// Analyse IA du contexte d'un lot — hook + briques UI PARTAGÉES entre le
// modal du radar et la page catégories. Le verdict n'est demandé que pour
// les lots déjà rentables (pré-filtre), une seule fois par lot.

export type VerdictRisk = "sain" | "vigilance" | "eviter";

export function riskOf(v: LotVerdict | null): VerdictRisk | null {
  if (!v) return null;
  if (v.prixMaxConseille == null || v.redFlags.length >= 2) return "eviter";
  if (v.redFlags.length === 1) return "vigilance";
  return "sain";
}

// Classes de style par risque (le libellé vient de l'i18n, cf. RiskBadge).
export const RISK_STYLE: Record<VerdictRisk, { cls: string }> = {
  sain: { cls: "bg-accent/12 text-accent-dark" },
  vigilance: { cls: "bg-[rgba(168,123,47,0.15)] text-warn" },
  eviter: { cls: "bg-[rgba(227,69,58,0.12)] text-down" },
};

export type VerdictState = "idle" | "loading" | "done" | "error";

/** Va chercher le verdict IA d'un lot (une fois), quand `enabled` devient vrai. */
export function useLotVerdict(itemId: string | null, median: number | null | undefined, enabled: boolean) {
  const [verdict, setVerdict] = useState<LotVerdict | null>(null);
  const [state, setState] = useState<VerdictState>("idle");
  const requestedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !itemId || requestedFor.current === itemId) return;
    requestedFor.current = itemId;
    let alive = true;
    setVerdict(null);
    setState("loading");
    const params = new URLSearchParams({ itemId });
    if (median != null) params.set("median", String(median));
    fetch(`/api/lot/analyze?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { verdict: LotVerdict } | null) => {
        if (!alive) return;
        if (d?.verdict) {
          setVerdict(d.verdict);
          setState("done");
        } else {
          setState("error");
        }
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [enabled, itemId, median]);

  return { verdict, state, risk: riskOf(verdict) };
}

export function RiskBadge({ risk, className = "" }: { risk: VerdictRisk; className?: string }) {
  const t = useT();
  const s = RISK_STYLE[risk];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${s.cls} ${className}`}>
      {t(`lot.risk.${risk}`)}
    </span>
  );
}

/** % de confiance normalisé (le service renvoie 0–1 ou 0–100). */
export function confidencePct(v: LotVerdict | null): number | null {
  if (v?.confiance == null) return null;
  return Math.round(v.confiance <= 1 ? v.confiance * 100 : v.confiance);
}

/**
 * Corps du verdict : état réel, red flags, résumé, confiance.
 * Le prix max conseillé est volontairement laissé à l'appelant, pour être
 * fusionné dans la ligne de décision du produit (pas isolé ici).
 */
export function VerdictBody({ verdict, compact = false }: { verdict: LotVerdict; compact?: boolean }) {
  const t = useT();
  const pct = confidencePct(verdict);
  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-2"}`}>
      {verdict.etatReel && (
        <div className={`font-semibold text-white ${compact ? "text-[12.5px]" : "text-[13.5px]"}`}>{verdict.etatReel}</div>
      )}
      {verdict.redFlags.length > 0 && (
        <ul className={`flex flex-col gap-0.5 leading-relaxed text-warn ${compact ? "text-[12px]" : "text-[12.5px]"}`}>
          {verdict.redFlags.map((flag, i) => (
            <li key={i}>· {flag}</li>
          ))}
        </ul>
      )}
      {verdict.resume && (
        <div className={`leading-relaxed text-night-text ${compact ? "text-[12px]" : "text-[12.5px]"}`}>{verdict.resume}</div>
      )}
      {pct != null && (
        <div className="text-[11px] text-night-dim">
          {t("lot.confidence")} <span className="font-mono">{pct}%</span>
        </div>
      )}
    </div>
  );
}

/** Prix max final : le plus prudent entre la marge sur cote et le conseil IA. */
export function finalMaxBid(maxProfitableBid: number | null | undefined, verdict: LotVerdict | null): number | null {
  const candidates = [maxProfitableBid, verdict?.prixMaxConseille].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (candidates.length === 0) return null;
  return Math.round(Math.min(...candidates));
}

export { euro as euroFmt };

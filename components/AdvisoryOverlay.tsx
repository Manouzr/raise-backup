"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BidAdvisory } from "@/lib/contracts";
import { euro, fmtTime, platformLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import { withTaste } from "@/lib/taste";
import { CoteBand } from "@/components/CoteBand";
import { useT } from "@/lib/i18n/provider";

// L'advisory — overlay modal AU-DESSUS du radar. Trois états (suggestion /
// tu mènes / surenchéri), bande de cote avec pin qui glisse, comparables
// sourcés, CTA "Enchérir €X maintenant". Une enchère = un tap, jamais
// d'appel automatique : placeBid n'est déclenché QUE par le clic du CTA.

export function AdvisoryOverlay() {
  const open = useApp((s) => s.advisoryOpen);
  const close = useApp((s) => s.closeAdvisory);
  const hot = useApp((s) => s.hot);
  const meta = useApp((s) => s.hotMeta);
  const details = useApp((s) => s.details);
  const journal = useApp((s) => s.journal);
  const ceilingFor = useApp((s) => s.ceilingFor);
  const notify = useApp((s) => s.notify);
  const t = useT();

  const [advisory, setAdvisory] = useState<BidAdvisory | null>(null);
  const [pending, setPending] = useState(false);

  const detail = hot ? details[hot.lotId] : undefined;
  const ceiling = hot ? ceilingFor(hot.lotId) : 210;

  useEffect(() => {
    if (!open || !hot) return;
    let cancelled = false;
    fetch(`/api/advisory/${hot.lotId}?ceiling=${ceiling}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: BidAdvisory | null) => {
        if (!cancelled && data) setAdvisory(withTaste(data, journal, detail?.categoryLabel));
      })
      .catch(() => {
        // hors-ligne : l'overlay reste utilisable avec les données du flux
      });
    return () => {
      cancelled = true;
    };
    // re-fetch à chaque changement de prix (surenchère) et à l'ouverture
  }, [open, hot?.currentBid, hot?.lotId, ceiling]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeBid = useCallback(async () => {
    if (!hot || pending) return;
    const amount = hot.currentBid + 5;
    if (amount > ceiling) {
      notify(t("common.advisory.over_limit_notify", { ceiling }));
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId: hot.lotId, amount }),
      });
      if (res.ok) {
        notify(t("common.advisory.bid_placed", { amount: euro(amount) }));
      } else {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        notify(body?.error?.message ?? t("common.advisory.bid_rejected"));
      }
    } catch {
      notify(t("common.advisory.network_error"));
    } finally {
      setPending(false);
    }
  }, [hot, pending, ceiling, notify, t]);

  if (!hot || !meta) return null;

  const live = meta.phase === "live";
  const mine = live && meta.leader === "user";
  const outbid = live && meta.outbid;
  const idle = live && !mine && !outbid;
  const sug = hot.currentBid + 5;
  const overCeiling = sug > ceiling;
  const timeColor = hot.closesInSec <= 30 && live ? "text-down" : "text-white";
  const pinPct = Math.max(5, Math.min(92, ((hot.currentBid - 50) / 500) * 100));
  const comparables = advisory?.comparables ?? detail?.comparables ?? [];
  const band = advisory?.marketBand ?? detail?.band;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          />
          <motion.div
            className="relative flex max-h-[92vh] w-[660px] max-w-[92vw] flex-col gap-[15px] overflow-y-auto rounded-3xl border border-night-border bg-night-card p-[26px] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
          >
            {/* header */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[.07em] text-night-dim">
                {hot.title} · {platformLabel(hot.platform)} · {t("common.advisory.bidders", { n: hot.bidCount })}
              </span>
              <span className="flex-1" />
              <span className={`text-[10.5px] font-bold uppercase tracking-[.07em] ${timeColor}`}>
                {t("common.advisory.closes_in")}
              </span>
              <span className={`font-mono text-2xl font-semibold ${timeColor}`}>
                {fmtTime(hot.closesInSec)}
              </span>
            </div>

            <div className="flex gap-4">
              <div
                className="h-[104px] w-[118px] flex-none rounded-[14px]"
                style={{ background: detail?.gradient }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-[11px]">
                {idle && (
                  <div className="flex items-end gap-[15px]">
                    <span>
                      <span className="text-[10.5px] font-bold uppercase tracking-[.07em] text-night-dim">
                        {t("common.advisory.current_bid")}
                      </span>
                      <br />
                      <span className="font-mono text-[19px] font-medium text-night-text">
                        {euro(hot.currentBid)}
                      </span>
                    </span>
                    <span className="pb-0.5 text-[17px] text-night-dim">→</span>
                    <span>
                      <span className="text-[10.5px] font-bold uppercase tracking-[.07em] text-accent-dark">
                        {t("common.advisory.suggested_bid")}
                      </span>
                      <br />
                      <span className="font-mono text-[31px] font-semibold text-accent-dark">{euro(sug)}</span>
                    </span>
                    <span className="flex-1" />
                    <span className="text-right">
                      <span className="text-[10.5px] font-bold uppercase tracking-[.07em] text-night-dim">
                        {t("common.advisory.market_rating")}
                      </span>
                      <br />
                      <span className="font-mono text-[15px] font-medium text-white">
                        {band ? `€${band.low}–${band.high}` : "—"}
                      </span>
                    </span>
                  </div>
                )}

                {mine && (
                  <motion.div
                    className="flex items-center gap-2.5 rounded-[13px] bg-accent/12 p-[13px] px-[15px]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="text-[15px] font-bold text-accent-dark">✓</span>
                    <span className="text-[13.5px] leading-[1.4] text-accent-dark2">
                      <b>{t("common.advisory.leading", { amount: euro(hot.currentBid) })}</b>{" "}
                      {t("common.advisory.leading_hint")}
                    </span>
                  </motion.div>
                )}

                {outbid && (
                  <motion.div
                    className="flex items-center gap-3 rounded-[13px] bg-[rgba(227,69,58,0.12)] p-[13px] px-[15px]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="flex-1 text-[13.5px] leading-[1.4] text-down">
                      <b>{t("common.advisory.outbid_lead", { amount: euro(hot.currentBid) })}</b>
                    </span>
                    <span className="flex-none text-right">
                      <span className="text-[10px] font-bold uppercase tracking-[.07em] text-accent-dark">
                        {t("common.advisory.new_suggestion")}
                      </span>
                      <br />
                      <span className="font-mono text-2xl font-semibold text-accent-dark">{euro(sug)}</span>
                    </span>
                  </motion.div>
                )}

                <CoteBand
                  bandLeftPct={44}
                  bandWidthPct={38}
                  medianPct={57}
                  medianLabel={band ? `€${band.median}` : "€280"}
                  lowPct={44}
                  lowLabel={band ? `€${band.low}` : "€240"}
                  highPct={82}
                  highLabel={band ? `€${band.high}` : "€320"}
                  pin={{
                    pct: pinPct,
                    label: `${meta.leader === "user" ? t("common.advisory.pin_you") : t("common.advisory.pin_lot")} · ${euro(hot.currentBid)}`,
                  }}
                />
              </div>
            </div>

            {/* comparables sourcés */}
            <div className="flex flex-col">
              {comparables.map((c, i) => (
                <div key={c.title}>
                  {i > 0 && <div className="h-px bg-night-border" />}
                  <div className="flex justify-between py-1.5 text-[12.5px] text-night-text">
                    <span>
                      {c.title} — <span className="font-mono text-white">{euro(c.soldPrice)}</span>
                    </span>
                    <span className="text-night-dim">
                      {c.source} · {c.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {advisory && (
              <div className="rounded-[13px] bg-night-elev p-[13px] px-[15px] text-[13.5px] leading-[1.5] text-night-text">
                {advisory.advisory}
              </div>
            )}

            {advisory?.learnsFrom && (
              <div className="rounded-[13px] bg-accent/12 p-[13px] px-[15px] text-[12.5px] leading-[1.5] text-accent-dark">
                {t("common.advisory.from_journal", { text: advisory.learnsFrom })}
              </div>
            )}

            {/* décision */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-night-dim">
                {t("common.advisory.stay_under_pre")}{" "}
                <span className="font-mono font-semibold text-white">€{ceiling}</span>{" "}
                {t("common.advisory.stay_under_post")}
              </span>
              <span className="flex-1" />
              <button
                onClick={close}
                className="flex h-11 items-center rounded-full bg-night-elev px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-night-border"
              >
                {mine ? t("common.advisory.close") : t("common.advisory.skip")}
              </button>
              {(idle || outbid) && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={placeBid}
                  disabled={pending || overCeiling}
                  className={`flex h-[46px] items-center rounded-full px-6 text-[14.5px] font-semibold transition-colors ${
                    overCeiling
                      ? "cursor-not-allowed bg-night-border text-night-dim"
                      : "bg-accent-dark text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] hover:bg-accent-dark2"
                  } ${pending ? "opacity-70" : ""}`}
                >
                  {pending
                    ? t("common.advisory.sending")
                    : overCeiling
                      ? t("common.advisory.limit_reached", { ceiling })
                      : outbid
                        ? t("common.advisory.respond", { amount: euro(sug) })
                        : t("common.advisory.bid_now", { amount: euro(sug) })}
                </motion.button>
              )}
            </div>

            <div className="text-center text-[11px] text-night-dim">
              {t("common.advisory.footer")}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

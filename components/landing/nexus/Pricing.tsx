"use client";

// Tarifs (structure Nexus) — toggle mensuel/annuel avec pastille magnétique,
// faisceau lumineux sur l'offre recommandée. Plans BidEdge : Chasseur / Pro / Équipe.
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const PLANS = [
  {
    id: "hunter",
    price: { m: 0, y: 0 },
    features: ["landing.pricing.plans.hunter.f1", "landing.pricing.plans.hunter.f2", "landing.pricing.plans.hunter.f3"],
    highlight: false,
  },
  {
    id: "pro",
    price: { m: 19, y: 15 },
    features: [
      "landing.pricing.plans.pro.f1",
      "landing.pricing.plans.pro.f2",
      "landing.pricing.plans.pro.f3",
      "landing.pricing.plans.pro.f4",
    ],
    highlight: true,
  },
  {
    id: "team",
    price: { m: 49, y: 39 },
    features: [
      "landing.pricing.plans.team.f1",
      "landing.pricing.plans.team.f2",
      "landing.pricing.plans.team.f3",
      "landing.pricing.plans.team.f4",
    ],
    highlight: false,
  },
];

export function Pricing() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [cycle, setCycle] = useState<"m" | "y">("m");

  return (
    <section id="tarifs" className="px-4 py-24" style={{ scrollMarginTop: 80 }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-11 text-center"
        >
          <span className="overline !text-accent-dark">{t("landing.pricing.overline")}</span>
          <h2 className="headline mt-3 text-[34px] text-white sm:text-[40px]">{t("landing.pricing.title")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-night-text">
            {t("landing.pricing.subPre")} <span className="font-mono">14</span> {t("landing.pricing.subPost")}
          </p>

          {/* toggle */}
          <div className="mt-7 inline-flex items-center rounded-full border border-night-border bg-night-2 p-1">
            {(["m", "y"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  cycle === c ? "text-night" : "text-night-text"
                }`}
              >
                {cycle === c && (
                  <motion.span
                    layoutId="cycle-pill"
                    className="absolute inset-0 rounded-full bg-accent-dark"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{c === "m" ? t("landing.pricing.monthly") : t("landing.pricing.yearly")}</span>
                {c === "y" && (
                  <span className="relative z-10 ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-dark">
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3"
        >
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
              className={`relative flex flex-col rounded-2xl border p-7 transition-transform duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-accent-dark/50 bg-night-card"
                  : "border-night-border bg-night-card/60 hover:border-night-border2"
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="border-beam absolute h-16 w-16 rounded-full bg-accent-dark/40 blur-lg" />
                  </div>
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-dark px-3 py-1 text-[11px] font-bold text-night">
                    {t("landing.pricing.recommended")}
                  </span>
                </>
              )}

              <h3 className="text-[18px] font-semibold text-white">{t(`landing.pricing.plans.${plan.id}.name`)}</h3>
              <p className="mt-1 text-[13px] text-night-text">{t(`landing.pricing.plans.${plan.id}.desc`)}</p>

              <div className="mb-6 mt-5 flex items-baseline gap-1">
                <span className="font-mono text-[38px] font-semibold text-white">€{plan.price[cycle]}</span>
                {plan.price.m > 0 && <span className="text-[13px] text-night-dim">{t("landing.pricing.perMonth")}</span>}
              </div>

              <ul className="mb-7 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13.5px] text-night-text">
                    <Check className="h-4 w-4 flex-none text-accent-dark" strokeWidth={2} />
                    {t(f)}
                  </li>
                ))}
              </ul>

              <Link
                href="/onboarding"
                className={`inline-flex h-11 items-center justify-center rounded-full text-[13.5px] font-semibold transition-colors ${
                  plan.highlight
                    ? "shimmer-btn bg-accent-dark text-night hover:bg-accent-dark2"
                    : "border border-night-border2 bg-night-elev text-white hover:bg-night-border"
                }`}
              >
                {t(`landing.pricing.plans.${plan.id}.cta`)}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

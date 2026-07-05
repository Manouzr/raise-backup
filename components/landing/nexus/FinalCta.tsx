"use client";

// CTA final — panneau sombre avec halo vert, gros titre éditorial (Fraunces).
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function FinalCta() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="px-4 py-24">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 36 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-night-border bg-night-card px-6 py-20 text-center"
        style={{
          backgroundImage:
            "radial-gradient(60% 70% at 50% 100%,rgba(52,209,108,.16),transparent 65%)",
        }}
      >
        <div className="blob-drift pointer-events-none absolute -bottom-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-accent-dark/15 blur-[90px]" />
        <h2 className="font-display relative text-[36px] font-semibold leading-[1.02] tracking-[-0.02em] text-white sm:text-[52px]">
          {t("landing.cta.title1")}
          <br />
          {t("landing.cta.title2")}
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] text-night-text">
          {t("landing.cta.subPre")} <span className="font-mono text-white">2</span> {t("landing.cta.subPost")}
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="shimmer-btn inline-flex h-13 items-center rounded-full bg-accent-dark px-8 py-3.5 text-[15px] font-semibold text-night shadow-[0_12px_36px_rgba(52,209,108,0.3)] transition-colors hover:bg-accent-dark2"
          >
            {t("landing.cta.start")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-13 items-center rounded-full border border-night-border2 px-8 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:border-white"
          >
            {t("landing.cta.signIn")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

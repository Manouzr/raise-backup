"use client";

// Footer sombre — colonnes de liens, statut « opérationnel » qui respire.
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/provider";

const COLS: { titleKey: string; links: { labelKey: string; href: string }[] }[] = [
  {
    titleKey: "landing.footer.colProduct",
    links: [
      { labelKey: "landing.footer.linkDemo", href: "#demo" },
      { labelKey: "landing.footer.linkProduct", href: "#produit" },
      { labelKey: "landing.footer.linkQuote", href: "#cote" },
      { labelKey: "landing.footer.linkPricing", href: "#tarifs" },
    ],
  },
  {
    titleKey: "landing.footer.colResources",
    links: [
      { labelKey: "landing.footer.linkGuide", href: "#" },
      { labelKey: "landing.footer.linkStatus", href: "#" },
      { labelKey: "landing.footer.linkChangelog", href: "#" },
    ],
  },
  {
    titleKey: "landing.footer.colAccount",
    links: [
      { labelKey: "landing.footer.linkSignIn", href: "/login" },
      { labelKey: "landing.footer.linkCreate", href: "/onboarding" },
    ],
  },
];

export function Footer() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="border-t border-night-border bg-night-2">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-8 md:grid-cols-5"
        >
          <div className="col-span-2 md:col-span-2">
            <Link href="/home" className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dark font-bold text-night">
                B
              </span>
              <span className="headline text-[16px] text-white">
                Bid<span className="text-accent-dark">Edge</span>
              </span>
            </Link>
            <p className="mb-4 max-w-xs text-[13px] leading-relaxed text-night-dim">
              {t("landing.footer.tagline")}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-night-border bg-night-card px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-dark pulse-glow text-accent-dark" />
              <span className="text-[12px] text-night-text">{t("landing.footer.status")}</span>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.titleKey}>
              <h4 className="mb-4 text-[13px] font-semibold text-white">{t(col.titleKey)}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.labelKey}>
                    <a href={l.href} className="text-[13px] text-night-dim transition-colors hover:text-white">
                      {t(l.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-night-border pt-7 text-[12px] text-night-dim sm:flex-row"
        >
          <span>© <span className="font-mono">2026</span> BidEdge · {t("landing.footer.privacy")} · {t("landing.footer.terms")}</span>
          <span>{t("landing.footer.bottomTagline")}</span>
        </motion.div>
      </div>
    </footer>
  );
}

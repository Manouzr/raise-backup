"use client";

// Bande défilante des places de marché couvertes — logos SVG des grandes
// plateformes que le radar BidEdge surveille. Blanc par défaut, couleur de
// marque au survol de chaque logo.
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PROVIDER_LOGO_DATA } from "./logoData";
import { ProviderLogo } from "./ProviderLogos";
import { useT } from "@/lib/i18n/provider";

export function Marquee() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="overflow-hidden border-y border-night-border/60 bg-night-2/40 py-14">
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="overline mb-9 text-center !text-night-dim"
      >
        {t("landing.marquee.subtitle")}
      </motion.p>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-night to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-night to-transparent" />
        <div className="flex w-max animate-marquee">
          {[...PROVIDER_LOGO_DATA, ...PROVIDER_LOGO_DATA].map((logo, i) => (
            <div
              key={i}
              title={logo.name}
              className="group mx-11 flex h-14 min-w-[150px] items-center justify-center opacity-65 transition-opacity duration-300 hover:opacity-100"
            >
              <ProviderLogo {...logo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

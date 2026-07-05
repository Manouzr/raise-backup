"use client";

// Section « La cote » — la méthode BidEdge, avec la bande de cote signature
// (fourchette du marché + point live) restylée pour le fond sombre. Ancre #cote.
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { useT } from "@/lib/i18n/provider";

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-accent-dark" />
      <span className="text-[14px] leading-relaxed text-night-text">{children}</span>
    </div>
  );
}

export function Cote() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cote" className="px-4 py-24" style={{ scrollMarginTop: 80 }}>
      <div ref={ref} className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="overline !text-accent-dark">{t("landing.cote.overline")}</span>
          <h2 className="headline mt-3 text-[34px] text-white sm:text-[40px]">{t("landing.cote.title")}</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-night-text">
            {t("landing.cote.lead")}
          </p>
          <div className="mt-7 flex flex-col gap-3.5">
            <Bullet>
              <b className="text-white">{t("landing.cote.bullet1Bold")}</b> — <span className="font-mono">124</span>{" "}
              {t("landing.cote.bullet1Rest")}
            </Bullet>
            <Bullet>
              <b className="text-white">{t("landing.cote.bullet2Bold")}</b> — {t("landing.cote.bullet2Rest")}
            </Bullet>
            <Bullet>
              <b className="text-white">{t("landing.cote.bullet3Bold")}</b> — {t("landing.cote.bullet3Rest")}
            </Bullet>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-night-border bg-night-card p-7"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-semibold text-white">{t("landing.cote.cardTitle")}</span>
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent-dark">
              {t("landing.cote.cardBadge")}
            </span>
            <span className="ml-auto text-[11.5px] text-night-dim">
              <span className="font-mono">124</span> {t("landing.cote.sales")} · <span className="font-mono">3</span> {t("landing.cote.sources")}
            </span>
          </div>

          {/* bande de cote */}
          <div className="relative mt-8 h-[68px]">
            <span className="absolute left-[26%] top-5 -translate-x-1/2 font-mono text-[13px] text-night-text">€180</span>
            <span className="absolute left-[46%] top-0 -translate-x-1/2 text-center leading-none">
              <span className="font-mono text-[20px] font-semibold text-accent-dark">€280</span>
              <br />
              <span className="overline !text-[9px] !text-night-dim">{t("landing.cote.median")}</span>
            </span>
            <span className="absolute left-[74%] top-5 -translate-x-1/2 font-mono text-[13px] text-night-text">€420</span>
            <div className="absolute left-0 right-0 top-[50px] h-3 rounded-full bg-night-elev" />
            <div
              className="absolute top-[50px] h-3 rounded-full"
              style={{
                left: "26%",
                width: "48%",
                background: "linear-gradient(90deg,rgba(52,209,108,.25),#34d16c 42%,rgba(52,209,108,.25))",
              }}
            />
            <div className="absolute left-[46%] top-[44px] h-[24px] w-[2.5px] rounded bg-accent-dark" />
          </div>

          {/* point live */}
          <div className="relative mt-2 h-14">
            <div className="absolute left-[9%] top-0 h-4 w-0.5 bg-accent-dark" />
            <div className="absolute left-[9%] top-[13px] h-3 w-3 -translate-x-[45%] rounded-full border-[2.5px] border-night-card bg-accent-dark shadow-[0_0_10px_rgba(52,209,108,0.6)]" />
            <span className="absolute left-[3%] top-[34px] whitespace-nowrap text-[11px] font-semibold text-white">
              {t("landing.cote.liveLabel")} <span className="font-mono">€95</span>
            </span>
            <span
              className="absolute left-[13.5%] top-[19px] w-[12%]"
              style={{ borderTop: "1.5px dashed rgba(52,209,108,.6)" }}
            />
            <span className="absolute left-[26.5%] top-2 inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11.5px] font-bold text-accent-dark">
              {t("landing.cote.edgeLabel")} <span className="font-mono">&nbsp;−62%</span>
            </span>
          </div>

          <div className="mt-2 text-[11px] text-night-dim">
            {t("landing.cote.footnote")}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

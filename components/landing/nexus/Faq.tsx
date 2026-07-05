"use client";

// FAQ — questions directes, réponses directes. Grille 2 colonnes, reveal au scroll.
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { useT } from "@/lib/i18n/provider";

const QA = [
  { q: "landing.faq.q1.q", a: "landing.faq.q1.a" },
  { q: "landing.faq.q2.q", a: "landing.faq.q2.a" },
  { q: "landing.faq.q3.q", a: "landing.faq.q3.a" },
  { q: "landing.faq.q4.q", a: "landing.faq.q4.a" },
];

export function Faq() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" className="px-4 py-24" style={{ scrollMarginTop: 80 }}>
      <div ref={ref} className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="overline !text-accent-dark">{t("landing.faq.overline")}</span>
          <h2 className="headline mt-3 text-[30px] text-white sm:text-[36px]">
            {t("landing.faq.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          {QA.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="flex flex-col gap-2"
            >
              <span className="text-[15.5px] font-semibold text-white">{t(item.q)}</span>
              <span className="text-[14px] leading-relaxed text-night-text">{t(item.a)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

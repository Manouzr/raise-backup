"use client";

// Grille bento « features » (structure Nexus) — micro-animations live à
// l'intérieur des cartes : pastilles qui respirent, courbe de cote qui se TRACE
// progressivement (pathLength + aire qui se dévoile + point pulsant), chips qui
// arrivent en cascade, barres qui montent. Copy BidEdge, positif.
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Radar, LineChart, BookMarked, Lock, Layers } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const cardCls =
  "group relative rounded-2xl border border-night-border bg-night-card p-6 transition-all duration-300 hover:border-night-border2 hover:-translate-y-0.5";
const iconWrap = "mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-night-elev text-accent-dark";

/* pastilles de statut qui respirent */
function LiveDots() {
  const [dots, setDots] = useState([true, true, false, true, true]);
  useEffect(() => {
    const iv = setInterval(
      () => setDots((d) => d.map((_, i) => (i + Math.floor(performance.now() / 700)) % 4 !== 0)),
      1400,
    );
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex items-center gap-1.5">
      {dots.map((on, i) => (
        <motion.span
          key={i}
          className={`h-2 w-2 rounded-full ${on ? "bg-accent-dark" : "bg-night-border2"}`}
          animate={on ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

/* courbe de cote qui se TRACE (pathLength) + aire qui se dévoile + point pulsant */
function CoteSpark() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const d = "M 0 40 L 18 30 L 36 34 L 54 20 L 72 26 L 100 8";
  return (
    <svg ref={ref} viewBox="0 0 100 50" className="h-16 w-full overflow-visible">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d16c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#34d16c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* aire */}
      <motion.path
        d={`${d} L 100 50 L 0 50 Z`}
        fill="url(#cg)"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      {/* ligne tracée */}
      <motion.path
        d={d}
        fill="none"
        stroke="#34d16c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.3, ease: "easeInOut" }}
      />
      {/* point pulsant au bout */}
      <motion.circle
        cx="100"
        cy="8"
        r="3"
        fill="#34d16c"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 1.3, duration: 0.3 }}
        style={{ transformOrigin: "100px 8px" }}
      />
    </svg>
  );
}

/* barres qui montent en cascade quand la carte entre dans le viewport */
function GrowBars({ values }: { values: number[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="flex h-12 items-end gap-1.5">
      {values.map((v, i) => (
        <motion.span
          key={i}
          className="w-full flex-1 rounded-[3px] bg-accent-dark/70"
          style={{ transformOrigin: "bottom" }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={inView ? { scaleY: v, opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

export function Bento() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const radarChips = [
    t("landing.bento.chip1"),
    t("landing.bento.chip2"),
    t("landing.bento.chip3"),
    t("landing.bento.chip4"),
    t("landing.bento.chip5"),
  ];

  return (
    <section id="produit" className="px-4 py-24" style={{ scrollMarginTop: 80 }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="overline !text-accent-dark">{t("landing.bento.overline")}</span>
          <h2 className="headline mt-3 text-[34px] text-white sm:text-[40px]">
            {t("landing.bento.title")}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-night-text">
            {t("landing.bento.subtitle")}
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* grande carte — radar */}
          <motion.div variants={item} className={`${cardCls} md:col-span-2`}>
            <div className="flex items-start justify-between">
              <div>
                <div className={iconWrap}>
                  <Radar className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="text-[17px] font-semibold text-white">{t("landing.bento.radarTitle")}</h3>
                <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-night-text">
                  {t("landing.bento.radarDesc")}
                </p>
              </div>
              <LiveDots />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {radarChips.map((c, i) => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-full border border-night-border2 bg-night-elev px-3 py-1 text-[12px] font-medium text-night-text"
                >
                  {c}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* cote auditable */}
          <motion.div variants={item} className={cardCls}>
            <div className={iconWrap}>
              <LineChart className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <h3 className="text-[17px] font-semibold text-white">{t("landing.bento.quoteTitle")}</h3>
            <p className="mb-2 mt-1.5 text-[13.5px] leading-relaxed text-night-text">
              {t("landing.bento.quoteDesc")}
            </p>
            <CoteSpark />
          </motion.div>

          {/* journal */}
          <motion.div variants={item} className={cardCls}>
            <div className={iconWrap}>
              <BookMarked className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <h3 className="text-[17px] font-semibold text-white">{t("landing.bento.journalTitle")}</h3>
            <p className="mb-4 mt-1.5 text-[13.5px] leading-relaxed text-night-text">
              {t("landing.bento.journalDesc")}
            </p>
            <div className="rounded-xl bg-accent/10 px-3.5 py-3 text-[12.5px] font-semibold leading-snug text-accent-dark2">
              {t("landing.bento.journalQuote")}
            </div>
          </motion.div>

          {/* jamais d'autobid — cadré positif « tu gardes la main » */}
          <motion.div variants={item} className={cardCls}>
            <div className={iconWrap}>
              <Lock className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <h3 className="text-[17px] font-semibold text-white">{t("landing.bento.autobidTitle")}</h3>
            <p className="mb-4 mt-1.5 text-[13.5px] leading-relaxed text-night-text">
              {t("landing.bento.autobidDesc")}
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-night-border bg-night-elev px-3.5 py-2.5">
              <span className="flex-1 text-[12px] font-semibold text-white">{t("landing.bento.autobidTag")}</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent-dark">
                {t("landing.bento.autobidBadge")}
              </span>
              <span className="relative h-5 w-9 flex-none rounded-full bg-accent-dark">
                <span className="absolute left-[18px] top-0.5 h-4 w-4 rounded-full bg-white" />
              </span>
            </div>
          </motion.div>

          {/* sous-modèles — mini-barres qui montent */}
          <motion.div variants={item} className={cardCls}>
            <div className={iconWrap}>
              <Layers className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <h3 className="text-[17px] font-semibold text-white">{t("landing.bento.submodelsTitle")}</h3>
            <p className="mb-3 mt-1.5 text-[13.5px] leading-relaxed text-night-text">
              {t("landing.bento.submodelsDesc")}
            </p>
            <GrowBars values={[0.4, 0.62, 0.5, 0.85, 1, 0.72]} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

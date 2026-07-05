"use client";

// HERO — style Nexus (sombre, premium), couleurs + copy BidEdge.
// Titre en révélation « masque », CTA shimmer, preuve sociale, PUIS le clou :
// un mockup radar vivant (horloge + enchère qui tournent) survolé par le CURSEUR
// FANTÔME qui joue le tuto JUSQU'AU BOUT — il cherche une catégorie, ouvre
// l'article, l'IA analyse et suggère la bonne enchère, il « tape ». En boucle.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { GhostCursor } from "./GhostCursor";
import { useT } from "@/lib/i18n/provider";

/* ————— sim live (horloge + enchère) ————— */
const DUR = 58;
type Sim = { t: number; bid: number; bidders: number; flashUntil: number };

/* ————— cibles du curseur fantôme ————— */
type StepKey = "chip" | "card" | "confirm";

const reveal = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const, delay: 0.15 + i * 0.12 },
  }),
};

export function Hero() {
  const t = useT();
  /* --- sim live --- */
  const [sim, setSim] = useState<Sim>({ t: DUR, bid: 95, bidders: 6, flashUntil: 0 });
  useEffect(() => {
    const iv = setInterval(() => {
      setSim((s) => {
        let t = s.t - 1;
        let { bid, bidders, flashUntil } = s;
        if (t <= 0) {
          t = DUR;
          bid = 95;
          bidders = 6;
        } else if (t % 7 === 0 && bid < 165) {
          bid += 5;
          flashUntil = Date.now() + 2200;
          if (t % 14 === 0) bidders += 1;
        }
        return { t, bid, bidders, flashUntil };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const sug = sim.bid + 5;
  const mm = Math.floor(sim.t / 60);
  const ss = String(sim.t % 60).padStart(2, "0");
  const flashOn = sim.flashUntil > 0 && Date.now() < sim.flashUntil;
  const edge = "−" + Math.round((1 - sim.bid / 280) * 100) + "%";

  /* --- curseur fantôme : refs + timeline --- */
  const mockRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const elFor = (key: StepKey): HTMLElement | null => {
    if (key === "chip") return chipRef.current;
    if (key === "card") return cardRef.current;
    return confirmRef.current;
  };

  const [pos, setPos] = useState({ x: 150, y: 120 });
  const [active, setActive] = useState<StepKey | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const centerOf = (key: StepKey) => {
      const box = mockRef.current?.getBoundingClientRect();
      const el = elFor(key)?.getBoundingClientRect();
      if (!box || !el) return null;
      return { x: el.left - box.left + el.width / 2, y: el.top - box.top + el.height / 2 };
    };
    const step = async (
      key: StepKey,
      cap: string,
      dwell: number,
      opts: { opensPanel?: boolean; success?: boolean } = {},
    ) => {
      if (!alive) return false;
      setCaption(cap);
      const c = centerOf(key);
      if (c) setPos(c);
      await sleep(950); // trajet
      if (!alive) return false;
      setActive(key);
      setClicking(true);
      setClickKey((k) => k + 1);
      if (opts.opensPanel) setPanelOpen(true);
      if (opts.success) {
        setSuccess(true);
        setToast(true);
      }
      await sleep(240);
      setClicking(false);
      await sleep(dwell);
      return true;
    };

    async function run() {
      await sleep(1900); // laisse l'entrée du mockup se poser
      while (alive) {
        if (!(await step("chip", t("landing.hero.capChip"), 750))) return;
        if (!(await step("card", t("landing.hero.capCard"), 650, { opensPanel: true }))) return;
        if (!(await step("confirm", t("landing.hero.capConfirm"), 1750, { success: true }))) return;
        // reset de la boucle
        setActive(null);
        setCaption(null);
        setToast(false);
        setSuccess(false);
        setPanelOpen(false);
        await sleep(950);
      }
    }
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28">
      {/* fond : dégradé + grille + lueurs vertes */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night via-night to-night-2" />
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)]" />
      <div className="blob-drift pointer-events-none absolute left-1/2 top-[18%] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]" />
      <div className="pointer-events-none absolute right-[8%] top-[42%] h-[280px] w-[280px] rounded-full bg-accent-dark/8 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-night-border bg-night-2 px-4 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-accent-dark pulse-glow text-accent-dark" />
          <span className="text-[13px] text-night-text">{t("landing.hero.badge")}</span>
        </motion.div>

        <h1 className="font-display text-[13vw] font-semibold leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl lg:text-[76px]">
          <span className="block overflow-hidden pb-1">
            <motion.span className="block" variants={reveal} initial="hidden" animate="visible" custom={0}>
              {t("landing.hero.title1")}
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-1">
            <motion.span
              className="block bg-gradient-to-r from-accent-dark2 to-accent-dark bg-clip-text text-transparent"
              variants={reveal}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              {t("landing.hero.title2")}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-night-text sm:text-[17px]"
        >
          {t("landing.hero.lead")}{" "}
          <span className="font-semibold text-white">{t("landing.hero.leadStrong")}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.62 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/onboarding"
            className="shimmer-btn inline-flex h-12 items-center rounded-full bg-accent-dark px-7 text-[15px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.28)] transition-colors hover:bg-accent-dark2"
          >
            {t("landing.hero.ctaStart")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a
            href="#demo"
            className="inline-flex h-12 items-center rounded-full border border-night-border2 bg-white/5 px-7 text-[14.5px] font-semibold text-white transition-colors hover:border-night-text"
          >
            {t("landing.hero.ctaDemo")}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-5 text-[12px] text-night-dim"
        >
          {t("landing.hero.trialPre")} <span className="font-mono">14</span> {t("landing.hero.trialPost")}
        </motion.div>
      </div>

      {/* ================= MOCKUP LIVE + CURSEUR FANTÔME ================= */}
      <div id="demo" className="relative z-10 mx-auto mt-16 w-full max-w-[900px] px-2" style={{ scrollMarginTop: 90 }}>
        <motion.div
          ref={mockRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <GhostCursor x={pos.x} y={pos.y} clicking={clicking} caption={caption} clickKey={clickKey} />

          {/* widgets flottants décoratifs */}
          <FloatWidget className="-left-3 -top-6 hidden lg:block" delay={0.9}>
            <div className="flex items-center gap-2.5">
              <span className="flex flex-col text-left">
                <span className="text-[12px] font-semibold text-ink">{t("landing.hero.floatUnderTitle")}</span>
                <span className="text-[10.5px] text-muted">{t("landing.hero.floatUnderSub")}</span>
              </span>
              <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                −38%
              </span>
            </div>
          </FloatWidget>
          <FloatWidget className="-bottom-5 -right-4 hidden lg:block" delay={1.15} active={success}>
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                ✓
              </span>
              <span className="text-[12px] font-semibold text-ink">
                {t("landing.hero.floatReady")} <span className="font-mono">€{sug}</span>
              </span>
            </span>
          </FloatWidget>

          {/* toast déclenché au clic « Suggérer » */}
          <motion.div
            initial={false}
            animate={toast ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-3 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
          >
            {t("landing.hero.toastPre")} <span className="font-mono text-accent-dark">€{sug}</span> {t("landing.hero.toastPost")}
          </motion.div>

          {/* ===== cadre navigateur sombre ===== */}
          <div className="overflow-hidden rounded-[14px] border border-night-border bg-[#1c1c20] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2 border-b border-black/40 bg-[#242429] px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <div className="ml-3 flex h-7 flex-1 items-center gap-2 rounded-full bg-[#161619] px-3">
                <span className="h-2.5 w-2.5 rounded-full bg-night-dim/60" />
                <span className="font-mono text-[11.5px] text-night-text">app.bidedge.com/radar</span>
              </div>
            </div>

            {/* ===== contenu app (clair) — relatif pour porter le panneau IA ===== */}
            <div className="relative flex bg-app text-left text-ink">
              {/* sidebar */}
              <div className="hidden w-44 flex-none flex-col gap-1 border-r border-hairline bg-white px-3 py-4 sm:flex">
                <span className="headline px-2.5 pb-3 text-[15px]">
                  Bid<span className="text-accent">Edge</span>
                </span>
                <span className="flex items-center gap-2.5 rounded-full bg-accent-tint px-3 py-2 text-[12.5px] font-semibold text-accent-press">
                  <span className="h-3.5 w-3.5 flex-none rounded-[5px] bg-accent" />
                  {t("landing.hero.navRadar")}
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent animate-blink" />
                </span>
                <span className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-body">
                  <span className="h-3.5 w-3.5 flex-none rounded-[5px] bg-control-hover" />
                  {t("landing.hero.navCategories")}
                </span>
                <span className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-body">
                  <span className="h-3.5 w-3.5 flex-none rounded-[5px] bg-control-hover" />
                  {t("landing.hero.navJournal")}
                </span>
                <span className="mt-4 flex items-center gap-2 px-2.5 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-tint text-[11px] font-bold text-accent-press">
                    M
                  </span>
                  <span className="text-[12px] font-semibold">Manou</span>
                </span>
              </div>

              {/* zone radar */}
              <div className="min-w-0 flex-1 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="headline text-[19px]">{t("landing.hero.radarTitle")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-semibold text-accent-press">
                    <span className="h-[5px] w-[5px] rounded-full bg-accent animate-blink" />
                    {t("landing.hero.live")}
                  </span>
                  <span className="ml-auto font-mono text-[12px] text-muted">
                    {mm}:{ss}
                  </span>
                </div>

                {/* chips catégories — 1re = cible « chip » */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <div ref={chipRef}>
                    <motion.span
                      animate={active === "chip" ? { scale: 1.04 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        active === "chip" || active === "card" || active === "confirm"
                          ? "bg-accent text-white shadow-[0_4px_14px_rgba(29,167,87,0.4)]"
                          : "bg-ink text-white"
                      }`}
                    >
                      {t("landing.hero.chipSeiko")}
                    </motion.span>
                  </div>
                  <span className="inline-flex rounded-full border border-hairline bg-white px-3 py-1 text-[11px] font-medium text-body">
                    RAM DDR5
                  </span>
                  <span className="inline-flex rounded-full border border-hairline bg-white px-3 py-1 text-[11px] font-medium text-body">
                    GPU
                  </span>
                </div>

                {/* carte chaude — cible « card » (clic → ouvre l'analyse IA) */}
                <motion.div
                  ref={cardRef}
                  animate={
                    active === "card"
                      ? { y: -3, boxShadow: "0 16px 40px rgba(29,29,30,0.16)" }
                      : { y: 0, boxShadow: "0 1px 2px rgba(29,29,30,0.04)" }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="mt-3 flex cursor-pointer items-center gap-3 rounded-[14px] bg-white p-3"
                  style={{ border: `1.5px solid ${flashOn ? "#e3453a" : "#1da757"}` }}
                >
                  <span
                    className="h-14 w-[74px] flex-none rounded-[9px]"
                    style={{
                      background:
                        "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.18),transparent 46%),linear-gradient(140deg,#353b44,#101318)",
                    }}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[12.5px] font-semibold">
                      Seiko 6139 chrono 1972{" "}
                      <span className="text-[10px] font-normal text-muted">· 99.2%</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[15px] font-semibold">€{sim.bid}</span>
                      <span className="inline-flex rounded-full bg-accent-tint px-2 py-0.5 font-mono text-[10px] font-bold text-accent-press">
                        {edge} {t("landing.hero.vsQuote")} €240–320
                      </span>
                      <span className="font-mono text-[10px] text-muted">{t("landing.hero.bidders", { n: sim.bidders })}</span>
                    </span>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1.5">
                    <span
                      className="font-mono text-[17px] font-semibold"
                      style={{ color: sim.t <= 30 ? "#e3453a" : "#1d1d1e" }}
                    >
                      {mm}:{ss}
                    </span>
                    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-accent-tint px-3 text-[11.5px] font-semibold text-accent-press">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {t("landing.hero.analyzeAI")}
                    </span>
                  </span>
                </motion.div>

                {/* mini grille */}
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {[
                    { t: "Omega Seamaster", p: "€410", d: "−18%", c: "linear-gradient(140deg,#4a3f33,#171310)" },
                    { t: "RTX 4090 FE", p: "€520", d: "−33%", c: "linear-gradient(140deg,#2e2b3d,#131020)" },
                  ].map((it) => (
                    <div key={it.t} className="flex flex-col gap-1.5 rounded-[14px] border border-hairline bg-white p-2.5">
                      <span className="h-[46px] rounded-lg" style={{ background: it.c }} />
                      <span className="text-[11px] font-semibold">{it.t}</span>
                      <span className="flex items-baseline justify-between">
                        <span className="font-mono text-[12px] font-semibold">
                          {it.p} <span className="text-[10px] font-medium text-up-strong">{it.d}</span>
                        </span>
                      </span>
                    </div>
                  ))}
                  <div className="hidden flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-hairline bg-white/60 p-2.5 text-center sm:flex">
                    <span className="text-[11px] font-semibold text-body">{t("landing.hero.gridMore")}</span>
                    <span className="text-[9.5px] text-muted">{t("landing.hero.gridMoreSub")}</span>
                  </div>
                </div>
              </div>

              {/* ===== PANNEAU ANALYSE IA (overlay dans le mockup) ===== */}
              <AnimatePresence>
                {panelOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 z-20 bg-ink/30 backdrop-blur-[1.5px]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.98 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 top-1/2 z-30 w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-hairline bg-white p-5 shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-tint text-accent-press">
                          <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-[13.5px] font-semibold text-ink">
                            {t("landing.hero.panelTitle")}
                          </span>
                          <span className="text-[11px] text-muted">
                            {t("landing.hero.panelQuoteLabel")} <span className="font-mono">€240–320</span> · {t("landing.hero.panelMedian")}{" "}
                            <span className="font-mono">€280</span> · {t("landing.hero.panelSales", { n: 124 })}
                          </span>
                        </span>
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-muted">
                          <X className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                      </div>

                      <div className="mt-3.5 flex items-stretch gap-2.5">
                        <div className="flex flex-1 flex-col gap-0.5 rounded-[12px] bg-panel px-3 py-2.5">
                          <span className="overline !text-[9px]">{t("landing.hero.currentBid")}</span>
                          <span className="font-mono text-[17px] font-semibold text-ink">€{sim.bid}</span>
                          <span className="font-mono text-[10px] text-accent-press">{edge} {t("landing.hero.vsQuote")}</span>
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5 rounded-[12px] bg-accent-tint px-3 py-2.5">
                          <span className="overline !text-[9px] !text-accent-press">{t("landing.hero.aiSuggestion")}</span>
                          <span className="font-mono text-[17px] font-semibold text-accent-press">€{sug}</span>
                          <span className="text-[10px] text-accent-press/80">{t("landing.hero.panelUnderLimit")}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5">
                        {[
                          t("landing.hero.reason1"),
                          t("landing.hero.reason2"),
                          t("landing.hero.reasonEnding", { time: `${mm}:${ss}` }),
                        ].map((r) => (
                          <span key={r} className="flex items-start gap-2 text-[11.5px] leading-snug text-body">
                            <span className="mt-[5px] h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                            {r}
                          </span>
                        ))}
                      </div>

                      <motion.button
                        ref={confirmRef}
                        animate={active === "confirm" ? { scale: 0.96 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className={`mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-[13.5px] font-semibold text-white shadow-[0_8px_22px_rgba(29,167,87,0.35)] transition-colors ${
                          success ? "bg-accent-press" : "bg-accent"
                        }`}
                      >
                        {success ? (
                          <>{t("landing.hero.btnReady")} <span className="font-mono">€{sug}</span></>
                        ) : (
                          <>{t("landing.hero.btnSuggestPre")} <span className="font-mono">€{sug}</span> {t("landing.hero.btnSuggestPost")}</>
                        )}
                      </motion.button>
                      <div className="mt-2 text-center text-[10.5px] text-muted">
                        {t("landing.hero.panelFootnote")}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* mini-widget flottant qui « poppe » puis flotte doucement */
function FloatWidget({
  children,
  className = "",
  delay = 0,
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  active?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: active ? 1.06 : 1, opacity: 1 }}
      transition={{ scale: { type: "spring", stiffness: 300, damping: 18, delay }, opacity: { delay } }}
      className={`absolute z-20 rounded-[14px] border border-hairline bg-white px-3.5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

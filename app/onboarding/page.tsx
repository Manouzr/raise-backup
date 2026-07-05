"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/provider";
import { Toast } from "@/components/Toast";
import { GhostCursor } from "@/components/landing/nexus/GhostCursor";

// Onboarding 5 étapes — hors du layout (app) : hydrate() au mount, <Toast /> monté ici.
// DA « Nuit » (sombre premium, cohérente avec la landing) : rail sombre à gauche
// (progression), cartes night-card animées à droite sur un fond à lueur verte.
//
// LE CLOU : un CURSEUR FANTÔME (GhostCursor, réutilisé depuis la landing) joue une
// démo humaine tant que l'utilisateur n'a pas touché le formulaire. Il remplit le
// compte, passe à l'étape 2 et TAPE « nintendo switch » dans le champ catégorie,
// puis boucle. Il ne crée JAMAIS de compte (jamais finish(), jamais l'étape 5).

type Cat = { name: string; on: boolean };

const RAIL_STEPS = [
  { n: 1, key: "account" },
  { n: 2, key: "categories" },
  { n: 3, key: "guardrails" },
  { n: 4, key: "platforms" },
];

const PLATFORMS = [
  { id: "ebay", ini: "eB", name: "eBay" },
  { id: "catawiki", ini: "Ca", name: "Catawiki" },
  { id: "drouot", ini: "Dr", name: "Drouot" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

/** "€ 600" → 600 · valeur illisible → null */
function parseEuro(v: string): number | null {
  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const EASE: [number, number, number, number] = [0.2, 0.9, 0.3, 1];

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const hydrate = useApp((s) => s.hydrate);
  const notify = useApp((s) => s.notify);
  const setCategories = useApp((s) => s.setCategories);
  const setGuardrails = useApp((s) => s.setGuardrails);
  const setOnboarded = useApp((s) => s.setOnboarded);

  // Catégories initiales — construites via t() pour rester traduites (l'exemple
  // « nintendo switch » tapé par le curseur reste littéral, lui, plus bas).
  const initialCats: Cat[] = [
    { name: t("onboarding.cats.watches"), on: true },
    { name: t("onboarding.cats.ram"), on: true },
    { name: t("onboarding.cats.gpu"), on: false },
    { name: t("onboarding.cats.gameboy"), on: false },
    { name: t("onboarding.cats.keyboards"), on: false },
    { name: t("onboarding.cats.lenses"), on: false },
  ];

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cats, setCats] = useState<Cat[]>(initialCats);
  const [custom, setCustom] = useState("");
  const [budget, setBudget] = useState("€ 600");
  const [ceiling, setCeiling] = useState("€ 150");
  const [plat, setPlat] = useState<Record<PlatformId, boolean>>({
    ebay: false,
    catawiki: false,
    drouot: false,
  });
  const [scan, setScan] = useState(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Progression du premier scan : +3.4/s tant que l'étape 5 est affichée.
  useEffect(() => {
    if (step !== 5) return;
    const iv = setInterval(() => setScan((p) => Math.min(100, p + 3.4)), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const picked = cats.filter((c) => c.on);

  const toggleCat = (i: number) =>
    setCats((cs) => cs.map((c, j) => (j === i ? { ...c, on: !c.on } : c)));

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    setCats((cs) => [...cs, { name: v, on: true }]);
    setCustom("");
  };

  const next = () => {
    if (step === 1) {
      // La création réelle du compte se fait à la dernière étape (atomique) —
      // ici on valide juste de quoi éviter un aller-retour à la fin.
      if (!name.trim()) {
        setErr(t("onboarding.step1.errName"));
        return;
      }
      if (!mail.includes("@")) {
        setErr(t("onboarding.step1.errEmail"));
        return;
      }
      if (pass.length < 6) {
        setErr(t("onboarding.step1.errPassword"));
        return;
      }
      setErr(null);
    }
    if (step === 2 && picked.length === 0) {
      notify(t("onboarding.step2.pickOne"));
      return;
    }
    if (step === 4) setScan(0);
    setStep((s) => Math.min(5, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const connect = (id: PlatformId) => {
    setPlat((p) => ({ ...p, [id]: true }));
    if (id === "drouot") notify(t("onboarding.step4.drouotNotify"));
  };

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);

    const labels = picked.map((c) => c.name);
    const b = parseEuro(budget);
    const l = parseEuro(ceiling);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: mail.trim(),
          password: pass,
          categories: labels,
          ...(b !== null ? { monthlyBudget: b } : {}),
          ...(l !== null ? { defaultCeiling: l } : {}),
        }),
      });

      if (res.ok) {
        // En complément de la création serveur : on garde l'état client à jour.
        setCategories(labels);
        setGuardrails({
          ...(b !== null ? { monthlyBudget: b } : {}),
          ...(l !== null ? { defaultCeiling: l } : {}),
        });
        setOnboarded(true);
        notify(t("onboarding.step5.firstScanDone"));
        // navigation dure : le cookie de session vient d'être posé, il faut
        // retraverser le middleware (le cache router resservirait la landing)
        window.location.assign("/");
        return;
      }

      if (res.status === 409) {
        // e-mail déjà pris → retour à l'étape 1, erreur inline
        setErr(t("onboarding.errors.accountExists"));
        setStep(1);
        setSubmitting(false);
        return;
      }

      // 422 (ou autre) → on affiche le message renvoyé par le serveur
      let message = t("onboarding.errors.createFailed");
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (data.error?.message) message = data.error.message;
      } catch {
        // corps illisible — message par défaut
      }
      notify(message);
      setSubmitting(false);
    } catch {
      notify(t("onboarding.errors.createRetry"));
      setSubmitting(false);
    }
  };

  const pct = `${Math.round(scan)}%`;
  const scanLabel =
    scan < 35
      ? t("onboarding.step5.scanPast", { n: picked.length })
      : scan < 75
        ? t("onboarding.step5.scanLive")
        : t("onboarding.step5.scanCalibrate");

  /* ————————————————————————————————————————————————————————————————
     CURSEUR FANTÔME — démo auto-jouée (hand-off au 1er geste réel)
     ———————————————————————————————————————————————————————————————— */
  const mockRef = useRef<HTMLDivElement>(null); // conteneur relative → repère des coords
  const nameRef = useRef<HTMLInputElement>(null);
  const mailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const customRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  const [pos, setPos] = useState({ x: 46, y: 34 });
  const [clicking, setClicking] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const [caption, setCaption] = useState<string | null>(null);
  const [userTook, setUserTook] = useState(false);
  const userTookRef = useRef(false);

  // handlers frais pour la démo (évite les closures périmées de l'effet mount-only)
  const demoApi = useRef({ next, addCustom });
  demoApi.current = { next, addCustom };

  // HAND-OFF : au 1er vrai geste, on tue la démo et on repart d'un formulaire vierge.
  const takeOver = () => {
    if (userTookRef.current) return;
    userTookRef.current = true;
    setUserTook(true);
    setCaption(null);
    setClicking(false);
    setStep(1);
    setName("");
    setMail("");
    setPass("");
    setCustom("");
    setCats(initialCats.map((c) => ({ ...c })));
    setErr(null);
    setScan(0);
  };

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const guard = () => alive && !userTookRef.current;

    // centre d'une cible relativement au conteneur mockRef (recalculé à chaque appel,
    // car les cibles changent selon l'étape montée).
    const centerOf = (el: HTMLElement | null) => {
      const box = mockRef.current?.getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      if (!box || !r) return null;
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    };

    const moveTo = async (el: HTMLElement | null, travel: number) => {
      if (!guard()) return false;
      const c = centerOf(el);
      if (c) setPos(c);
      await sleep(travel); // trajet (spring dans GhostCursor)
      return guard();
    };

    const clickEl = async (el: HTMLElement | null) => {
      if (!guard()) return false;
      const c = centerOf(el);
      if (c) setPos(c);
      await sleep(480); // approche
      if (!guard()) return false;
      setClicking(true);
      setClickKey((k) => k + 1);
      await sleep(250);
      setClicking(false);
      await sleep(170);
      return guard();
    };

    // typewriter : « tape » caractère par caractère via un setter React.
    const typeInto = async (
      setter: (v: string) => void,
      text: string,
      speed: number,
    ) => {
      for (let i = 1; i <= text.length; i++) {
        if (!guard()) return false;
        setter(text.slice(0, i));
        await sleep(speed);
      }
      return guard();
    };

    async function run() {
      await sleep(1100); // laisse l'entrée de la carte se poser

      while (guard()) {
        /* ————— ÉTAPE 1 : on crée le compte ————— */
        setCaption(t("onboarding.cursor.creatingAccount"));
        if (!(await moveTo(nameRef.current, 820))) return;
        if (!(await typeInto(setName, "Manou", 95))) return;
        await sleep(220);

        setCaption(t("onboarding.cursor.email"));
        if (!(await moveTo(mailRef.current, 680))) return;
        if (!(await typeInto(setMail, "manou@exemple.fr", 52))) return;
        await sleep(200);

        if (!(await moveTo(passRef.current, 620))) return;
        if (!(await typeInto(setPass, "bidedge", 70))) return;
        await sleep(220);

        setCaption(t("onboarding.cursor.offWeGo"));
        if (!(await clickEl(continueRef.current))) return;
        if (!guard()) return;
        demoApi.current.next(); // validation réelle → passe à l'étape 2
        await sleep(760); // laisse l'AnimatePresence monter la carte 2

        /* ————— ÉTAPE 2 : on tape la catégorie ————— */
        if (!guard()) return;
        setCaption(t("onboarding.cursor.typingCategory"));
        if (!(await moveTo(customRef.current, 820))) return;

        // valeur d'exemple tapée dans le champ — reste littérale (produit, pas UI)
        setCaption(t("onboarding.cursor.exampleProduct"));
        if (!(await typeInto(setCustom, "nintendo switch", 55))) return;
        await sleep(320);

        setCaption(t("onboarding.cursor.added"));
        if (!(await clickEl(addRef.current))) return;
        if (!guard()) return;
        demoApi.current.addCustom();
        await sleep(1150);

        /* ————— RESET propre (jamais au-delà de l'étape 2, jamais finish) ————— */
        if (!guard()) return;
        setCaption(null);
        setClicking(false);
        setName("");
        setMail("");
        setPass("");
        setCustom("");
        setCats(initialCats.map((c) => ({ ...c })));
        setErr(null);
        setStep(1);
        await sleep(820); // laisse la carte 1 se remonter avant de re-mesurer
      }
    }

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardBase =
    "max-w-full flex flex-col rounded-card border border-night-border bg-night-card shadow-[0_28px_70px_rgba(0,0,0,0.55)]";
  const cardBySteps: Record<number, string> = {
    1: `${cardBase} w-[520px] gap-[14px] p-[34px]`,
    2: `${cardBase} w-[560px] gap-4 p-[34px]`,
    3: `${cardBase} w-[540px] gap-[6px] p-[34px]`,
    4: `${cardBase} w-[540px] gap-[6px] p-[34px]`,
    5: `${cardBase} w-[520px] gap-4 p-[38px] text-center`,
  };

  const inputCls =
    "h-[46px] rounded-xl border border-night-border bg-night-elev px-4 text-sm text-white placeholder:text-night-dim outline-none transition-colors focus:border-night-border2";
  const ctaCls =
    "shimmer-btn flex h-12 cursor-pointer items-center justify-center rounded-full bg-accent-dark text-[14.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2";
  const secondaryCls =
    "inline-flex h-[46px] cursor-pointer items-center rounded-full border border-night-border bg-night-elev px-5 text-[13.5px] font-semibold text-night-text transition-colors hover:border-night-border2 hover:bg-night-border hover:text-white";

  return (
    <div className="flex h-screen overflow-hidden bg-night text-night-text">
      {/* ————— Rail sombre — progression ————— */}
      <div className="relative flex w-[300px] flex-none flex-col overflow-hidden border-r border-night-border bg-night-2 px-7 py-8">
        <div
          className="pointer-events-none absolute -left-16 top-24 h-[320px] w-[320px] rounded-full bg-accent/10 blur-[120px]"
          aria-hidden
        />
        <div className="headline relative text-[20px] text-white">
          Bid<span className="text-accent-dark">Edge</span>
        </div>
        <div className="relative mt-[44px] flex flex-col gap-[22px]">
          {RAIL_STEPS.map((st, i) => {
            const done = step > st.n || step === 5;
            const cur = step === st.n;
            return (
              <motion.div
                key={st.n}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE }}
                className="flex items-center gap-[13px]"
              >
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? "bg-accent-dark text-night"
                      : cur
                        ? "bg-accent-dark text-night shadow-[0_0_0_4px_rgba(52,209,108,0.14)]"
                        : "border border-night-border bg-night-elev text-night-dim"
                  }`}
                >
                  {done ? "✓" : st.n}
                </span>
                <span
                  className={`text-[13.5px] font-semibold transition-colors ${
                    done || cur ? "text-white" : "text-night-dim"
                  }`}
                >
                  {t(`onboarding.rail.${st.key}`)}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="flex-1" />
        <div className="relative text-xs leading-[1.5] text-night-dim">
          {t("onboarding.rail.trialPre")} <span className="font-mono">14</span>{" "}
          {t("onboarding.rail.trialPost")}
          <br />
          {t("onboarding.rail.footer")}
        </div>
      </div>

      {/* ————— Zone sombre premium — cartes d'étape + curseur fantôme ————— */}
      <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden p-8">
        {/* fond : dégradé + grille + lueur verte (comme le Hero) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night via-night to-night-2" />
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_62%_55%_at_50%_35%,black,transparent)]" />
        <div className="blob-drift pointer-events-none absolute left-1/2 top-[22%] h-[440px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px]" />

        {/* conteneur RELATIVE : porte le curseur (absolute) — hand-off au 1er geste réel */}
        <div
          ref={mockRef}
          onPointerDownCapture={takeOver}
          onFocusCapture={takeOver}
          onKeyDownCapture={takeOver}
          className="relative z-10"
        >
          {!userTook && (
            <GhostCursor
              x={pos.x}
              y={pos.y}
              clicking={clicking}
              caption={caption}
              clickKey={clickKey}
            />
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 22, scale: 0.965 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
              className={cardBySteps[step]}
            >
              {step === 1 && (
                <>
                  <div className="headline text-[28px] text-white">
                    {t("onboarding.step1.title")}
                  </div>
                  <div className="-mt-[6px] text-[13.5px] text-night-text">
                    {t("onboarding.step1.subtitle")}
                  </div>
                  <input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (err) setErr(null);
                    }}
                    placeholder={t("onboarding.step1.firstName")}
                    className={inputCls}
                  />
                  <input
                    ref={mailRef}
                    value={mail}
                    onChange={(e) => {
                      setMail(e.target.value);
                      if (err) setErr(null);
                    }}
                    placeholder={t("onboarding.step1.email")}
                    type="email"
                    autoComplete="email"
                    className={inputCls}
                  />
                  <input
                    ref={passRef}
                    value={pass}
                    onChange={(e) => {
                      setPass(e.target.value);
                      if (err) setErr(null);
                    }}
                    placeholder={t("onboarding.step1.password")}
                    type="password"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  {err && <div className="-mt-1 text-[13px] leading-snug text-down">{err}</div>}
                  <motion.button
                    ref={continueRef}
                    whileTap={{ scale: 0.97 }}
                    onClick={next}
                    className={`mt-1 ${ctaCls}`}
                  >
                    {t("onboarding.step1.continue")}
                  </motion.button>
                  <div className="text-center text-[13px] text-night-text">
                    {t("onboarding.step1.haveAccount")}{" "}
                    <button
                      onClick={() => router.push("/login")}
                      className="cursor-pointer font-semibold text-accent-dark transition-colors hover:text-accent-dark2"
                    >
                      {t("onboarding.step1.login")}
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="headline text-[28px] text-white">
                    {t("onboarding.step2.title")}
                  </div>
                  <div className="-mt-2 text-[13.5px] text-night-text">
                    {t("onboarding.step2.subtitle")}
                  </div>
                  <div className="flex flex-wrap gap-[9px]">
                    {cats.map((c, i) => (
                      <button
                        key={c.name}
                        onClick={() => toggleCat(i)}
                        className={`inline-flex cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] px-4 py-[9px] text-[13px] font-semibold transition-colors ${
                          c.on
                            ? "border-accent-dark/40 bg-accent/15 text-accent-dark"
                            : "border-night-border text-night-text hover:border-night-border2 hover:text-white"
                        }`}
                      >
                        <span>{c.on ? "✓" : "+"}</span> {c.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-[9px]">
                    <input
                      ref={customRef}
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addCustom();
                      }}
                      placeholder={t("onboarding.step2.customPlaceholder")}
                      className="h-[42px] flex-1 rounded-full border border-night-border bg-night-elev px-[17px] text-[13px] text-white placeholder:text-night-dim outline-none transition-colors focus:border-night-border2"
                    />
                    <button
                      ref={addRef}
                      onClick={addCustom}
                      className="inline-flex h-[42px] cursor-pointer items-center rounded-full border border-night-border bg-night-elev px-[17px] text-[13px] font-semibold text-night-text transition-colors hover:border-night-border2 hover:bg-night-border hover:text-white"
                    >
                      {t("onboarding.step2.add")}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <button onClick={back} className={secondaryCls}>
                      {t("onboarding.step2.back")}
                    </button>
                    <span className="flex-1" />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={next}
                      className={`inline-flex h-12 cursor-pointer items-center rounded-full px-6 text-[14.5px] font-semibold transition-colors ${
                        picked.length === 0
                          ? "cursor-not-allowed bg-night-border text-night-dim"
                          : "bg-accent-dark text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] hover:bg-accent-dark2"
                      }`}
                    >
                      {t("onboarding.step2.continue", { n: picked.length })}
                    </motion.button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="headline text-[28px] text-white">
                    {t("onboarding.step3.title")}
                  </div>
                  <div className="mb-3 mt-[2px] text-[13.5px] text-night-text">
                    {t("onboarding.step3.subtitle")}
                  </div>
                  <div className="flex items-center justify-between py-[11px] text-[13.5px] text-night-text">
                    <span>{t("onboarding.step3.budget")}</span>
                    <input
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="h-10 w-[120px] rounded-full border border-night-border bg-night-elev px-[14px] text-center font-mono text-[13px] text-white outline-none transition-colors focus:border-night-border2"
                    />
                  </div>
                  <div className="h-px bg-night-border" />
                  <div className="flex items-center justify-between py-[11px] text-[13.5px] text-night-text">
                    <span>{t("onboarding.step3.ceiling")}</span>
                    <input
                      value={ceiling}
                      onChange={(e) => setCeiling(e.target.value)}
                      className="h-10 w-[120px] rounded-full border border-night-border bg-night-elev px-[14px] text-center font-mono text-[13px] text-white outline-none transition-colors focus:border-night-border2"
                    />
                  </div>
                  <div className="h-px bg-night-border" />
                  <div className="flex items-center justify-between gap-[14px] py-[13px] text-[13.5px]">
                    <span className="flex flex-col gap-[3px]">
                      <span className="font-semibold text-white">
                        {t("onboarding.step3.humanTitle")}
                      </span>
                      <span className="text-xs text-night-dim">
                        {t("onboarding.step3.humanHint")}
                      </span>
                    </span>
                    <span className="flex items-center gap-[9px]">
                      <span className="inline-flex items-center rounded-full bg-accent/15 px-[10px] py-[3px] text-[10.5px] font-bold text-accent-dark">
                        {t("onboarding.step3.alwaysOn")}
                      </span>
                      <button
                        onClick={() => notify(t("onboarding.step3.permanentNotify"))}
                        aria-label={t("onboarding.step3.humanAria")}
                        className="relative h-[21px] w-9 flex-none cursor-default rounded-full bg-accent-dark opacity-60"
                      >
                        <span className="absolute left-[17px] top-[2px] h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.35)]" />
                      </button>
                    </span>
                  </div>
                  <div className="mt-[10px] flex items-center gap-3">
                    <button onClick={back} className={secondaryCls}>
                      {t("onboarding.step3.back")}
                    </button>
                    <span className="flex-1" />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={next}
                      className="inline-flex h-12 cursor-pointer items-center rounded-full bg-accent-dark px-6 text-[14.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2"
                    >
                      {t("onboarding.step3.continue")}
                    </motion.button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="headline text-[28px] text-white">
                    {t("onboarding.step4.title")}
                  </div>
                  <div className="mb-3 mt-[2px] text-[13.5px] text-night-text">
                    {t("onboarding.step4.subtitle")}
                  </div>
                  {PLATFORMS.map((p, i) => (
                    <div key={p.id}>
                      {i > 0 && <div className="h-px bg-night-border" />}
                      <div className="flex items-center gap-3 py-[10px] text-[13.5px]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-night-border bg-night-elev text-[11px] font-bold text-night-text">
                          {p.ini}
                        </span>
                        <span className="font-semibold text-white">{p.name}</span>
                        <span className="flex-1" />
                        {plat[p.id] ? (
                          <span className="inline-flex items-center rounded-full bg-accent/15 px-[13px] py-[5px] text-[11.5px] font-bold text-accent-dark">
                            {t("onboarding.step4.connected")}
                          </span>
                        ) : (
                          <button
                            onClick={() => connect(p.id)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-full border border-night-border bg-night-elev px-4 text-[12.5px] font-semibold text-night-text transition-colors hover:border-night-border2 hover:bg-night-border hover:text-white"
                          >
                            {t("onboarding.step4.connect")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-[14px] flex items-center gap-3">
                    <button onClick={back} className={secondaryCls}>
                      {t("onboarding.step4.back")}
                    </button>
                    <span className="flex-1" />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={next}
                      className="shimmer-btn inline-flex h-12 cursor-pointer items-center rounded-full bg-accent-dark px-6 text-[14.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.28)] transition-colors hover:bg-accent-dark2"
                    >
                      {t("onboarding.step4.runScan")}
                    </motion.button>
                  </div>
                </>
              )}

              {step === 5 &&
                (scan < 100 ? (
                  <>
                    <div className="headline text-[28px] text-white">
                      {t("onboarding.step5.title")}
                    </div>
                    <div className="-mt-2 text-[13.5px] text-night-text">{scanLabel}</div>
                    <div className="mt-[10px] h-[10px] overflow-hidden rounded-full bg-night-border">
                      <div
                        className="h-full rounded-full bg-accent-dark"
                        style={{ width: pct, transition: "width 1s linear" }}
                      />
                    </div>
                    <div className="font-mono text-[13px] text-night-dim">{pct}</div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-14 w-14 animate-card-in items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent-dark">
                      ✓
                    </div>
                    <div className="headline text-[28px] text-white">
                      {t("onboarding.step5.doneTitle")}
                    </div>
                    <div className="-mt-2 text-[13.5px] text-night-text">
                      {t("onboarding.step5.doneSubtitle", { n: picked.length })}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {picked.map((c) => (
                        <span
                          key={c.name}
                          className="inline-flex items-center rounded-full bg-accent/15 px-[13px] py-[6px] text-xs font-semibold text-accent-dark"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={finish}
                      disabled={submitting}
                      className="shimmer-btn mx-auto mt-2 inline-flex h-[50px] cursor-pointer items-center justify-center rounded-full bg-accent-dark px-7 text-[15px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.28)] transition-colors hover:bg-accent-dark2 disabled:cursor-not-allowed disabled:bg-night-border disabled:text-night-dim disabled:shadow-none"
                    >
                      {submitting ? t("onboarding.step5.creating") : t("onboarding.step5.open")}
                    </motion.button>
                  </>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Toast />
    </div>
  );
}

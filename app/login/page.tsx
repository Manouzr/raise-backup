"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useApp } from "@/lib/store";
import { useT, type TFunc } from "@/lib/i18n/provider";
import { Toast } from "@/components/Toast";

// Connexion — écran sombre « Nuit » plein écran, hors du layout (app).
// Colonne gauche : promesse + BULLES produit flottantes (entrée blur+spring en
// cascade, puis flottement doux). Colonne droite : carte de connexion.

const GRAD_WATCH =
  "radial-gradient(120% 90% at 22% 12%,rgba(255,255,255,.18),transparent 46%),linear-gradient(140deg,#353b44,#101318)";

/** Bulle flottante : apparition blur + spring (cascade via `delay`), puis
 *  flottement continu (classe CSS `animate-floaty`/`floaty2`). Le tilt de base
 *  est porté par la carte enfant pour composer avec les transforms. */
function Bubble({
  children,
  className = "",
  delay = 0,
  drift = "animate-floaty",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  drift?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.55, y: 30, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        default: { type: "spring", stiffness: 210, damping: 17, delay },
        opacity: { duration: 0.45, delay, ease: "easeOut" },
        filter: { duration: 0.55, delay, ease: "easeOut" },
      }}
      className={`absolute hidden lg:block ${className}`}
    >
      <div className={drift}>{children}</div>
    </motion.div>
  );
}

function Bubbles({ t }: { t: TFunc }) {
  return (
    <>
      {/* lot live */}
      <Bubble className="right-[7%] top-[14%]" delay={0.5} drift="animate-floaty">
        <div className="w-[232px] -rotate-2 rounded-card border border-night-border bg-night-card p-3 shadow-[0_22px_55px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-2.5">
            <span className="h-11 w-14 flex-none rounded-[9px]" style={{ background: GRAD_WATCH }} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-white">Seiko 6139</span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[13px] font-semibold text-white">€95</span>
                <span className="font-mono text-[11px] text-down">0:41</span>
              </span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-dark animate-blink" />
              {t("login.bubble.live")}
            </span>
            <span className="rounded-full bg-accent-dark px-2 py-0.5 font-mono text-[10px] font-bold text-night">
              −38%
            </span>
          </div>
        </div>
      </Bubble>

      {/* enchère suggérée */}
      <Bubble className="bottom-[12%] left-[5%]" delay={0.2} drift="animate-floaty">
        <div className="w-[220px] rotate-2 rounded-card border border-night-border bg-night-card p-4 shadow-[0_22px_55px_rgba(0,0,0,0.55)]">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-night-dim">
            {t("login.bubble.suggested")}
          </div>
          <div className="mb-2.5 mt-1 font-mono text-[26px] font-semibold text-white">€100</div>
          <div className="inline-flex h-[34px] items-center justify-center rounded-full bg-accent-dark px-4 text-xs font-semibold text-night shadow-[0_8px_22px_rgba(52,209,108,0.3)]">
            {t("login.bubble.bidNow")}
          </div>
        </div>
      </Bubble>

      {/* ton edge — jauge animée */}
      <Bubble className="bottom-[26%] left-[33%]" delay={0.35} drift="animate-floaty2">
        <div className="w-[202px] -rotate-3 rounded-card border border-night-border bg-night-card p-4 shadow-[0_22px_55px_rgba(0,0,0,0.55)]">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-night-dim">
            {t("login.bubble.edge")}
          </div>
          <div className="relative mt-3 h-3">
            <div className="absolute inset-x-0 top-[2px] h-2 rounded-full bg-night-border" />
            <motion.div
              className="absolute left-[12%] top-[2px] h-2 rounded-full bg-accent/30"
              initial={{ width: 0 }}
              animate={{ width: "52%" }}
              transition={{ delay: 1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="absolute left-[12%] top-[-2px] h-3 w-3 rounded-full border-[2.5px] border-night-card bg-accent-dark" />
          </div>
          <div className="mt-2.5 font-mono text-xs text-accent-dark">{t("login.bubble.edgeValue")}</div>
        </div>
      </Bubble>

      {/* gagné */}
      <Bubble className="right-[4%] top-[45%]" delay={0.65} drift="animate-floaty">
        <div className="inline-flex rotate-3 items-center gap-2 rounded-full border border-night-border bg-night-card px-3.5 py-2 shadow-[0_18px_44px_rgba(0,0,0,0.5)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-dark text-[11px] font-bold text-night">
            ✓
          </span>
          <span className="text-[12px] font-semibold text-white">
            {t("login.bubble.won")} · <span className="font-mono">€118</span>
          </span>
        </div>
      </Bubble>
    </>
  );
}

export default function LoginPage() {
  const hydrate = useApp((s) => s.hydrate);
  const t = useT();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-night text-white">
      {/* fond sombre — grille masquée + lueur verte floue, comme le Hero */}
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_30%_40%,black,transparent)]" />
      <div className="pointer-events-none absolute left-[16%] top-[26%] h-[520px] w-[620px] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]" />
      <div className="pointer-events-none absolute right-[6%] top-[40%] h-[280px] w-[280px] rounded-full bg-accent-dark/8 blur-[100px]" />

      {/* Colonne gauche — promesse + bulles produit flottantes */}
      <div className="relative z-10 flex flex-[1.2] flex-col justify-center px-[84px]">
        <div className="mb-10 headline text-[22px] text-white">
          Bid<span className="text-accent-dark">Edge</span>
        </div>
        <h1 className="font-display text-[56px] font-semibold leading-[1.02] tracking-[-0.02em] text-white">
          {t("login.headline1")}
          <br />
          <span className="bg-gradient-to-r from-accent-dark2 to-accent-dark bg-clip-text text-transparent">
            {t("login.headline2")}
          </span>
        </h1>
        <p className="mt-5 max-w-[420px] text-[15.5px] leading-[1.55] text-night-text">
          {t("login.subtitle")}
        </p>

        <Bubbles t={t} />
      </div>

      {/* Colonne droite — carte de connexion (useSearchParams → Suspense) */}
      <Suspense fallback={<div className="flex flex-1 items-center justify-center p-10" />}>
        <LoginCard />
      </Suspense>

      <Toast />
    </div>
  );
}

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; isSuperAdmin: boolean };
        // navigation DURE (pas router.push) : le cookie de session vient
        // d'être posé, il faut retraverser le middleware — le cache client
        // du router resservirait la landing "anonyme" de la racine.
        window.location.assign(data.isSuperAdmin ? "/admin" : (searchParams.get("next") ?? "/"));
        return;
      }
      // 401 → identifiants ; autres → message serveur si présent
      let message = t("login.err.credentials");
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (res.status !== 401 && data.error?.message) message = data.error.message;
      } catch {
        // corps illisible — on garde le message par défaut
      }
      setError(message);
      setLoading(false);
    } catch {
      setError(t("login.err.network"));
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-10">
      <div className="flex w-[384px] animate-card-in flex-col gap-[14px] rounded-card border border-night-border bg-night-card p-8 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <div className="headline text-[26px] text-white">{t("login.card.title")}</div>
        <div className="-mt-2 text-[13px] text-night-text">{t("login.card.subtitle")}</div>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("login.card.email")}
          type="email"
          autoComplete="email"
          className="h-12 rounded-xl border border-night-border bg-night-elev px-4 text-sm text-white placeholder:text-night-dim"
        />
        <input
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={t("login.card.password")}
          type="password"
          autoComplete="current-password"
          className="h-12 rounded-xl border border-night-border bg-night-elev px-4 text-sm text-white placeholder:text-night-dim"
        />
        {error && <div className="-mt-1 text-[13px] leading-snug text-down">{error}</div>}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={loading}
          className="flex h-12 cursor-pointer items-center justify-center rounded-full bg-accent-dark text-[14.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? t("login.card.signingIn") : t("login.card.signIn")}
        </motion.button>
        <div className="flex items-center gap-3 text-xs text-night-dim">
          <span className="h-px flex-1 bg-night-border" />
          {t("login.card.or")}
          <span className="h-px flex-1 bg-night-border" />
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="cursor-pointer text-center text-[13.5px] font-semibold text-accent-dark transition-colors hover:text-accent-dark2"
        >
          {t("login.card.createAccount")}
        </button>
        <div className="mt-[6px] text-center text-[11px] text-night-dim">{t("login.card.trial")}</div>
      </div>
    </div>
  );
}

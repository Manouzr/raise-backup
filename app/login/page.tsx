"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useApp } from "@/lib/store";
import { Toast } from "@/components/Toast";

// Connexion — écran sombre plein écran, hors du layout (app) :
// on hydrate le store et on monte le Toast nous-mêmes.

export default function LoginPage() {
  const hydrate = useApp((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-ink">
      {/* Colonne gauche — promesse + cartes produit flottantes */}
      <div className="relative flex flex-[1.2] flex-col justify-center px-[84px]">
        <div className="mb-10 text-[19px] font-bold tracking-[-0.01em] text-white">
          Bid<span className="text-accent-dark">Edge</span>
        </div>
        <h1 className="text-[52px] font-normal leading-[1.04] tracking-[-0.025em] text-white">
          L&apos;avantage,
          <br />
          à chaque enchère.
        </h1>
        <p className="mt-5 max-w-[420px] text-[15.5px] leading-[1.55] text-dark-text">
          La cote du marché en continu, une suggestion au bon moment — et c&apos;est toujours toi
          qui enchéris.
        </p>

        {/* Carte "Enchère suggérée" */}
        <div className="absolute bottom-[110px] left-[84px] w-[238px] animate-floaty rounded-[20px] border border-dark-border bg-dark-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">
            Enchère suggérée
          </div>
          <div className="mb-[10px] mt-1 font-mono text-[26px] font-semibold text-accent-dark">
            €100
          </div>
          <div className="inline-flex h-[34px] items-center justify-center rounded-full bg-accent px-4 text-xs font-semibold text-white">
            Enchérir maintenant
          </div>
        </div>

        {/* Carte "Ton edge" */}
        <div className="absolute bottom-[210px] left-[300px] w-[212px] animate-floaty2 rounded-[20px] border border-dark-border bg-dark-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">
            Ton edge
          </div>
          <div className="relative mt-3 h-3">
            <div className="absolute inset-x-0 top-[2px] h-2 rounded-full bg-dark-border" />
            <div
              className="absolute left-[38%] top-[2px] h-2 w-[52%] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg,rgba(63,182,183,.35),#3fb6b7 45%,rgba(63,182,183,.35))",
              }}
            />
            <div className="absolute left-[12%] top-[-2px] h-3 w-3 rounded-full border-[2.5px] border-dark-card bg-accent-dark" />
          </div>
          <div className="mt-[10px] font-mono text-xs text-accent-dark2">−62% vs cote</div>
        </div>
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
        if (data.isSuperAdmin) {
          router.push("/admin");
        } else {
          router.push(searchParams.get("next") ?? "/");
        }
        return;
      }
      // 401 → identifiants ; autres → message serveur si présent
      let message = "E-mail ou mot de passe incorrect";
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (res.status !== 401 && data.error?.message) message = data.error.message;
      } catch {
        // corps illisible — on garde le message par défaut
      }
      setError(message);
      setLoading(false);
    } catch {
      setError("Connexion impossible. Réessaie dans un instant.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="flex w-[384px] animate-card-in flex-col gap-[14px] rounded-3xl border border-dark-border bg-dark-card p-8">
        <div className="text-[22px] font-normal tracking-[-0.02em] text-white">Connexion</div>
        <div className="-mt-2 text-[13px] text-dark-text">
          Reprends la chasse là où tu l&apos;as laissée.
        </div>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="E-mail"
          type="email"
          autoComplete="email"
          className="h-[46px] rounded-xl border border-dark-input-border bg-dark-input px-4 text-sm text-white"
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
          placeholder="Mot de passe"
          type="password"
          autoComplete="current-password"
          className="h-[46px] rounded-xl border border-dark-input-border bg-dark-input px-4 text-sm text-white"
        />
        {error && <div className="-mt-1 text-[13px] leading-snug text-down">{error}</div>}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={submit}
          disabled={loading}
          className="flex h-[46px] cursor-pointer items-center justify-center rounded-full bg-accent text-[14.5px] font-semibold text-white transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:bg-accent-disabled"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </motion.button>
        <div className="flex items-center gap-3 text-xs text-[#3c4046]">
          <span className="h-px flex-1 bg-dark-border" />
          ou
          <span className="h-px flex-1 bg-dark-border" />
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="cursor-pointer text-center text-[13.5px] font-semibold text-accent-dark transition-colors hover:text-[#6fd0d0]"
        >
          Créer un compte →
        </button>
        <div className="mt-[6px] text-center text-[11px] text-body">
          Essai Pro 14 jours · sans carte bancaire
        </div>
      </div>
    </div>
  );
}

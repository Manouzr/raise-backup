"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Toggle } from "@/components/settings/Toggle";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/provider";
import { PLANS } from "@/lib/billing/plans";
import { Reveal } from "@/components/ui/taap";

// Réglages — compte, garde-fous, notifications, plateformes.
// Le garde-fou "confirmation humaine" est permanent : le toggle est
// verrouillé ON et ne peut JAMAIS se désactiver.

const CARD =
  "rounded-card border border-night-border bg-night-card px-6 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-colors hover:border-night-border2";
const LABEL = "overline !text-night-dim";

type Plan = "chasseur" | "pro" | "equipe";

type Me = {
  user: { id: string; name: string; email: string; isSuperAdmin: boolean };
  org: {
    id: string;
    name: string;
    plan: Plan;
    planLabel: string;
    priceEUR: number;
    status: string;
    statusLabel: string;
    trialDaysLeft: number | null;
  };
};

/** "€ 600" → 600 ; null si rien d'exploitable */
function parseEuro(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function GuardrailInput({
  value,
  onCommit,
  label,
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(`€ ${value}`);
  useEffect(() => setDraft(`€ ${value}`), [value]);

  const commit = () => {
    const n = parseEuro(draft);
    if (n === null) {
      setDraft(`€ ${value}`);
      return;
    }
    setDraft(`€ ${n}`);
    onCommit(n);
  };

  return (
    <input
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-[38px] w-[110px] rounded-full border border-night-border bg-night-elev text-center font-mono text-[13px] text-white"
    />
  );
}

export default function ReglagesPage() {
  const router = useRouter();
  const t = useT();
  const guardrails = useApp((s) => s.guardrails);
  const setGuardrails = useApp((s) => s.setGuardrails);
  const notify = useApp((s) => s.notify);

  // Abonnement réel — relu à chaque montage (un changement de plan côté admin
  // est visible au prochain chargement).
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/org/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => {
        if (alive && d) setMe(d);
      })
      .catch(() => {
        // pas connecté / réseau — la carte reste en attente
      });
    return () => {
      alive = false;
    };
  }, []);

  const org = me?.org;
  const trialing = org?.status === "trialing";

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // on redirige quand même
    }
    // navigation dure : purge le cache client après changement de session
    window.location.assign("/login");
  };

  // Notifications — état local, défauts du prototype (ON / ON / OFF)
  const [n1, setN1] = useState(true);
  const [n2, setN2] = useState(true);
  const [n3, setN3] = useState(false);

  // Drouot pas encore connecté
  const [drouot, setDrouot] = useState(false);

  const connectedBadge = (
    <span className="inline-flex items-center rounded-full bg-accent/12 px-3 py-1 text-[11.5px] font-semibold text-accent-dark">
      {t("reglages.connected")}
    </span>
  );

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto bg-night px-8 py-[26px] text-night-text">
      <h1 className="headline text-[34px] text-white">{t("reglages.title")}</h1>
      <div className="mt-1.5 text-[13px] text-night-text">{t("reglages.subtitle")}</div>

      {/* abonnement */}
      <Reveal className="mt-[18px]">
      <div className={`${CARD} flex items-center gap-3.5`}>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-[9px]">
            <span className="headline text-[19px] text-white">
              {org
                ? `${t("reglages.planPrefix")} ${org.planLabel}${trialing ? t("reglages.trialSuffix") : ""}`
                : t("reglages.planPrefix")}
            </span>
            {org && (
              <span className="inline-flex items-center rounded-full bg-accent/12 px-2.5 py-[3px] text-[10.5px] font-semibold text-accent-dark">
                {trialing && org.trialDaysLeft != null ? (
                  <>
                    <span className="font-mono">{org.trialDaysLeft}</span>&nbsp;{t("reglages.daysLeft")}
                  </>
                ) : (
                  org.statusLabel
                )}
              </span>
            )}
          </div>
          <span className="text-[12.5px] text-night-dim">
            {org ? (
              <>
                <span className="font-mono">€{org.priceEUR}</span>
                {t("reglages.perMonth")} · {PLANS[org.plan].blurb}
              </>
            ) : null}
          </span>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => notify(t("reglages.notifyBillingPortal"))}
          className="inline-flex h-10 cursor-pointer items-center rounded-full bg-night-elev px-[18px] text-[13px] font-semibold text-white transition-colors hover:bg-night-border"
        >
          {t("reglages.manageBilling")}
        </motion.button>
      </div>
      </Reveal>

      {/* profil */}
      <Reveal delay={0.06} className="mt-3.5">
      <div className={`${CARD} flex flex-col gap-3.5`}>
        <span className={LABEL}>{t("reglages.profile")}</span>
        <div className="flex items-center gap-3.5">
          <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-accent/12 text-[17px] font-semibold text-accent-dark">
            M
          </span>
          <div className="flex flex-1 gap-2.5">
            <input
              aria-label={t("reglages.nameAria")}
              defaultValue="Manou"
              className="h-[42px] min-w-0 flex-1 rounded-xl border border-night-border bg-night-elev px-3.5 text-[13.5px] text-white placeholder:text-night-dim"
            />
            <input
              aria-label={t("reglages.emailAria")}
              defaultValue="manou@bidedge.app"
              className="h-[42px] min-w-0 flex-[1.4] rounded-xl border border-night-border bg-night-elev px-3.5 text-[13.5px] text-white placeholder:text-night-dim"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => notify(t("reglages.notifySoon"))}
              className="inline-flex h-[42px] cursor-pointer items-center rounded-full bg-night-elev px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-night-border"
            >
              {t("reglages.language")} ▾
            </motion.button>
          </div>
        </div>
      </div>
      </Reveal>

      {/* enchères & garde-fous */}
      <Reveal delay={0.12} className="mt-3.5">
      <div className={`${CARD} flex flex-col gap-1`}>
        <span className={`${LABEL} mb-2`}>{t("reglages.guardrailsTitle")}</span>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between py-2.5 text-[13.5px] text-white"
        >
          <span>{t("reglages.monthlyBudget")}</span>
          <GuardrailInput
            label={t("reglages.monthlyBudget")}
            value={guardrails.monthlyBudget}
            onCommit={(n) => setGuardrails({ monthlyBudget: n })}
          />
        </motion.div>
        <div className="h-px bg-night-border" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between py-2.5 text-[13.5px] text-white"
        >
          <span>{t("reglages.defaultCeiling")}</span>
          <GuardrailInput
            label={t("reglages.defaultCeiling")}
            value={guardrails.defaultCeiling}
            onCommit={(n) => setGuardrails({ defaultCeiling: n })}
          />
        </motion.div>
        <div className="h-px bg-night-border" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between gap-3.5 py-3 text-[13.5px]"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="font-semibold text-white">{t("reglages.humanConfirm")}</span>
            <span className="text-xs text-night-dim">
              {t("reglages.humanConfirmDesc")}
            </span>
          </span>
          {/* toggle verrouillé — cliquer n'importe où rappelle le principe, ne désactive JAMAIS */}
          <span
            role="button"
            tabIndex={0}
            aria-label={t("reglages.permanentAria")}
            onClick={() => notify(t("reglages.notifyPermanent"))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                notify(t("reglages.notifyPermanent"));
              }
            }}
            className="flex cursor-pointer items-center gap-[9px]"
          >
            <span className="inline-flex items-center rounded-full bg-accent/12 px-2.5 py-[3px] text-[10.5px] font-semibold text-accent-dark">
              {t("reglages.alwaysOn")}
            </span>
            <span className="relative h-[21px] w-9 flex-none rounded-full bg-accent-dark opacity-55">
              <span className="absolute left-[17px] top-[2px] h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)]" />
            </span>
          </span>
        </motion.div>
      </div>
      </Reveal>

      {/* notifications */}
      <Reveal delay={0.18} className="mt-3.5">
      <div className={`${CARD} flex flex-col gap-1`}>
        <span className={`${LABEL} mb-2`}>{t("reglages.notifications")}</span>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between py-[9px] text-[13.5px] text-white"
        >
          <span>{t("reglages.notif1")}</span>
          <Toggle on={n1} onToggle={() => setN1((v) => !v)} label={t("reglages.notif1")} />
        </motion.div>
        <div className="h-px bg-night-border" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between py-[9px] text-[13.5px] text-white"
        >
          <span>{t("reglages.notif2")}</span>
          <Toggle on={n2} onToggle={() => setN2((v) => !v)} label={t("reglages.notif2")} />
        </motion.div>
        <div className="h-px bg-night-border" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between py-[9px] text-[13.5px] text-white"
        >
          <span>{t("reglages.notif3")}</span>
          <Toggle on={n3} onToggle={() => setN3((v) => !v)} label={t("reglages.notif3")} />
        </motion.div>
      </div>
      </Reveal>

      {/* plateformes connectées */}
      <Reveal delay={0.24} className="mt-3.5">
      <div className={`${CARD} flex flex-col gap-1`}>
        <span className={`${LABEL} mb-2`}>{t("reglages.platforms")}</span>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 py-[9px] text-[13.5px]"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-night-elev text-[11px] font-semibold text-night-text">
            Ca
          </span>
          <span className="font-semibold text-white">Catawiki</span>
          <span className="flex-1" />
          {connectedBadge}
        </motion.div>
        <div className="h-px bg-night-border" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 py-[9px] text-[13.5px]"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-night-elev text-[11px] font-semibold text-night-text">
            Dr
          </span>
          <span className="font-semibold text-white">Drouot</span>
          <span className="flex-1" />
          {drouot ? (
            connectedBadge
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setDrouot(true);
                notify(t("reglages.notifyDrouotConnected"));
              }}
              className="inline-flex h-[34px] cursor-pointer items-center rounded-full bg-night-elev px-[15px] text-xs font-semibold text-white transition-colors hover:bg-night-border"
            >
              {t("reglages.connect")}
            </motion.button>
          )}
        </motion.div>
        <div className="pt-1.5 text-[11.5px] text-night-dim">
          {t("reglages.platformsFooter")}
        </div>
      </div>
      </Reveal>

      {/* pied */}
      <div className="mb-2 mt-4 flex items-center">
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer text-[12.5px] font-semibold text-night-text hover:text-white"
        >
          {t("reglages.logout")}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => notify(t("reglages.notifySupport"))}
          className="cursor-pointer text-[12.5px] font-semibold text-down hover:underline"
        >
          {t("reglages.deleteAccount")}
        </button>
      </div>
    </div>
  );
}

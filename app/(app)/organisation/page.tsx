"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/provider";
import { Reveal } from "@/components/ui/taap";

// Organisation — radar partagé, rôles clairs. Chaque enchère reste
// validée par la personne qui la place (aucun autobid, jamais).

const CARD =
  "rounded-card border border-night-border bg-night-card px-6 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-colors hover:border-night-border2";
const LABEL = "overline !text-night-dim";

type ApiRole = "owner" | "encherisseur" | "observateur";

type Member = {
  id?: string;
  name: string;
  email: string;
  role: ApiRole;
  roleLabel: string;
};

type Invitation = {
  id: string;
  email: string;
  role: ApiRole;
  status: string;
};

// avatars teintés « Nuit », cycle de 5 (fond / texte)
const TINTS = [
  "rgba(52,209,108,0.14)",
  "rgba(255,255,255,0.06)",
  "rgba(224,160,64,0.14)",
  "rgba(139,120,220,0.16)",
  "rgba(52,209,108,0.14)",
];
const TINT_TEXTS = ["#5fdd8c", "#a1a1aa", "#e0b464", "#b9a7f0", "#5fdd8c"];

const ROLE_BADGE: Record<ApiRole, string> = {
  owner: "bg-accent/12 text-accent-dark",
  encherisseur: "bg-night-elev text-white",
  observateur: "border border-night-border bg-night-elev text-night-dim",
};

function initialOf(s: string): string {
  return (s.trim()[0] || "?").toUpperCase();
}

const SHARED_CATEGORIES = ["Montres Seiko vintage", "RAM DDR5", "GPU"];

export default function OrganisationPage() {
  const t = useT();
  const notify = useApp((s) => s.notify);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteVal, setInviteVal] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/org/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { members?: Member[]; invitations?: Invitation[] } | null) => {
        if (!alive || !d) return;
        setMembers(d.members ?? []);
        setInvitations(d.invitations ?? []);
      })
      .catch(() => {
        // pas connecté / réseau — listes vides
      });
    return () => {
      alive = false;
    };
  }, []);

  const invite = async () => {
    const email = inviteVal.trim();
    if (!email) {
      notify(t("organisation.notifyEnterEmail"));
      return;
    }
    try {
      const res = await fetch("/api/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "observateur" }),
      });
      if (res.status === 403) {
        notify(t("organisation.notifyOnlyOwner"));
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        notify(data?.error?.message ?? t("organisation.notifyInviteFailed"));
        return;
      }
      if (data.status === "joined" && data.member) {
        const member = data.member as Member;
        setMembers((m) => [...m, member]);
        setInviteVal("");
        notify(t("organisation.notifyJoined", { name: member.name }));
        return;
      }
      // status === "invited" — invitation en attente
      const invitedEmail: string = data.invitation?.email ?? email;
      setInvitations((inv) =>
        inv.some((i) => i.email === invitedEmail)
          ? inv
          : [...inv, { id: `pending-${invitedEmail}`, email: invitedEmail, role: "observateur", status: "pending" }],
      );
      setInviteVal("");
      notify(t("organisation.notifyInviteSent", { email: invitedEmail }));
    } catch {
      notify(t("organisation.notifyInviteFailed"));
    }
  };

  return (
    <div className="flex-1 animate-fade-up overflow-y-auto bg-night px-8 py-[26px] text-night-text">
      <div className="flex items-center gap-3">
        <h1 className="headline text-[34px] text-white">{t("organisation.title")}</h1>
        <span className="inline-flex items-center rounded-full bg-accent/12 px-[13px] py-[5px] text-[11.5px] font-semibold text-accent-dark">
          {t("organisation.teamBadge")}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] text-night-text">
        {t("organisation.subtitle")}
      </div>

      {/* membres */}
      <Reveal className="mt-[18px]">
      <div className={`${CARD} flex flex-col gap-0.5`}>
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className={LABEL}>
            {t("organisation.members")}&nbsp;<span className="font-mono">{members.length}</span>
          </span>
          <span className="flex-1" />
          <input
            aria-label={t("organisation.inviteAria")}
            value={inviteVal}
            onChange={(e) => setInviteVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") invite();
            }}
            placeholder={t("organisation.invitePlaceholder")}
            className="h-[38px] w-[220px] rounded-full border border-night-border bg-night-elev px-4 text-[12.5px] text-white placeholder:text-night-dim"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={invite}
            className="inline-flex h-[38px] cursor-pointer items-center rounded-full bg-accent-dark px-[17px] text-[12.5px] font-semibold text-night shadow-[0_10px_30px_rgba(52,209,108,0.25)] transition-colors hover:bg-accent-dark2"
          >
            {t("organisation.inviteBtn")}
          </motion.button>
        </div>
        {members.map((m, i) => (
          <motion.div
            key={m.id ?? `${m.email}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 border-b border-night-border py-2.5 last:border-b-0"
          >
            <span
              className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[12.5px] font-semibold"
              style={{ background: TINTS[i % 5], color: TINT_TEXTS[i % 5] }}
            >
              {initialOf(m.name)}
            </span>
            <span className="flex flex-1 flex-col leading-[1.25]">
              <span className="text-[13.5px] font-semibold text-white">{m.name}</span>
              <span className="text-[11.5px] text-night-dim">{m.email}</span>
            </span>
            <span
              className={`inline-flex items-center rounded-full px-[13px] py-[5px] text-[11.5px] font-semibold ${ROLE_BADGE[m.role]}`}
            >
              {m.roleLabel}
            </span>
            <button
              type="button"
              aria-label={t("organisation.memberOptionsAria", { name: m.name })}
              onClick={() => notify(t("organisation.notifySoon"))}
              className="cursor-pointer font-semibold text-night-dim hover:text-white"
            >
              ···
            </button>
          </motion.div>
        ))}
        {invitations.map((inv, i) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: (members.length + i) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 border-b border-night-border py-2.5 last:border-b-0"
          >
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-night-elev text-[12.5px] font-semibold text-night-dim">
              {initialOf(inv.email)}
            </span>
            <span className="flex flex-1 flex-col leading-[1.25]">
              <span className="text-[13.5px] font-semibold text-night-text">{inv.email}</span>
              <span className="text-[11.5px] text-night-dim">{t("organisation.invitedPending")}</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-night-elev px-[13px] py-[5px] text-[11.5px] font-semibold text-night-dim">
              {t(`organisation.role_${inv.role}`)}
            </span>
          </motion.div>
        ))}
      </div>
      </Reveal>

      {/* budget partagé + catégories partagées */}
      <Reveal delay={0.08} className="mt-3.5 grid grid-cols-2 gap-3.5">
        <div className={`${CARD} flex flex-col gap-[11px]`}>
          <span className={LABEL}>
            {t("organisation.sharedBudget", { month: t("organisation.month_july") })}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-semibold text-white">€410</span>
            <span className="text-[12.5px] text-night-dim">
              {t("organisation.spentOf")} <span className="font-mono">€2 000</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-night-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "20.5%" }}
              transition={{ duration: 0.7, ease: [0.2, 0.9, 0.3, 1] }}
              className="h-full rounded-full bg-accent-dark"
            />
          </div>
          <span className="text-[11.5px] text-night-dim">
            {t("organisation.budgetHint")}
          </span>
        </div>
        <div className={`${CARD} flex flex-col gap-[11px]`}>
          <span className={LABEL}>{t("organisation.sharedCategories")}</span>
          <div className="flex flex-wrap gap-2">
            {SHARED_CATEGORIES.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center rounded-full bg-accent/12 px-[13px] py-1.5 text-xs font-semibold text-accent-dark"
              >
                {c}
              </motion.span>
            ))}
          </div>
          <span className="text-[11.5px] text-night-dim">
            {t("organisation.categoriesHint")}
          </span>
        </div>
      </Reveal>

      {/* activité récente */}
      <Reveal delay={0.16} className="mb-2 mt-3.5">
      <div className={`${CARD} flex flex-col gap-0.5`}>
        <span className={`${LABEL} mb-2`}>{t("organisation.recentActivity")}</span>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 border-b border-night-border py-2 text-[13px]"
        >
          <span className="h-[7px] w-[7px] flex-none rounded-full bg-accent-dark" />
          <span>
            <span className="font-semibold text-white">Lex</span> {t("organisation.act_tracked")}{" "}
            <span className="font-semibold text-white">RTX 3090 Ti</span>
          </span>
          <span className="ml-auto text-[11.5px] text-night-dim">
            {t("organisation.time_min_ago", { n: 2 })}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 border-b border-night-border py-2 text-[13px]"
        >
          <span className="h-[7px] w-[7px] flex-none rounded-full bg-night-border" />
          <span>
            <span className="font-semibold text-white">Sam</span> {t("organisation.act_raised")}{" "}
            <span className="font-mono">€600</span>
          </span>
          <span className="ml-auto text-[11.5px] text-night-dim">{t("organisation.time_yesterday")}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 py-2 text-[13px]"
        >
          <span className="h-[7px] w-[7px] flex-none rounded-full bg-night-border" />
          <span>
            <span className="font-semibold text-white">Nina</span> {t("organisation.act_joined")}
          </span>
          <span className="ml-auto text-[11.5px] text-night-dim">{t("organisation.time_monday")}</span>
        </motion.div>
      </div>
      </Reveal>
    </div>
  );
}

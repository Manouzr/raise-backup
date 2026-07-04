"use client";

// Landing BidEdge — reproduction fidèle du prototype "BidEdge Landing.dc.html".
import Link from "next/link";
import { motion } from "motion/react";
import Reveal from "@/components/landing/Reveal";
import HeroCards from "@/components/landing/HeroCards";
import { euro, fmtEdge } from "@/lib/format";

const MotionLink = motion.create(Link);

const heroEnter = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="bg-white text-ink">
      <style>{`html{scroll-behavior:smooth}`}</style>

      {/* ================= NAV + HERO (bande sombre) ================= */}
      <div className="bg-ink text-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-8">
          <nav className="flex items-center gap-7 h-[72px]">
            <span className="text-[19px] font-bold tracking-[-0.01em]">
              Bid<span className="text-accent-dark">Edge</span>
            </span>
            <a href="#produit" className="text-[13.5px] font-medium text-dark-text hover:text-white transition-colors">
              Produit
            </a>
            <a href="#cote" className="text-[13.5px] font-medium text-dark-text hover:text-white transition-colors">
              La cote
            </a>
            <a href="#tarifs" className="text-[13.5px] font-medium text-dark-text hover:text-white transition-colors">
              Tarifs
            </a>
            <span className="flex-1" />
            <Link href="/login" className="text-[13.5px] font-semibold text-white">
              Se connecter
            </Link>
            <MotionLink
              href="/onboarding"
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center h-10 px-5 rounded-full bg-accent text-white text-[13.5px] font-semibold hover:bg-accent-press transition-colors"
            >
              Commencer
            </MotionLink>
          </nav>

          <div className="flex items-center gap-12 pt-[88px] pb-[112px]">
            <div className="flex-[1.1] min-w-0">
              <motion.span
                {...heroEnter}
                transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
                className="inline-flex items-center gap-2 rounded-full bg-dark-card border border-dark-border text-dark-text text-xs font-semibold px-3.5 py-[7px] tracking-[0.04em]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-dark animate-blink" />
                COPILOTE D&apos;ENCHÈRES EN DIRECT
              </motion.span>
              <motion.h1
                {...heroEnter}
                transition={{ duration: 0.55, delay: 0.06, ease: [0.2, 0.9, 0.3, 1] }}
                className="text-[72px] font-normal tracking-[-0.028em] leading-[1.02] mt-[26px]"
              >
                L&apos;avantage,
                <br />à chaque enchère.
              </motion.h1>
              <motion.p
                {...heroEnter}
                transition={{ duration: 0.55, delay: 0.12, ease: [0.2, 0.9, 0.3, 1] }}
                className="text-[17px] leading-[1.6] text-dark-text max-w-[460px] mt-[22px]"
              >
                BidEdge scanne les catégories que tu chasses, établit la cote réelle du
                marché et te souffle la bonne enchère — juste au-dessus de l&apos;actuelle,
                jamais au-dessus de ta limite. Toi, tu tapes.
              </motion.p>
              <motion.div
                {...heroEnter}
                transition={{ duration: 0.55, delay: 0.18, ease: [0.2, 0.9, 0.3, 1] }}
                className="flex items-center gap-3.5 mt-[34px]"
              >
                <MotionLink
                  href="/onboarding"
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center h-14 px-8 rounded-full bg-accent hover:bg-accent-press transition-colors text-white text-[15.5px] font-semibold shadow-[0_8px_24px_rgba(20,120,121,0.35)]"
                >
                  Commencer gratuitement
                </MotionLink>
                <motion.a
                  href="#produit"
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center h-14 px-7 rounded-full border border-[#3c4046] hover:border-white transition-colors text-white text-[15px] font-semibold"
                >
                  Voir le produit
                </motion.a>
              </motion.div>
              <motion.div
                {...heroEnter}
                transition={{ duration: 0.55, delay: 0.24, ease: [0.2, 0.9, 0.3, 1] }}
                className="text-xs text-body mt-4"
              >
                Essai Pro 14 jours · sans carte bancaire · enchères via les API officielles
              </motion.div>
            </div>

            <HeroCards />
          </div>
        </div>
      </div>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <div id="produit" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-8 py-24">
          <Reveal>
            <span className="inline-flex items-center rounded-full bg-control text-ink text-xs font-semibold tracking-[0.05em] px-3.5 py-1.5">
              COMMENT ÇA MARCHE
            </span>
            <h2 className="text-[44px] font-normal tracking-[-0.022em] leading-[1.08] mt-[18px] max-w-[560px]">
              Trois gestes. Le troisième est le tien.
            </h2>
          </Reveal>
          <div className="grid grid-cols-3 gap-6 mt-12">
            <Reveal delay={0}>
              <div className="h-full border border-hairline rounded-3xl p-8 flex flex-col gap-3.5 hover:shadow-soft transition-shadow">
                <span className="font-mono font-semibold text-sm text-accent">01</span>
                <span className="text-lg font-semibold">Dis quoi chasser</span>
                <span className="text-sm leading-[1.55] text-body">
                  « Montres Seiko vintage », « RAM DDR5 », « GPU ». Une phrase suffit — le
                  scan démarre.
                </span>
                <div className="flex gap-[7px] flex-wrap mt-1">
                  <span className="inline-flex rounded-full bg-accent-tint text-accent-press text-[11.5px] font-semibold px-3 py-[5px]">
                    Montres Seiko
                  </span>
                  <span className="inline-flex rounded-full bg-accent-tint text-accent-press text-[11.5px] font-semibold px-3 py-[5px]">
                    RAM DDR5
                  </span>
                  <span className="inline-flex rounded-full bg-accent-tint text-accent-press text-[11.5px] font-semibold px-3 py-[5px]">
                    GPU
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full border border-hairline rounded-3xl p-8 flex flex-col gap-3.5 hover:shadow-soft transition-shadow">
                <span className="font-mono font-semibold text-sm text-accent">02</span>
                <span className="text-lg font-semibold">On établit la cote</span>
                <span className="text-sm leading-[1.55] text-body">
                  Ventes passées réelles + recherche live, sources citées. Chaque lot du
                  radar sait ce qu&apos;il vaut.
                </span>
                <div className="relative h-[26px] mt-1">
                  <div className="absolute left-0 right-0 top-[9px] h-2 bg-control rounded-full" />
                  <div className="absolute left-[30%] w-[46%] top-[9px] h-2 rounded-full bg-[linear-gradient(90deg,rgba(20,120,121,0.3),#147879_45%,rgba(20,120,121,0.3))]" />
                  <div className="absolute left-[52%] top-[5px] w-0.5 h-4 bg-accent-press" />
                  <span className="absolute left-[52%] -translate-x-1/2 -top-2 font-mono text-[10px] text-accent-press">
                    {euro(280)}
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="h-full border border-hairline rounded-3xl p-8 flex flex-col gap-3.5 hover:shadow-soft transition-shadow">
                <span className="font-mono font-semibold text-sm text-accent">03</span>
                <span className="text-lg font-semibold">Tu enchéris d&apos;un tap</span>
                <span className="text-sm leading-[1.55] text-body">
                  Au bon moment, la bonne enchère — juste au-dessus de l&apos;actuelle.
                  Surenchéri ? On te repropose.
                </span>
                <span className="inline-flex items-center justify-center h-10 rounded-full bg-accent text-white text-[13px] font-semibold mt-1">
                  Enchérir {euro(100)} maintenant
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ================= LA COTE ================= */}
      <div id="cote" className="bg-app">
        <div className="max-w-[1200px] mx-auto px-8 py-24 flex gap-14 items-center">
          <Reveal className="flex-1 min-w-0">
            <h2 className="text-4xl font-normal tracking-[-0.02em] leading-[1.12]">
              La cote, pas du bruit.
            </h2>
            <p className="text-[15px] leading-[1.6] text-body mt-4 max-w-[420px]">
              Pas de « score IA » opaque. Une fourchette de prix construite sur des ventes
              réelles, que tu peux vérifier ligne par ligne.
            </p>
            <div className="flex flex-col gap-3.5 mt-7">
              <div className="flex gap-3 items-start">
                <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-none" />
                <span className="text-sm leading-[1.5] text-ink">
                  <b>Ventes passées réelles</b> — 124 transactions comparées pour une
                  catégorie type, sources citées.
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-none" />
                <span className="text-sm leading-[1.5] text-ink">
                  <b>Recherche live</b> — les annonces en cours ajustent la fourchette en
                  continu.
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-none" />
                <span className="text-sm leading-[1.5] text-ink">
                  <b>Sous-modèles distingués</b> — un 6139 « Pepsi » ne vaut pas un cadran
                  abîmé, et la cote le sait.
                </span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex-1 min-w-0">
            <div className="bg-white rounded-3xl shadow-soft p-8">
              <div className="flex items-center gap-2.5">
                <span className="text-[14.5px] font-semibold">Montres Seiko vintage</span>
                <span className="inline-flex rounded-full bg-accent-tint text-accent-press text-[11px] font-bold px-[11px] py-1">
                  Cote établie
                </span>
                <span className="ml-auto text-[11.5px] text-muted">124 ventes · 3 sources</span>
              </div>
              <div className="relative h-[70px] mt-[22px]">
                <span className="absolute left-[26%] -translate-x-1/2 top-5 font-mono text-[13px] font-medium">
                  {euro(180)}
                </span>
                <span className="absolute left-[46%] -translate-x-1/2 top-0 text-center leading-[1.05]">
                  <span className="font-mono text-xl font-semibold text-accent-press">
                    {euro(280)}
                  </span>
                  <br />
                  <span className="text-[9px] text-muted tracking-[0.07em] uppercase font-semibold">
                    médiane
                  </span>
                </span>
                <span className="absolute left-[74%] -translate-x-1/2 top-5 font-mono text-[13px] font-medium">
                  {euro(420)}
                </span>
                <div className="absolute left-0 right-0 top-[50px] h-3.5 bg-control rounded-full" />
                <div className="absolute left-[26%] w-[48%] top-[50px] h-3.5 rounded-full bg-[linear-gradient(90deg,rgba(20,120,121,0.3),#147879_42%,rgba(20,120,121,0.3))]" />
                <div className="absolute left-[46%] top-[44px] w-[2.5px] h-[26px] bg-accent-press rounded-sm" />
              </div>
              <div className="relative h-14">
                <div className="absolute left-[9%] top-0 w-0.5 h-4 bg-accent" />
                <div className="absolute left-[9%] top-[13px] w-[13px] h-[13px] rounded-full bg-accent border-[2.5px] border-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] -translate-x-[45%]" />
                <span className="absolute left-[3%] top-[34px] text-[11px] font-semibold whitespace-nowrap">
                  Seiko 6139 · live <span className="font-mono">{euro(95)}</span>
                </span>
                <span className="absolute left-[13.5%] w-[11.5%] top-[19px] border-t-[1.5px] border-dashed border-[rgba(20,120,121,0.6)]" />
                <span className="absolute left-[25%] top-[13px] text-[10px] text-[rgba(20,120,121,0.85)]">
                  ›
                </span>
                <span className="absolute left-[26.8%] top-2 inline-flex items-center rounded-full bg-up-tint text-up-strong px-[11px] py-[3px] text-[11.5px] font-bold">
                  ton edge · {fmtEdge(-62)}
                </span>
              </div>
              <div className="text-[11px] text-muted mt-1.5">
                la zone teal = ce que le marché paie · le point = le lot en direct
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ================= JAMAIS D'AUTOBID ================= */}
      <div className="bg-white">
        <div className="max-w-[1200px] mx-auto px-8 py-24 flex gap-14 items-center">
          <Reveal className="flex-1 min-w-0">
            <div className="bg-ink rounded-3xl p-9 text-white">
              <span className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-muted">
                Réglages · garde-fous
              </span>
              <div className="flex justify-between items-center gap-3.5 mt-[18px]">
                <span className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">
                    Confirmation humaine avant chaque enchère
                  </span>
                  <span className="text-[12.5px] text-dark-text">
                    Ce garde-fou est permanent.
                  </span>
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="inline-flex rounded-full bg-[rgba(63,182,183,0.14)] text-accent-dark2 text-[10.5px] font-bold px-[11px] py-1">
                    toujours actif
                  </span>
                  <span className="w-[38px] h-[22px] rounded-full bg-accent relative flex-none">
                    <span className="absolute top-0.5 left-[18px] w-[18px] h-[18px] rounded-full bg-white" />
                  </span>
                </span>
              </div>
              <div className="h-px bg-dark-border my-5" />
              <div className="text-[13px] leading-[1.6] text-dark-text">
                Un bot qui enchérit à ta place finit toujours par acheter ce que tu ne
                voulais pas, au prix que tu ne voulais pas. BidEdge prépare la décision —{" "}
                <span className="text-white font-semibold">la main, c&apos;est la tienne.</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex-1 min-w-0">
            <h2 className="text-4xl font-normal tracking-[-0.02em] leading-[1.12]">
              Jamais d&apos;autobid.
            </h2>
            <p className="text-[15px] leading-[1.6] text-body mt-4 max-w-[420px]">
              C&apos;est une position produit, pas une limitation. Chaque enchère part de
              ton doigt, sous ta limite, dans ton budget.
            </p>
            <div className="flex flex-col gap-3 mt-[26px]">
              <div className="flex gap-[11px] items-center">
                <span className="text-up-strong font-bold">✓</span>
                <span className="text-sm">Enchères via les API officielles des plateformes</span>
              </div>
              <div className="flex gap-[11px] items-center">
                <span className="text-up-strong font-bold">✓</span>
                <span className="text-sm">Budget mensuel et limite par lot, fixés à froid</span>
              </div>
              <div className="flex gap-[11px] items-center">
                <span className="text-up-strong font-bold">✓</span>
                <span className="text-sm">
                  Journal de décisions — tes choix nourrissent les suggestions suivantes
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ================= TARIFS ================= */}
      <div id="tarifs" className="bg-app">
        <div className="max-w-[1200px] mx-auto px-8 py-24">
          <Reveal>
            <h2 className="text-[44px] font-normal tracking-[-0.022em] text-center">
              Un prix simple.
            </h2>
            <div className="text-sm text-body text-center mt-2.5">
              Essai Pro 14 jours. Sans engagement, sans carte.
            </div>
          </Reveal>
          <div className="grid grid-cols-3 gap-6 mt-12 items-stretch">
            <Reveal delay={0}>
              <div className="h-full bg-white border border-hairline rounded-3xl p-8 flex flex-col gap-4">
                <span className="text-[15px] font-semibold">Chasseur</span>
                <div>
                  <span className="font-mono font-semibold text-[34px]">{euro(0)}</span>
                  <span className="text-[13px] text-muted"> /mois</span>
                </div>
                <div className="h-px bg-control" />
                <div className="flex flex-col gap-2.5 text-[13.5px] text-ink flex-1">
                  <span>· 1 catégorie scannée</span>
                  <span>· Cote rafraîchie chaque semaine</span>
                  <span>· 3 alertes par mois</span>
                </div>
                <MotionLink
                  href="/onboarding"
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-center h-11 rounded-full bg-control hover:bg-control-hover transition-colors text-ink text-[13.5px] font-semibold"
                >
                  Commencer
                </MotionLink>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full bg-ink text-white rounded-3xl p-8 flex flex-col gap-4 shadow-[0_24px_56px_rgba(10,11,13,0.18)]">
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-semibold">Pro</span>
                  <span className="inline-flex rounded-full bg-[rgba(63,182,183,0.14)] text-accent-dark2 text-[10.5px] font-bold px-[11px] py-1">
                    recommandé
                  </span>
                </div>
                <div>
                  <span className="font-mono font-semibold text-[34px]">{euro(19)}</span>
                  <span className="text-[13px] text-muted"> /mois</span>
                </div>
                <div className="h-px bg-dark-border" />
                <div className="flex flex-col gap-2.5 text-[13.5px] text-[#e6e8ea] flex-1">
                  <span>· Catégories illimitées</span>
                  <span>· Cote en temps réel + sous-modèles</span>
                  <span>· Suggestions d&apos;enchères en direct</span>
                  <span>· Journal &amp; mémoire de tes décisions</span>
                </div>
                <MotionLink
                  href="/onboarding"
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-center h-11 rounded-full bg-accent hover:bg-accent-press transition-colors text-white text-[13.5px] font-semibold"
                >
                  Essayer 14 jours
                </MotionLink>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="h-full bg-white border border-hairline rounded-3xl p-8 flex flex-col gap-4">
                <span className="text-[15px] font-semibold">Équipe</span>
                <div>
                  <span className="font-mono font-semibold text-[34px]">{euro(49)}</span>
                  <span className="text-[13px] text-muted"> /mois</span>
                </div>
                <div className="h-px bg-control" />
                <div className="flex flex-col gap-2.5 text-[13.5px] text-ink flex-1">
                  <span>· Tout Pro</span>
                  <span>· Organisation : rôles &amp; membres</span>
                  <span>· Budget partagé, plafonds d&apos;équipe</span>
                  <span>· Radar et catégories partagés</span>
                </div>
                <MotionLink
                  href="/onboarding"
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-center h-11 rounded-full bg-control hover:bg-control-hover transition-colors text-ink text-[13.5px] font-semibold"
                >
                  Contacter l&apos;équipe
                </MotionLink>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ================= FAQ ================= */}
      <div className="bg-white">
        <div className="max-w-[1200px] mx-auto px-8 py-24">
          <Reveal>
            <h2 className="text-4xl font-normal tracking-[-0.02em] mb-10">
              Questions directes, réponses directes.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="grid grid-cols-2 gap-y-8 gap-x-14">
              <div className="flex flex-col gap-2">
                <span className="text-[15.5px] font-semibold">C&apos;est un bot d&apos;enchères ?</span>
                <span className="text-sm leading-[1.6] text-body">
                  Non, et ça ne le sera jamais. BidEdge ne place aucune enchère seul — il
                  prépare la décision, tu la prends. La confirmation humaine est un
                  garde-fou permanent, pas une option.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[15.5px] font-semibold">Quelles plateformes ?</span>
                <span className="text-sm leading-[1.6] text-body">
                  eBay, Catawiki et Drouot au lancement, via leurs API officielles. Sans
                  connexion, BidEdge reste ton copilote : il suggère, tu places
                  l&apos;enchère sur la plateforme.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[15.5px] font-semibold">D&apos;où vient la cote ?</span>
                <span className="text-sm leading-[1.6] text-body">
                  Des ventes réellement conclues, complétées par une recherche live des
                  annonces en cours. Chaque fourchette est traçable — tu peux ouvrir les
                  ventes comparables ligne par ligne.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[15.5px] font-semibold">Et si je me fais surenchérir ?</span>
                <span className="text-sm leading-[1.6] text-body">
                  Nouvelle suggestion immédiate, tant que ça reste sous ta limite.
                  Au-delà, BidEdge te dira de lâcher — perdre une enchère au-dessus de la
                  cote, c&apos;est gagner.
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ================= CTA FINAL ================= */}
      <div className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-8 py-24 text-center">
          <Reveal>
            <h2 className="text-[44px] font-normal tracking-[-0.022em] leading-[1.08]">
              Arrête de perdre des enchères gagnables.
            </h2>
            <div className="text-[15px] text-dark-text mt-3.5">
              Ton premier scan prend deux minutes.
            </div>
            <div className="flex justify-center gap-3.5 mt-8">
              <MotionLink
                href="/onboarding"
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center h-14 px-8 rounded-full bg-accent hover:bg-accent-press transition-colors text-white text-[15.5px] font-semibold shadow-[0_8px_24px_rgba(20,120,121,0.35)]"
              >
                Commencer gratuitement
              </MotionLink>
              <MotionLink
                href="/login"
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center h-14 px-7 rounded-full border border-[#3c4046] hover:border-white transition-colors text-white text-[15px] font-semibold"
              >
                Se connecter
              </MotionLink>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="bg-white border-t border-hairline">
        <div className="max-w-[1200px] mx-auto px-8 pt-14 pb-7">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-[17px] font-bold tracking-[-0.01em]">
                Bid<span className="text-accent">Edge</span>
              </span>
              <span className="text-[12.5px] leading-[1.6] text-body max-w-[260px]">
                Le copilote des enchères en direct. La cote du marché, la bonne enchère,
                ta main.
              </span>
            </div>
            <div className="flex flex-col gap-2.5 text-[13px] text-body">
              <span className="text-[11px] font-bold tracking-[0.07em] uppercase text-ink">
                Produit
              </span>
              <a href="#produit" className="hover:text-ink transition-colors">
                Comment ça marche
              </a>
              <a href="#cote" className="hover:text-ink transition-colors">
                La cote
              </a>
              <a href="#tarifs" className="hover:text-ink transition-colors">
                Tarifs
              </a>
            </div>
            <div className="flex flex-col gap-2.5 text-[13px] text-body">
              <span className="text-[11px] font-bold tracking-[0.07em] uppercase text-ink">
                Ressources
              </span>
              <Link href="/" className="hover:text-ink transition-colors">
                Guide du chasseur
              </Link>
              <Link href="/" className="hover:text-ink transition-colors">
                Statut du service
              </Link>
              <Link href="/" className="hover:text-ink transition-colors">
                Changelog
              </Link>
            </div>
            <div className="flex flex-col gap-2.5 text-[13px] text-body">
              <span className="text-[11px] font-bold tracking-[0.07em] uppercase text-ink">
                Compte
              </span>
              <Link href="/login" className="hover:text-ink transition-colors">
                Se connecter
              </Link>
              <Link href="/onboarding" className="hover:text-ink transition-colors">
                Créer un compte
              </Link>
            </div>
          </div>
          <div className="h-px bg-control mt-9 mb-5" />
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>© 2026 BidEdge</span>
            <span>Confidentialité</span>
            <span>CGU</span>
            <span className="flex-1" />
            <span>
              Les enchères passent par les API officielles des plateformes — jamais par
              scraping.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

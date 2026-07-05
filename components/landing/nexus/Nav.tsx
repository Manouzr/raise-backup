"use client";

// Nav pill flottante (style Nexus) — pilule sombre en verre dépoli, surlignage
// magnétique au survol (layoutId), couleurs BidEdge. Liens vers les vraies
// routes du produit (/login, /onboarding) + ancres de section.
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { LocaleSwitcher } from "@/lib/i18n/LocaleSwitcher";

const NAV = [
  { key: "landing.nav.product", href: "#produit" },
  { key: "landing.nav.quote", href: "#cote" },
  { key: "landing.nav.pricing", href: "#tarifs" },
  { key: "landing.nav.faq", href: "#faq" },
];

export function Nav() {
  const t = useT();
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-1/2 top-4 z-50 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2"
    >
      <nav className="relative flex items-center justify-between rounded-full border border-night-border bg-night-2/70 px-3 py-2.5 backdrop-blur-md">
        {/* logo */}
        <Link href="/home" className="flex items-center gap-2 pl-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dark font-bold text-night">
            B
          </span>
          <span className="headline hidden text-[16px] text-white sm:block">
            Bid<span className="text-accent-dark">Edge</span>
          </span>
        </Link>

        {/* items desktop */}
        <div className="relative hidden items-center gap-1 md:flex">
          {NAV.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative px-3.5 py-2 text-[13.5px] font-medium text-night-text transition-colors hover:text-white"
            >
              {hovered === i && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-white/8"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t(item.key)}</span>
            </a>
          ))}
        </div>

        {/* CTA desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher className="mr-1" />
          <Link
            href="/login"
            className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-night-text transition-colors hover:text-white"
          >
            {t("landing.nav.signIn")}
          </Link>
          <Link
            href="/onboarding"
            className="shimmer-btn rounded-full bg-accent-dark px-4 py-2 text-[13.5px] font-semibold text-night transition-colors hover:bg-accent-dark2"
          >
            {t("landing.nav.getStarted")}
          </Link>
        </div>

        {/* burger mobile */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-night-text hover:text-white md:hidden"
          aria-label={t("landing.nav.menu")}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl border border-night-border bg-night-2/95 p-3 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-night-text transition-colors hover:bg-white/5 hover:text-white"
                >
                  {t(item.key)}
                </a>
              ))}
              <div className="my-1 h-px bg-night-border" />
              <div className="px-3 py-1.5">
                <LocaleSwitcher />
              </div>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-night-text hover:text-white"
              >
                {t("landing.nav.signIn")}
              </Link>
              <Link
                href="/onboarding"
                className="rounded-full bg-accent-dark px-3 py-2.5 text-center text-[14px] font-semibold text-night"
              >
                {t("landing.nav.getStarted")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

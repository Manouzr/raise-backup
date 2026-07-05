"use client";

// Petit sélecteur de langue EN / FR — pose le cookie NEXT_LOCALE puis recharge.
// (Pas de routing par URL, donc un simple reload suffit à repasser par le layout.)
import { LOCALE_COOKIE, locales } from "./config";
import { useLocale } from "./provider";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const active = useLocale();
  const set = (l: string) => {
    if (l === active) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };
  return (
    <div className={`inline-flex items-center rounded-full border border-night-border bg-night-elev p-0.5 ${className}`}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase transition-colors ${
            active === l ? "bg-accent-dark text-night" : "text-night-dim hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// Config i18n — locales disponibles, locale par défaut (anglais), nom du cookie.
// Pas de routing par URL : la locale est portée par un cookie (défaut = en).
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(v: string | undefined | null): v is Locale {
  return v != null && (locales as readonly string[]).includes(v);
}

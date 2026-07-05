// Helper i18n côté serveur — pour les composants serveur (ex. app/admin).
// Lit la locale depuis le cookie (défaut en) et renvoie une fonction t().
import { cookies } from "next/headers";
import { messages } from "./messages";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : defaultLocale;
}

function resolve(obj: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), obj);
}

export async function getT() {
  const locale = await getLocale();
  const dict = messages[locale] ?? messages[defaultLocale];
  return (key: string, vars?: Record<string, string | number>): string => {
    const val = resolve(dict, key);
    if (typeof val !== "string") return key;
    return vars
      ? Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), val)
      : val;
  };
}

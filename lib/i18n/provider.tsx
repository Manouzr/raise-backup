"use client";

// Provider i18n côté client : porte la locale active + son dictionnaire.
// `useT()` renvoie une fonction t(key, vars?) qui résout une clé pointée
// ("radar.title") et interpole {vars}. Clé manquante → renvoie la clé (visible).
import { createContext, useContext, useMemo, type ReactNode } from "react";

type Dict = Record<string, unknown>;
type Ctx = { locale: string; messages: Dict };

const I18nContext = createContext<Ctx>({ locale: "en", messages: {} });

function resolve(messages: Dict, key: string): unknown {
  return key.split(".").reduce<unknown>((o, k) => (o == null ? o : (o as Dict)[k]), messages);
}

function interpolate(tpl: string, vars?: Record<string, string | number>): string {
  if (!vars) return tpl;
  return Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tpl);
}

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Dict;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TFunc {
  const { messages } = useContext(I18nContext);
  return (key, vars) => {
    const val = resolve(messages, key);
    return typeof val === "string" ? interpolate(val, vars) : key;
  };
}

export function useLocale(): string {
  return useContext(I18nContext).locale;
}

"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

// Amorce de l'app : hydrate le store (localStorage) et synchronise UNE fois les
// catégories monitorées avec l'org (Neon).
//
// AUCUN flux SSE. Les données sont réelles (Drouot) et rafraîchies par polling
// côté radar / catégories. Ouvrir une EventSource sur du serverless (Vercel)
// provoquait un time-out systématique du flux puis une tempête de reconnexions
// (des milliers de requêtes/seconde) — c'est retiré définitivement.

// flag module : ne re-synchronise pas à chaque remontage (StrictMode inclus).
let orgCategoriesSynced = false;

function syncOrgCategories(): void {
  if (orgCategoriesSynced || typeof window === "undefined") return;
  orgCategoriesSynced = true;
  fetch("/api/org/categories")
    .then((res) => (res.ok ? (res.json() as Promise<{ categories?: string[] }>) : null))
    .then((data) => {
      if (!data || !Array.isArray(data.categories)) return;
      const { setCategories, categories: local } = useApp.getState();
      if (data.categories.length > 0) {
        // le serveur fait foi — pas de ré-écho vers l'API
        setCategories(data.categories, { remote: false });
      } else if (local.length > 0) {
        // org vierge : on la seed avec la liste locale
        setCategories(local);
      }
    })
    .catch(() => {
      // API indisponible — le localStorage reste la référence
    });
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useApp((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    syncOrgCategories();
  }, [hydrate]);

  return <>{children}</>;
}

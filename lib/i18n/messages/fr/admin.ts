export const admin = {
  // Layout (composant serveur)
  badge: "Admin plateforme",
  backToApp: "Retour à l'app",

  // Page (composant serveur)
  title: "Organisations",
  subtitle: "Gère les abonnements de tous les tenants.",

  // Bouton de déconnexion (client)
  logout: "Déconnexion",

  // Table des tenants (client)
  table: {
    tenants: "Tenants",
    empty: "Aucune organisation pour le moment.",
    errorUnauthorized: "Accès non autorisé.",
    errorLoad: "Impossible de charger les organisations.",
    errorNetwork: "Réseau indisponible.",
  },

  // Ligne d'organisation (client)
  row: {
    trialDaysSuffix: "j d'essai",
    trialExpired: "essai échu",
    membersPlural: "membres",
    membersSingular: "membre",
    planAria: "Plan de {name}",
    statusAria: "Statut de {name}",
    extendTrialAria: "Prolonger l'essai de {days} jours pour {name}",
    extendBtn: "+{days} j",
    saving: "Enregistrement…",
    saved: "Enregistré",
    errorUpdate: "Échec de la mise à jour",
    errorNetwork: "Réseau indisponible",
  },
} as const;

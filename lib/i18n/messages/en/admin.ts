export const admin = {
  // Layout (composant serveur)
  badge: "Platform admin",
  backToApp: "Back to app",

  // Page (composant serveur)
  title: "Organizations",
  subtitle: "Manage subscriptions across all tenants.",

  // Bouton de déconnexion (client)
  logout: "Log out",

  // Table des tenants (client)
  table: {
    tenants: "Tenants",
    empty: "No organizations yet.",
    errorUnauthorized: "Access denied.",
    errorLoad: "Couldn't load organizations.",
    errorNetwork: "Network unavailable.",
  },

  // Ligne d'organisation (client)
  row: {
    trialDaysSuffix: "days left",
    trialExpired: "trial ended",
    membersPlural: "members",
    membersSingular: "member",
    planAria: "Plan for {name}",
    statusAria: "Status for {name}",
    extendTrialAria: "Extend trial by {days} days for {name}",
    extendBtn: "+{days}d",
    saving: "Saving…",
    saved: "Saved",
    errorUpdate: "Update failed",
    errorNetwork: "Network unavailable",
  },
} as const;

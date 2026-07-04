import { boolean, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

// Schéma multitenant BidEdge. Une seule base partagée, isolation par org_id
// (row-level). Un tenant = une Organisation (l'écran /organisation).
// Abonnements gérés en base (pas de Stripe en v0) : plan + statut + fin d'essai
// sur `organizations`, pilotés depuis le panel super-admin.

export const planEnum = pgEnum("plan", ["chasseur", "pro", "equipe"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "suspended",
  "canceled",
]);
export const roleEnum = pgEnum("role", ["owner", "encherisseur", "observateur"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // super-admin plateforme (opérateur BidEdge) — accès au panel /admin
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").notNull().default("chasseur"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  // garde-fous / budget d'équipe (le toggle "confirmation humaine" est un
  // invariant produit, jamais stocké comme désactivable)
  monthlyBudget: integer("monthly_budget").notNull().default(600),
  defaultCeiling: integer("default_ceiling").notNull().default(150),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("observateur"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("memberships_org_user_uniq").on(t.orgId, t.userId), index("memberships_user_idx").on(t.userId)],
);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("observateur"),
  status: text("status").notNull().default("pending"), // pending | accepted | revoked
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Journal d'audit des actions super-admin (changement de plan/statut/essai) —
// donne au panel un historique crédible.
export const adminAudit = pgTable("admin_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // ex. "plan.change", "status.change", "trial.extend"
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Role = Membership["role"];
export type Plan = Organization["plan"];
export type SubscriptionStatus = Organization["subscriptionStatus"];

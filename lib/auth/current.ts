import "server-only";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db, memberships, organizations, users } from "@/lib/db";
import type { Membership, Organization, Role, User } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "./session";

// Contexte serveur : identité + org courante + rôle. Toujours relu en base.

export type SessionContext = {
  user: User;
  org: Organization;
  role: Role;
  membership: Membership;
};

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySession(token);
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

/** L'org "primaire" de l'utilisateur : celle qu'il possède, sinon la première. */
export async function getCurrentContext(): Promise<SessionContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db
    .select({ membership: memberships, org: organizations })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(eq(memberships.userId, user.id));

  if (rows.length === 0) return null;
  const primary = rows.find((r) => r.membership.role === "owner") ?? rows[0];
  return { user, org: primary.org, role: primary.membership.role, membership: primary.membership };
}

/** Vérifie que l'utilisateur est membre d'une org donnée et renvoie son rôle. */
export async function getRoleInOrg(userId: string, orgId: string): Promise<Role | null> {
  const [m] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)))
    .limit(1);
  return m?.role ?? null;
}

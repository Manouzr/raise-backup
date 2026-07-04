import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { categories, db, invitations, memberships, organizations, users } from "@/lib/db";
import type { Role } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { slugify } from "@/lib/auth/slug";

// POST /api/auth/signup — crée compte + org (owner) + catégories, en une
// transaction, puis ouvre la session. Accepte aussi les invitations en attente
// pour cet e-mail (l'utilisateur rejoint alors les orgs qui l'ont invité).

export const runtime = "nodejs";

type Body = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  orgName?: unknown;
  categories?: unknown;
  monthlyBudget?: unknown;
  defaultCeiling?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: { code: "invalid_body", message: "JSON attendu" } }, { status: 422 });
  }

  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const orgName = str(body.orgName) || (name ? `Radar de ${name}` : "Mon radar");
  const catLabels = Array.isArray(body.categories) ? body.categories.filter((c): c is string => typeof c === "string") : [];
  const monthlyBudget = Number.isFinite(Number(body.monthlyBudget)) ? Math.round(Number(body.monthlyBudget)) : 600;
  const defaultCeiling = Number.isFinite(Number(body.defaultCeiling)) ? Math.round(Number(body.defaultCeiling)) : 150;

  if (!name || !email || !email.includes("@") || password.length < 6) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Nom, e-mail valide et mot de passe (6+ caractères) requis" } },
      { status: 422 },
    );
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: { code: "email_taken", message: "Un compte existe déjà avec cet e-mail" } }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // slug d'org unique
  let slug = slugify(orgName);
  for (let i = 0; ; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const [taken] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, candidate)).limit(1);
    if (!taken) {
      slug = candidate;
      break;
    }
    if (i > 50) {
      slug = `${slug}-${Date.now().toString(36)}`;
      break;
    }
  }

  const userId = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ email, passwordHash, name }).returning();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 3600 * 1000); // essai Pro 14 jours
    const [org] = await tx
      .insert(organizations)
      .values({ name: orgName, slug, plan: "pro", subscriptionStatus: "trialing", trialEndsAt, monthlyBudget, defaultCeiling })
      .returning();
    await tx.insert(memberships).values({ orgId: org.id, userId: user.id, role: "owner" });
    if (catLabels.length > 0) {
      await tx.insert(categories).values(catLabels.map((label) => ({ orgId: org.id, label })));
    }

    // accepte les invitations en attente pour cet e-mail
    const pending = await tx.select().from(invitations).where(and(eq(invitations.email, email), eq(invitations.status, "pending")));
    for (const inv of pending) {
      await tx
        .insert(memberships)
        .values({ orgId: inv.orgId, userId: user.id, role: inv.role as Role })
        .onConflictDoNothing();
      await tx.update(invitations).set({ status: "accepted" }).where(eq(invitations.id, inv.id));
    }
    return user.id;
  });

  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);

  return NextResponse.json({ ok: true, isSuperAdmin: false });
}

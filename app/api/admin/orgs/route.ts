import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, memberships, organizations } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PLANS, STATUS_LABEL, trialDaysLeft } from "@/lib/billing/plans";

// GET /api/admin/orgs — toutes les organisations + leur abonnement + nb de
// membres. Réservé au super-admin plateforme.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  const memberCounts = db
    .select({ orgId: memberships.orgId, count: sql<number>`count(*)::int`.as("count") })
    .from(memberships)
    .groupBy(memberships.orgId)
    .as("mc");

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      status: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      monthlyBudget: organizations.monthlyBudget,
      createdAt: organizations.createdAt,
      members: sql<number>`coalesce(${memberCounts.count}, 0)`,
    })
    .from(organizations)
    .leftJoin(memberCounts, sql`${memberCounts.orgId} = ${organizations.id}`)
    .orderBy(desc(organizations.createdAt));

  return NextResponse.json({
    orgs: rows.map((o) => ({
      ...o,
      planLabel: PLANS[o.plan].label,
      priceEUR: PLANS[o.plan].priceEUR,
      statusLabel: STATUS_LABEL[o.status],
      trialDaysLeft: trialDaysLeft(o.trialEndsAt),
    })),
  });
}

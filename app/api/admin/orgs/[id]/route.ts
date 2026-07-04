import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { adminAudit, db, organizations } from "@/lib/db";
import type { Plan, SubscriptionStatus } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PLANS, STATUS_LABEL, trialDaysLeft } from "@/lib/billing/plans";

// PATCH /api/admin/orgs/[id] — change le plan, le statut d'abonnement, ou
// prolonge l'essai d'une org. Réservé au super-admin. Chaque changement est
// journalisé dans admin_audit.

export const runtime = "nodejs";

const PLANS_VALID: Plan[] = ["chasseur", "pro", "equipe"];
const STATUS_VALID: SubscriptionStatus[] = ["trialing", "active", "past_due", "suspended", "canceled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const admin = guard.value;
  const { id } = await params;

  let body: { plan?: unknown; status?: unknown; extendTrialDays?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { code: "invalid_body", message: "JSON attendu" } }, { status: 422 });
  }

  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  if (!org) return NextResponse.json({ error: { code: "not_found", message: "Organisation inconnue" } }, { status: 404 });

  const set: Partial<typeof organizations.$inferInsert> = {};
  const audits: { action: string; detail: string }[] = [];

  if (typeof body.plan === "string") {
    if (!PLANS_VALID.includes(body.plan as Plan)) {
      return NextResponse.json({ error: { code: "invalid_body", message: "Plan invalide" } }, { status: 422 });
    }
    if (body.plan !== org.plan) {
      set.plan = body.plan as Plan;
      audits.push({ action: "plan.change", detail: `${org.plan} → ${body.plan}` });
    }
  }

  if (typeof body.status === "string") {
    if (!STATUS_VALID.includes(body.status as SubscriptionStatus)) {
      return NextResponse.json({ error: { code: "invalid_body", message: "Statut invalide" } }, { status: 422 });
    }
    if (body.status !== org.subscriptionStatus) {
      set.subscriptionStatus = body.status as SubscriptionStatus;
      audits.push({ action: "status.change", detail: `${org.subscriptionStatus} → ${body.status}` });
    }
  }

  if (body.extendTrialDays !== undefined) {
    const days = Number(body.extendTrialDays);
    if (!Number.isFinite(days)) {
      return NextResponse.json({ error: { code: "invalid_body", message: "Durée d'essai invalide" } }, { status: 422 });
    }
    const base = org.trialEndsAt && org.trialEndsAt.getTime() > Date.now() ? org.trialEndsAt.getTime() : Date.now();
    const next = new Date(base + days * 24 * 3600 * 1000);
    set.trialEndsAt = next;
    if (org.subscriptionStatus === "canceled" || org.subscriptionStatus === "suspended") set.subscriptionStatus = "trialing";
    audits.push({ action: "trial.extend", detail: `+${days} j → ${next.toISOString().slice(0, 10)}` });
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: { code: "noop", message: "Aucun changement" } }, { status: 400 });
  }

  const [updated] = await db.update(organizations).set(set).where(eq(organizations.id, id)).returning();
  if (audits.length > 0) {
    await db.insert(adminAudit).values(audits.map((a) => ({ actorUserId: admin.id, orgId: id, action: a.action, detail: a.detail })));
  }

  return NextResponse.json({
    ok: true,
    org: {
      id: updated.id,
      name: updated.name,
      plan: updated.plan,
      planLabel: PLANS[updated.plan].label,
      priceEUR: PLANS[updated.plan].priceEUR,
      status: updated.subscriptionStatus,
      statusLabel: STATUS_LABEL[updated.subscriptionStatus],
      trialEndsAt: updated.trialEndsAt,
      trialDaysLeft: trialDaysLeft(updated.trialEndsAt),
    },
  });
}

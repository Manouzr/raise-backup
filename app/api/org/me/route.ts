import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth/current";
import { PLANS, STATUS_LABEL, trialDaysLeft } from "@/lib/billing/plans";

// GET /api/org/me — identité + org courante + abonnement (pour /reglages, la
// sidebar…). L'abonnement est toujours relu en base : un changement de plan par
// l'admin est visible au prochain chargement.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });

  const { user, org, role } = ctx;
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin },
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      role,
      plan: org.plan,
      planLabel: PLANS[org.plan].label,
      priceEUR: PLANS[org.plan].priceEUR,
      status: org.subscriptionStatus,
      statusLabel: STATUS_LABEL[org.subscriptionStatus],
      trialEndsAt: org.trialEndsAt,
      trialDaysLeft: trialDaysLeft(org.trialEndsAt),
      monthlyBudget: org.monthlyBudget,
      defaultCeiling: org.defaultCeiling,
    },
  });
}

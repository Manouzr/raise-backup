import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, invitations, memberships, users } from "@/lib/db";
import type { Role } from "@/lib/db";
import { requireContext } from "@/lib/auth/guards";

// GET  /api/org/members — membres de l'org courante + invitations en attente.
// POST /api/org/members { email, role } — invite un membre (Owner uniquement) :
//   si le compte existe déjà → membership immédiat ; sinon → invitation en
//   attente (rejointe automatiquement à l'inscription).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = { owner: "Owner", encherisseur: "Enchérisseur", observateur: "Observateur" };

export async function GET(): Promise<Response> {
  const guard = await requireContext();
  if (!guard.ok) return guard.response;
  const { org } = guard.value;

  const rows = await db
    .select({ id: memberships.id, role: memberships.role, name: users.name, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.orgId, org.id));

  const pending = await db
    .select({ id: invitations.id, email: invitations.email, role: invitations.role, status: invitations.status })
    .from(invitations)
    .where(eq(invitations.orgId, org.id));

  return NextResponse.json({
    members: rows.map((m) => ({ ...m, roleLabel: ROLE_LABEL[m.role] })),
    invitations: pending.filter((i) => i.status === "pending"),
  });
}

export async function POST(req: Request): Promise<Response> {
  const guard = await requireContext();
  if (!guard.ok) return guard.response;
  const { org, user, role } = guard.value;
  if (role !== "owner") {
    return NextResponse.json({ error: { code: "forbidden", message: "Seul l'Owner peut inviter" } }, { status: 403 });
  }

  let body: { email?: unknown; role?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { code: "invalid_body", message: "JSON attendu" } }, { status: 422 });
  }
  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const inviteRole: Role = body.role === "encherisseur" || body.role === "observateur" || body.role === "owner" ? body.role : "observateur";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: { code: "invalid_body", message: "E-mail valide requis" } }, { status: 422 });
  }

  const [target] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (target) {
    await db
      .insert(memberships)
      .values({ orgId: org.id, userId: target.id, role: inviteRole })
      .onConflictDoUpdate({ target: [memberships.orgId, memberships.userId], set: { role: inviteRole } });
    return NextResponse.json({
      ok: true,
      status: "joined",
      member: { name: target.name, email: target.email, role: inviteRole, roleLabel: ROLE_LABEL[inviteRole] },
    });
  }

  await db
    .insert(invitations)
    .values({ orgId: org.id, email, role: inviteRole, invitedByUserId: user.id })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true, status: "invited", invitation: { email, role: inviteRole } });
}

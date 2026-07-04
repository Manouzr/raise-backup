import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

// POST /api/auth/login { email, password } — vérifie, ouvre la session.
// Réponse : { ok, isSuperAdmin } (le client route vers /admin ou /).

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { code: "invalid_body", message: "JSON attendu" } }, { status: 422 });
  }

  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: { code: "invalid_body", message: "E-mail et mot de passe requis" } }, { status: 422 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // message identique que l'e-mail existe ou non (pas d'énumération de comptes)
  const invalid = () =>
    NextResponse.json({ error: { code: "invalid_credentials", message: "E-mail ou mot de passe incorrect" } }, { status: 401 });
  if (!user) {
    await verifyPassword(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidin"); // timing constant
    return invalid();
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid();

  const token = await signSession(user.id);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);

  return NextResponse.json({ ok: true, isSuperAdmin: user.isSuperAdmin });
}

import { SignJWT, jwtVerify } from "jose";

// Session = JWT signé (HS256) dans un cookie httpOnly. jose est isomorphe :
// même code de vérification côté Node (route handlers) et Edge (middleware).
// Le JWT ne porte QUE l'identité (userId) — le rôle, l'org et l'abonnement
// sont toujours relus en base pour rester à jour (un changement de plan par
// l'admin prend effet immédiatement, sans attendre l'expiration du token).

export const SESSION_COOKIE = "bidedge_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 jours

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant (.env.local)");
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
};

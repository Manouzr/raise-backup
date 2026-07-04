import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@/lib/db";
import { getCurrentContext, getCurrentUser, type SessionContext } from "./current";

// Gardes pour les route handlers d'API. Renvoient une Response 401/403 à
// retourner telle quelle, ou le contexte si l'accès est autorisé.

type Guard<T> = { ok: true; value: T } | { ok: false; response: Response };

const unauthorized = () =>
  NextResponse.json({ error: { code: "unauthorized", message: "Connexion requise" } }, { status: 401 });
const forbidden = (message = "Accès refusé") =>
  NextResponse.json({ error: { code: "forbidden", message } }, { status: 403 });

export async function requireUser(): Promise<Guard<User>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: unauthorized() };
  return { ok: true, value: user };
}

export async function requireContext(): Promise<Guard<SessionContext>> {
  const ctx = await getCurrentContext();
  if (!ctx) return { ok: false, response: unauthorized() };
  return { ok: true, value: ctx };
}

export async function requireSuperAdmin(): Promise<Guard<User>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: unauthorized() };
  if (!user.isSuperAdmin) return { ok: false, response: forbidden("Réservé aux administrateurs plateforme") };
  return { ok: true, value: user };
}

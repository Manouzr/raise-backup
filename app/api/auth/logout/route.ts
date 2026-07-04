import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

// POST /api/auth/logout — efface la session.
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

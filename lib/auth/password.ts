import bcrypt from "bcryptjs";

// Hash de mot de passe — bcryptjs (pur JS, aucune dépendance native : fiable
// sur Windows en dev comme sur Vercel).

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

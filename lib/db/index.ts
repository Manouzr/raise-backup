import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Client DB partagé (postgres.js + Drizzle). `prepare: false` car le endpoint
// Neon "-pooler" est en mode transaction (PgBouncer) qui ne supporte pas les
// requêtes préparées. Client mis en cache sur globalThis pour ne pas épuiser
// les connexions au hot-reload de Next en dev.

const globalForDb = globalThis as unknown as {
  __bidedgeSql?: ReturnType<typeof postgres>;
};

function getClient() {
  if (!globalForDb.__bidedgeSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant (.env.local)");
    globalForDb.__bidedgeSql = postgres(url, { prepare: false, max: 5 });
  }
  return globalForDb.__bidedgeSql;
}

export const db = drizzle(getClient(), { schema });
export * from "./schema";

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Migrations via la connexion DIRECTE (pas le pooler) — DDL + prepared OK.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});

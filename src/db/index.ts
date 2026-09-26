import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon's HTTP driver: one fetch per query, no connection pool, which suits Vercel functions.
// It has no interactive transactions; use db.batch([...]) when several writes must succeed together.
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env (local) or the Vercel project settings (deployed).");
  }
  return drizzle(neon(url), { schema });
}

let instance: ReturnType<typeof createDb> | undefined;

/** Lazily created so builds and routes that don't touch the DB work without DATABASE_URL. */
export function getDb() {
  instance ??= createDb();
  return instance;
}

export { schema };

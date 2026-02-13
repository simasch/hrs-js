import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "~/server/db/schema";
import { createCaller } from "~/server/api/root";

// Read and cache migration SQL at module load
const migrationsDir = path.join(process.cwd(), "drizzle");
const migrationStatements = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .flatMap((file) => {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    return sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
  });

/**
 * Creates a fresh in-memory SQLite database with the schema applied.
 * Each call returns an isolated database — perfect for test isolation.
 */
export async function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  for (const stmt of migrationStatements) {
    await client.execute(stmt);
  }

  return { db, client };
}

/**
 * Creates a tRPC caller backed by a fresh in-memory database.
 * Returns the caller, db (for seeding), and client (for cleanup).
 */
export async function createTestCaller() {
  const { db, client } = await createTestDb();
  const caller = createCaller({ db, headers: new Headers() });
  return { caller, db, client };
}

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import * as schema from "./schema";
import demoSql from "./demo.sql?raw";

const isVercel = !!process.env.VERCEL;
const defaultPath = isVercel ? join(tmpdir(), "canvass.db") : "data/canvass.db";
const url = process.env.DATABASE_URL ?? defaultPath;

if (!isVercel) {
  mkdirSync(dirname(url), { recursive: true });
}

const sqlite = new Database(url);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };

// On a fresh DB (Vercel cold start with ephemeral /tmp, or a wiped local
// data/canvass.db) the file exists but is empty. Bootstrap schema + seed
// from the bundled demo dump so the demo is self-contained — no need for
// drizzle-kit migrations to run at build/deploy time.
const hasAddresses = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='addresses'")
  .get();

if (!hasAddresses) {
  sqlite.exec(demoSql);
}

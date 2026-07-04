// Smoke test: simulate a Vercel cold start (fresh /tmp/canvass.db) and
// verify the bundled demo.sql + bootstrap logic produce a queryable DB.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { count } from "drizzle-orm";
import { readFileSync, unlinkSync, existsSync } from "node:fs";
import * as schema from "../src/lib/db/schema";

const DB_PATH = "/tmp/canvass-bootstrap-test.db";
for (const suffix of ["", "-shm", "-wal"]) {
  const p = DB_PATH + suffix;
  if (existsSync(p)) unlinkSync(p);
}

const demoSql = readFileSync(
  new URL("../src/lib/db/demo.sql", import.meta.url),
  "utf-8",
)
  .split("\n")
  .filter((l) => !l.startsWith("/*") && !l.startsWith("//"))
  .join("\n");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const before = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='addresses'")
  .get();
console.log("hasAddresses (pre-bootstrap):", before);

if (!before) {
  sqlite.exec(demoSql);
}

const after = {
  addresses: db.select({ n: count() }).from(schema.addresses).get()?.n,
  people: db.select({ n: count() }).from(schema.people).get()?.n,
  visits: db.select({ n: count() }).from(schema.visits).get()?.n,
  imports: db.select({ n: count() }).from(schema.imports).get()?.n,
};
console.log("After bootstrap:", after);

const sample = db.select().from(schema.addresses).limit(3).all();
console.log("Sample addresses:");
for (const a of sample) {
  console.log(`  #${a.id} ${a.street}, ${a.city} (${a.lat.toFixed(4)}, ${a.lng.toFixed(4)})`);
}

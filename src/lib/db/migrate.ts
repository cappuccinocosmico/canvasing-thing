import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

export async function runMigrations() {
  // drizzle-kit push is the dev workflow, but if no migrations exist yet
  // we'll fall back to a force schema push so seed always works on a fresh checkout.
  try {
    migrate(db, { migrationsFolder: "./drizzle" });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("Cannot find")) {
      // no migrations generated yet — run drizzle-kit push via CLI in setup
      throw new Error(
        "No drizzle migrations found. Run `pnpm db:generate && pnpm db:push` first.",
      );
    }
    throw err;
  }
}

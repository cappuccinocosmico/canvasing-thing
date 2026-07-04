#!/usr/bin/env python3
"""
Regenerate src/lib/db/demo.sql from a freshly-seeded local data/canvass.db.

Usage:
    pnpm seed                      # produces data/canvass.db with new data
    python3 scripts/dump-demo-data.py

Reads data/canvass.db, emits src/lib/db/demo.sql with the full schema and seed
data, minus the bits SQLite's .dump adds that don't play well with
better-sqlite3 (drizzle migration bookkeeping, the sqlite_sequence resets that
require PRAGMA writable_schema=ON, and the matching writable_schema=OFF).

The resulting demo.sql is loaded by src/lib/db/client.ts whenever it sees a
fresh SQLite (Vercel cold start with ephemeral /tmp, or a wiped local DB),
so the demo is fully self-contained — no migration step required at deploy.
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "canvass.db"
OUT = ROOT / "src" / "lib" / "db" / "demo.sql"

if not DB.exists():
    sys.exit(
        f"no local database at {DB} — run `pnpm seed` first to produce fresh data"
    )

# sqlite3 CLI is required to call .dump.
if not shutil.which("sqlite3"):
    sys.exit("sqlite3 CLI not found in PATH; install it or use your distro's package")

dump = subprocess.check_output(["sqlite3", str(DB), ".dump"], text=True)

# Drop the drizzle migrator bookkeeping: the CREATE TABLE + the row it inserted.
dump = re.sub(
    r'CREATE TABLE[^;]*"__drizzle_migrations"[^;]*;\s*'
    r'INSERT INTO __drizzle_migrations[^;]*;\s*',
    "",
    dump,
    flags=re.DOTALL,
)

# Drop the sqlite_sequence CREATE/INSERT block; better-sqlite3 rejects explicit
# CREATE TABLE on the reserved sqlite_sequence name, and SQLite auto-creates it
# on the first AUTOINCREMENT insert. We also drop the PRAGMA writable_schema=OFF
# that wrapped that block, since it has no purpose on its own.
dump = re.sub(
    r'PRAGMA writable_schema=ON;\s*'
    r'CREATE TABLE IF NOT EXISTS sqlite_sequence[^;]*;\s*'
    r'DELETE FROM sqlite_sequence;\s*'
    r'(?:INSERT INTO sqlite_sequence[^;]*;\s*)*',
    "",
    dump,
    flags=re.DOTALL,
)
dump = re.sub(r'PRAGMA writable_schema=OFF;\s*', "", dump)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "/* eslint-disable */\n"
    "// Auto-generated full schema + seed dump, used to bootstrap a fresh SQLite on\n"
    "// Vercel cold starts (and on a clean local checkout that deleted data/canvass.db).\n"
    "// Regenerate after reseeding locally:\n"
    "//   pnpm seed\n"
    "//   python3 scripts/dump-demo-data.py\n"
    "\n"
    + dump
)

print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {dump.count(chr(10))} lines)")

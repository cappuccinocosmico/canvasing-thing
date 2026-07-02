#!/usr/bin/env -S node --experimental-strip-types
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as wait } from "node:timers/promises";
import { chromium, type ConsoleMessage, type Request, type Response } from "playwright";
import Database from "better-sqlite3";

const BASE = "http://localhost:3000";
const SCREENSHOTS = "screenshots";
const LOG = "screenshots/verify.log";
// If a dev server is already on $BASE, skip spawning our own.
const EXTERNAL_SERVER = process.env.VERIFY_NO_SPAWN === "1";
// Restrict tile-network log to these (otherwise it's hundreds of .png 200s)
const TILE_HOST_RE = /basemaps\.cartocdn\.com|demotiles\.maplibre\.org|openstreetmap/;

if (!existsSync(SCREENSHOTS)) mkdirSync(SCREENSHOTS, { recursive: true });

const log: string[] = [];
const logln = (s: string) => {
  console.log(s);
  log.push(s);
};

const ROUTES: { path: string; name: string; checks: string[] }[] = [
  { path: "/", name: "home", checks: [".maplibregl-canvas", "text=Overview"] },
  { path: "/visits", name: "visits", checks: ["table", "text=Visits"] },
  { path: "/import", name: "import", checks: ["form", "text=Import"] },
];

type FirstAddress = { id: number; lng: number; lat: number; street: string };

function getFirstAddress(): FirstAddress {
  const db = new Database("data/canvass.db", { readonly: true });
  const row = db
    .prepare("SELECT id, lng, lat, street FROM addresses ORDER BY id LIMIT 1")
    .get() as FirstAddress | undefined;
  db.close();
  if (!row) throw new Error("no addresses in db — run pnpm seed first");
  return row;
}

function spawnDev(): ChildProcess {
  return spawn("pnpm", ["dev"], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0" } });
}

async function waitForServer(): Promise<boolean> {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + "/"); if (r.ok) return true; } catch {}
    await wait(500);
  }
  return false;
}

async function main() {
  let dev: ChildProcess | null = null;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let exitCode = 0;

  logln(`▶ verify starting`);

  try {
    const first = getFirstAddress();
    ROUTES.push({ path: `/addresses/${first.id}`, name: "address-detail", checks: ["text=Log a visit"] });

    if (EXTERNAL_SERVER) {
      logln(`  (using existing server, no spawn)`);
    } else {
      logln(`▶ spawning dev server`);
      dev = spawnDev();
      dev.stdout?.on("data", (b) => process.stderr.write(`[dev] ${b}`));
      dev.stderr?.on("data", (b) => process.stderr.write(`[dev-err] ${b}`));
    }

    logln(`▶ waiting for ${BASE}`);
    if (!(await waitForServer())) throw new Error("dev server did not respond within 30s");

    // warm routes so vinxi compiles them
    for (const r of ROUTES) { try { await fetch(BASE + r.path); } catch {} }
    await wait(2000);
    logln(`✓ server ready`);

    logln(`▶ launching chromium`);
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    // per-page event accumulators
    const consoleEvents: { route: string; type: string; text: string }[] = [];
    const pageErrors: { route: string; message: string }[] = [];
    const tileRequests: { route: string; url: string; status: number }[] = [];

    page.on("console", (m: ConsoleMessage) => {
      consoleEvents.push({ route: page.url().replace(BASE, ""), type: m.type(), text: m.text() });
    });
    page.on("pageerror", (e) => {
      const msg = e.message;
      if (msg.includes("WebSocket closed without opened")) return; // HMR noise
      pageErrors.push({ route: page.url().replace(BASE, ""), message: msg });
    });
    page.on("requestfailed", (r: Request) => {
      const u = r.url();
      if (TILE_HOST_RE.test(u) || /\.(png|webp|pbf|json)$/.test(u)) {
        pageErrors.push({ route: page.url().replace(BASE, ""), message: `request failed: ${r.failure()?.errorText} ${u}` });
      }
    });
    page.on("response", (r: Response) => {
      if (TILE_HOST_RE.test(r.url())) tileRequests.push({ route: page.url().replace(BASE, ""), url: r.url(), status: r.status() });
    });

    for (const r of ROUTES) {
      logln(`\n━━━ ${r.path} ━━━`);
      const tileBefore = tileRequests.length;

      const url = BASE + r.path;
      const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await wait(1500); // let map tiles settle
      logln(`  status: ${resp?.status() ?? 0}`);

      // element checks
      for (const sel of r.checks) {
        const c = await page.locator(sel).count();
        const ok = c > 0;
        logln(`  check ${sel}: ${ok ? "✓" : "✗"} (${c})`);
        if (!ok) exitCode = 1;
      }

      // tile / style requests captured since this route started
      const newTiles = tileRequests.slice(tileBefore);
      const tileFailed = newTiles.filter((t) => t.status >= 400);
      if (tileFailed.length > 0) {
        logln(`  ✗ tile errors:`);
        for (const t of tileFailed.slice(0, 5)) logln(`    ${t.status} ${t.url.slice(0, 100)}`);
        exitCode = 1;
      } else if (newTiles.length > 0) {
        logln(`  ✓ tile reqs: ${newTiles.length} (sample ${newTiles[0].url.slice(0, 80)})`);
      } else if (r.path === "/") {
        logln(`  ⚠ no tile requests captured for map page`);
      }

      await page.screenshot({ path: `${SCREENSHOTS}/${r.name}.png`, fullPage: false });
      logln(`  screenshot: screenshots/${r.name}.png`);

      if (pageErrors.length > 0) {
        const recent = pageErrors.filter((e) => e.route === r.path);
        if (recent.length > 0) {
          logln(`  ✗ page errors (${recent.length}):`);
          for (const e of recent.slice(0, 5)) logln(`    ${e.message}`);
          exitCode = 1;
        }
      }
    }

    logln(`\n━━━ click interaction ━━━`);
    const errorsBefore = pageErrors.length;
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction(
      () => (window as unknown as { __map?: unknown }).__map != null,
      null,
      { timeout: 10000 },
    );
    // Wait for the addresses source to have features loaded.
    await page.waitForFunction(
      () => {
        const m = (window as unknown as { __map?: { querySourceFeatures: (id: string) => unknown[] } }).__map;
        return m != null && m.querySourceFeatures("addresses").length > 0;
      },
      null,
      { timeout: 10000 },
    );

    // Fit a tight box around the first address, then wait for the map to be fully idle
    // (cluster source recomputed, tiles loaded) before we click.
    const target = await page.evaluate(
      ([lng, lat]) =>
        new Promise<{ x: number; y: number; street: string } | { error: string }>(
          (resolve) => {
            const m = (window as unknown as { __map: import("maplibre-gl").Map }).__map;
            m.once("idle", () => {
              requestAnimationFrame(() => {
                const c = m.getContainer();
                const r = c.getBoundingClientRect();
                const p = m.project([lng, lat]);
                const features = m.queryRenderedFeatures(p, {
                  layers: ["unclustered-point"],
                });
                const street = (features[0]?.properties as { street?: string } | undefined)?.street ?? "";
                resolve({ x: r.x + p.x, y: r.y + p.y, street });
              });
            });
            m.fitBounds(
              [
                [lng - 0.0008, lat - 0.0008],
                [lng + 0.0008, lat + 0.0008],
              ],
              { padding: 60, maxZoom: 18, duration: 0 },
            );
            setTimeout(() => resolve({ error: "idle timeout" }), 8000);
          },
        ),
      [first.lng, first.lat],
    );
    if ("error" in target) {
      logln(`  ✗ map fit failed: ${target.error}`);
      exitCode = 1;
    } else {
      logln(
        `  targeting: id=${first.id} "${first.street}" at px ${target.x.toFixed(0)},${target.y.toFixed(0)} (street at point: "${target.street}")`,
      );
      await page.mouse.click(target.x, target.y);

      const card = page.locator('[data-testid="address-info-card"]');
      await card.waitFor({ state: "visible", timeout: 5000 });
      const cardText = (await card.innerText()).replace(/\s+/g, " ").trim();
      const streetOk = cardText.includes(first.street);
      logln(`  ${streetOk ? "✓" : "✗"} card visible with street: "${first.street}"`);
      if (!streetOk) exitCode = 1;
      await page.screenshot({ path: `${SCREENSHOTS}/home-selected.png` });
      logln(`  screenshot: screenshots/home-selected.png`);

      await page.keyboard.press("Escape");
      await card.waitFor({ state: "detached", timeout: 3000 });
      logln(`  ✓ Escape dismisses card`);
      await page.screenshot({ path: `${SCREENSHOTS}/home-cleared.png` });
      logln(`  screenshot: screenshots/home-cleared.png`);
    }

    const newErrors = pageErrors.slice(errorsBefore);
    if (newErrors.length > 0) {
      logln(`  ✗ ${newErrors.length} error(s) during interaction:`);
      for (const e of newErrors.slice(0, 5)) logln(`    ${e.message}`);
      exitCode = 1;
    }

    logln(`\n━━━ summary ━━━`);
    logln(`  routes visited:    ${ROUTES.length}`);
    logln(`  page errors total: ${pageErrors.length}`);
    logln(`  tile reqs total:   ${tileRequests.length}`);
    logln(`  console messages:  ${consoleEvents.length}`);
  } catch (e) {
    logln(`✗ FATAL: ${(e as Error).message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (dev) {
      try { process.kill(-dev.pid!, "SIGTERM"); } catch {}
      try { dev.kill("SIGKILL"); } catch {}
      spawnSync("pkill", ["-9", "-f", "vinxi|vite|node.*vinxi"], { stdio: "ignore" });
    }
    writeFileSync(LOG, log.join("\n") + "\n");
    logln(`\n→ log: ${LOG}`);
    logln(`→ screenshots: ${SCREENSHOTS}/`);
  }

  process.exit(exitCode);
}

main();

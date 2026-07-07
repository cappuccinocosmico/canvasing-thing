# canvasing-thing

A small canvassing / door-knocking app for a friend's community organizing work. Map of addresses, log visits, import a CSV of residents. Anonymous — no user accounts, no voting tools.

## Stack

- **SolidStart** 1.3.x (Vinxi + Vite) with SSR
- In-memory data store backed by a committed `data/seed.json` (SolidJS `createStore`); mutations reset on refresh
- **MapLibre GL** + `solid-map-gl`, OpenStreetMap raster tiles
- **Tailwind CSS** + **DaisyUI**
- **TanStack Solid Query** for data fetching
- **Photon** (OSM-backed) for geocoding — no API key
- **Papa Parse** for CSV import
- **@faker-js/faker** (devDep) for the JSON seed script
- **devenv** for the dev environment (Node 24, pnpm)

## Quick start

```sh
# 1. enter the devenv shell (loads node + pnpm)
devenv shell

# 2. install JS deps (only needed the first time)
pnpm install

# 3. (optional) regenerate the sample data
pnpm seed             # writes data/seed.json with 30 Boulder, CO addresses

# 4. run the dev server
pnpm dev              # http://localhost:3000
```

## Scripts

| script | what it does |
| --- | --- |
| `pnpm dev` | start the SolidStart dev server on :3000 |
| `pnpm build` | production build |
| `pnpm start` | run the production build |
| `pnpm seed` | regenerate `data/seed.json` (30 Boulder addresses, randomized) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm verify` | launch chromium, screenshot all routes to `screenshots/`, dump console + page errors + failed tile requests to `screenshots/verify.log`. Use `VERIFY_NO_SPAWN=1` to skip its own dev-server spawn (if one is already running). |

## Routes

| path | what it is |
| --- | --- |
| `/` | map of all addresses. Pins: red = never visited, green = last visit was `home`, yellow = not home / unknown. **Click a pin to open an info card** (top-right) with people count, visit count, and a link to the detail page. Click empty map, click a cluster, or press Escape to dismiss. Cluster bubbles expand on click. |
| `/addresses/:id` | detail view: people at this address, a visit form, full visit history |
| `/visits` | table of all visits, filter by "all / talked / interested / home" |
| `/import` | upload a CSV of residents. Auto-maps common column names (`firstName`, `first`, `fname`, `givenName`, etc.). Required: first name, last name, street, city, state, zip. Optional: age, party. Geocodes new addresses via Photon. Imported rows live in browser memory and reset on refresh. |

## CSV format

```csv
firstName,lastName,street,city,state,zip,age,party
Avery,Quinn,1500 Pearl St,Boulder,CO,80302,34,DEM
Riley,Morgan,2500 Broadway,Boulder,CO,80302,55,UNA
```

Headers are case-insensitive and many aliases are accepted (`fname`/`givenName`, `address1`/`street`, `postalcode`/`zip`, `affiliation`/`party`, …). Re-uploading the same file is idempotent on address (matches on `street + zip`).

## Data

There is no database. `data/seed.json` is the source of truth for the initial dataset (committed). At runtime the data lives in a SolidJS `createStore` initialized from that JSON. Logging a visit or importing a CSV mutates the store in place — those changes are not persisted, so a page refresh resets back to the seed.

When you're ready to add persistence, the swap surface is `src/lib/data/store.ts` (the three `add*` functions) and `src/lib/data/addresses.ts` (the four read functions). The shapes in `src/lib/data/types.ts` are the contract every consumer agrees on.

## Photon / rate limits

The CSV import geocodes through [Photon](https://photon.komoot.io) (OSM-backed, no key). The seed script does not hit the network — it places addresses at jittered coords around downtown Boulder. Importing a large CSV takes roughly `N + 1` seconds against Photon.

## Layout

```
src/
  app.tsx                  # Router + QueryClientProvider
  app.css                  # Tailwind layers
  entry-client.tsx         # hydrate root
  entry-server.tsx         # SSR entry
  routes/
    index.tsx              # map page
    addresses/[id].tsx     # address detail + visit form
    visits.tsx             # visits table
    import.tsx             # CSV upload
    [...404].tsx
  lib/
    components/
      Map.tsx              # MapLibre + clustered GeoJSON, click handler sets mapSelection signal
      MapClient.tsx        # clientOnly() wrapper
      AddressInfoCard.tsx  # top-right card on the map page, reads mapSelection signal
      Nav.tsx
    stores/
      mapSelection.ts      # module-level signal: which pin is selected
    data/
      types.ts             # Address, Person, Visit, HomeStatus, etc.
      store.ts             # SolidJS createStore, addAddress/addPerson/addVisit
      addresses.ts         # listAddresses, getAddress, logVisit, listVisits, stats
      csv.ts               # importCsv with auto column mapping
      geocode.ts           # Photon wrapper with in-process cache
      seed.ts              # writes data/seed.json
data/seed.json             # committed initial dataset (gitignored)
scripts/verify.tsx         # Playwright harness (pnpm verify)
screenshots/               # verify script output (.gitignored)
devenv.nix                 # devenv shell config (nodejs_24, pnpm, playwright env)
devenv.yaml                # pinned nixpkgs + nixpkgs-playwright inputs
pnpm-workspace.yaml        # pnpm 11 allowBuilds for native modules
```

## Dev notes

- `pnpm install` triggers native builds for `@parcel/watcher` and `esbuild`. The list lives in `pnpm-workspace.yaml` under `allowBuilds` because pnpm 11 removed the package.json `pnpm.onlyBuiltDependencies` field and global `~/.config/pnpm/config.yaml` won't accept it.
- The dev server is `vinxi dev` (SolidStart's bundler). It picks up file changes via HMR; you usually don't need to restart.
- **HMR port**: vinxi 0.5.x's HMR WebSocket is pinned to port **3002** in `app.config.ts` (`server.hmr.port: 3002, clientPort: 3002`). Without this, vinxi picks a random port per launch and the browser keeps a stale `ws://...:NNNN/` URL cached from the previous run, spamming "Firefox can't establish a connection" on every reload. The HTTP server stays on 3000; only the HMR socket is on 3002.
- **maplibre-gl**: imported as `import * as maplibregl from "maplibre-gl"` (namespace) and added to `optimizeDeps.include`. The UMD source has no `default` export, so vite must pre-bundle it (esbuild's CJS interop synthesizes one). With `optimizeDeps.exclude: ["maplibre-gl"]` the browser gets the raw UMD file and dies with `doesn't provide an export named: 'default'`.
- **solid-map-gl MapGL z-index**: `solid-map-gl`'s `MapGL` component defaults to `style={{ position: "absolute", inset: 0, "z-index": -1 }}` when neither `class` nor `classList` is passed. That `z-index: -1` parks the canvas behind the parent — the page renders, the map renders, but you see the parent's background, not the map. Pass `style={{ position: "absolute", inset: 0 }}` (or a class that overrides `.maplibregl-map`'s `position: relative` rule) to bring it forward. (Tailwind `class="absolute inset-0"` does **not** work because the bundled `maplibre-gl.css` rule for `.maplibregl-map { position: relative; }` has equal specificity and wins depending on declaration order.)
- **solid-map-gl Layer id**: `solid-map-gl`'s `Layer` component reads its maplibre layer id from the **`id` prop**, not from `style.id`. If you only set `style={{ id: "clusters", ... }}`, the layer is registered with an auto-generated id and `map.on("click", "clusters", ...)` will never fire. Always pass `id` as a top-level prop: `<Layer id="clusters" style={{ type: "circle", ... }} />`.
- **Basemap tiles**: OSM's `tile.openstreetmap.org` rejects headless-browser fetches (no Referer, generic UA). The map style uses [Carto Positron](https://carto.com/basemaps) via `basemaps.cartocdn.com` instead — permissive CORS, no key, fair-use.
- **`pnpm verify`**: a tiny Playwright harness (not a test framework). It boots the dev server, opens headless chromium, visits `/`, `/visits`, `/import`, and `/addresses/:id`, screenshots each to `screenshots/`, and writes a summary to `screenshots/verify.log`. After the route loop, it zooms into the first address, clicks the pin, asserts the info card appears with the right street, presses Escape, and asserts the card detaches. The browser binary is the nixpkgs-bundled chromium from `playwright.browsers` (pinned nixpkgs commit in `devenv.yaml` to match npm version); see the [NixOS Playwright wiki](https://wiki.nixos.org/wiki/Playwright).

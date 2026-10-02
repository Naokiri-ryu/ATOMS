# AGENTS.md — teknik2026 (monorepo root)

Three independent web apps for AirNav Indonesia (intranet deployment). No root `package.json`, no shared build. Work inside the subfolder of the app you change.

## Dev environment & sync setup (READ FIRST — affects how you run every command below)

This project is edited in a **split client-server setup**:

- **Client (where opencode/VSCode run, where you edit files)**: Windows machine, local folder `C:\dev\teknik2026`
- **Server (where Docker, Postgres, and the actual running apps live)**: WSL Ubuntu at `172.19.38.157`, user `airnav`, project path `/home/airnav/teknik2026`
- **Sync**: Mutagen two-way sync keeps `C:\dev\teknik2026` (beta) and `airnav@172.19.38.157:/home/airnav/teknik2026` (alpha) in sync automatically, in real time, while the Mutagen daemon is running.
- **Excluded from sync**: `node_modules` and `.git` — each side has its own independent copy/state for these.

**Rules for running commands from this file:**

1. **Editing source files** — do this directly on the client (local files). Mutagen propagates changes to the server automatically within seconds.
2. **Any `npm install`, `composer install`, `docker compose`, `artisan`, `composer dev`, `composer test`, or `git` command** — these must run **on the server**, not on the client, since `node_modules`, vendor deps, Docker, and Postgres only exist there. Run them via SSH:
   ```
   ssh airnav@172.19.38.157 "cd /home/airnav/teknik2026/<app-dir> && <command>"
   ```
   e.g.:
   ```
   ssh airnav@172.19.38.157 "cd /home/airnav/teknik2026 && docker compose -f docker-compose.local.yml up -d --build"
   ssh airnav@172.19.38.157 "cd /home/airnav/teknik2026/atoms-maintenance/frontend_atoms-maintenance && npm install"
   ssh airnav@172.19.38.157 "cd /home/airnav/teknik2026/sakti && composer test"
   ```
3. **Before assuming an edit is live**, note that sync depends on the Mutagen daemon being active — if a command run on the server doesn't reflect a just-made edit, that's a sync issue to flag to the user, not a code issue.
4. **Network note**: the client sits behind office SSL inspection (Fortinet). If an outbound request (package registry, external API) fails with a certificate error, report it — don't try to silently disable SSL verification in app code as a workaround.

## Layout & per-app guidance

| App | Purpose | Frontend | Backend | Own AGENTS.md |
|-----|---------|----------|---------|---------------|
| `atoms-maintenance/` | equipment maintenance & ops (Work Orders, CNSD, TFP, grounding, logbook, report) | `frontend_atoms-maintenance/` — React 19 + Vite 8 + Tailwind 3.4 SPA | `backend_atoms-maintenance/` — Laravel 13 + Postgres, API under `/api/v1/` | yes (frontend + backend) |
| `atoms-rostering/` | roster/shift management. SSO + user/employee/shift **source of truth** consumed by the other two apps | `frontend_atoms/` — React 19 + Vite SPA | `backend_atoms/` — Laravel 12 + Postgres + Sanctum. No Swagger — APIs are hand-rolled JSON | — |
| `sakti/` | inventory & borrowing with QR codes | Inertia.js v2 React in `resources/js` | Laravel 12, Pest tests | — |

Read an app's own `AGENTS.md` / context files (`BACKEND_CONTEXT.md`, `FRONTEND_CONTEXT.md`) before working inside it. ⚠️ The two maintenance `AGENTS.md` files lag the code (backend still says "Phase 3 / ready for Work Orders" though it now routes ~16 CNSD + TFP modules; frontend points at a `CLAUDE.md` that no longer exists — real docs: `FRONTEND_CONTEXT.md`, `PRODUCT.md`, `DESIGN.md`). Treat them as context and verify against `routes/api.php` / `src/pages/`.

## Running locally

> Remember: all commands in this section run **on the server** (via SSH — see setup section above), not on the Windows client.

- **Full stack (fastest):** `docker compose -f docker-compose.local.yml up -d --build` (reads root `.env`). Ports: atoms frontend `5656`, atoms backend `5657`, rostering frontend `5658`, rostering backend `5659`, sakti `5660`. **Local dev = this compose only.**
  - ⚠️ Only `docker-compose.yml` is stale (legacy `build: ./atoms` → won't build). `docker-compose.prod.yml` is current but is NOT for local dev — it builds all three apps behind Caddy exposing only ports 80/443 and reads `.env.prod` (see `docs/DEPLOYMENT.md`).
- **Per-app, without Docker (run from that app dir):**
  - Frontends: `npm install` → `npm run dev` (Vite). `npm run lint` (ESLint), `npm run build` (`tsc -b && vite build`). No test framework.
  - Laravel backends: `composer dev` (runs `artisan serve` + queue + pail + `npm run dev` together; Postgres must be reachable per `.env`). `composer test` / `php artisan test`.
  - sakti: `composer dev`; verification gate `composer ci:check` (= `npm run lint:check` + `format:check` + `types:check` + tests); `composer lint` runs Pint.
- Frontends call backends directly (no Vite proxy). Frontends are hostname-aware: each frontend `.env` (gitignored) defines a plain var used when reached from `localhost` and a `_PROD` variant used when reached by IP, with hardcoded `172.19.38.157` fallbacks (see `frontend_atoms-maintenance/src/config/index.ts`). `frontend_atoms-maintenance/.env` currently points the API at `http://localhost:5657/api` (Docker port); a bare-metal backend serves `:8000`.

## Cross-app conventions

- **Rostering owns auth/users.** maintenance + sakti consume rostering identity. maintenance bypasses SSO in dev with `DEV_MOCK_AUTH=true` (backend `mockauth` middleware) + `VITE_DEV_MOCK_AUTH=true` (frontend, seeded mock roles → sends `mock-token-{id}`). sakti has its own Fortify login (seeded `admin@sakti.local` / `teknisi@sakti.local`, see `sakti/README.md`) and also accepts the handoff at `/sso?tokenfix=mock-token-{id}`. Don't duplicate login/account logic elsewhere.
- **Design system (shared, light-mode only):** AirNav navy + single amber accent, fonts `Plus Jakarta Sans` / `IBM Plex Mono` (self-hosted in `/fonts/`). maintenance frontend uses `brand-*` tokens, rostering uses `navy-*`/`accent-*` (each in its `tailwind.config.js`). Follow existing tokens; never introduce dark mode or a new palette.
- **TFP statistics live in two frontends.** `/statistics` in maintenance (5656) and in rostering (5658) both render per-equipment TFP Performance Check data (min/max/avg per measurement point per month). Both read the **same** maintenance backend endpoints `GET /api/v1/statistics/tfp/equipment` and `GET /api/v1/statistics/tfp/{moduleKey}`; rostering goes through `frontend_atoms/src/services/maintenanceStatisticsService.ts` (token hand-off via `ensureMaintenanceAuth()`). Backend logic lives **only** in `backend_atoms-maintenance` — change it there, never in two places. Rostering is the intranet entry point, so a change to statistics that skips rostering is invisible to most users.
- **Backends are separate apps:** frontend/backend pairs are sibling dirs (e.g. `frontend_atoms-maintenance` vs `backend_atoms-maintenance`). JSON responses use `{success, message, data, errors?}`; endpoints validate via Form Request.
- **Secrets:** `.gitignore` excludes `.env`, `.env.local`, `.env.prod`, `.env.save*`, `*.bckp`, `*.xlsx`, `backups/`. Only commit `.env*.example` templates (`.env.local.example`, `.env.prod.example`, `sakti/.env.docker.example`) — copy them to `.env` locally before running.
- **Tests:** maintenance/rostering use PHPUnit; sakti uses Pest (`php artisan test`). Seeders reset/duplicate data on a non-empty DB — reseed only on fresh DBs.

## Gotchas (easy to get wrong)

- **No root `package.json`.** There's a tracked orphan `package-lock.json` at the repo root — never run `npm install` there.
- **`composer dev` needs `pcntl`** (Laravel Pail): works on the WSL server, fails on native Windows. For Windows-without-Docker dev, follow `docs/DEVELOPMENT_SETUP_NATIVE.md` (Laragon; native ports `8000`/`8001`/`8002`, Vite `5173`/`5174`/`5175`) and run `php artisan serve` / `queue:listen` / `npm run dev` manually.
- **sakti tooling:** `npm run lint` runs ESLint `--fix` (mutates files) — use `npm run lint:check` for CI-style checks. sakti's real DB name is `airnav_db` (not `sakti`).
- **maintenance API lives entirely under `/api/v1/`**, organized as per-module groups (`cnsd/*-meter` ×16, `tfp/*`, `ground-check`, `logbook`, `public/monitor`, `statistics`, `dashboard`). The `mockauth` middleware guards the protected group in dev, with `role:...` middleware for per-role gates.

## Deploy (prod — NOT for local dev)

- `docs/DEPLOYMENT.md` + `docs/DOCKER_PROD_PLAN.md` — prod flow: `.env.prod`, `docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`, migrate-on-start, seed once, volume backups.
- `deploy/Caddyfile` — Caddy reverse proxy: intranet self-signed (`tls internal`, no ACME), exposes only ports 80/443. `{$MAIN_DOMAIN}` = rostering (entry), `{$MAINTENANCE_DOMAIN}`, `{$SAKTI_DOMAIN}`; plain-HTTP fallback → rostering frontend.
- `.env.prod.example` is the prod env template (namespaced `MAIN_*` / `MAINTENANCE_*` / `SAKTI_*` vars); legacy `ATOMS_*` aliases still resolve in `docker-compose.prod.yml`.

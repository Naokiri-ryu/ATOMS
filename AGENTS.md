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
| `atoms-rostering/` | roster/shift management. SSO + user/employee/shift **source of truth** consumed by the other two apps | `frontend_atoms/` — React 19 + Vite SPA | `backend_atoms/` — Laravel 12 + Postgres + Sanctum (Swagger at `/api-docs.html`) | — |
| `sakti/` | inventory & borrowing with QR codes | Inertia.js v2 React in `resources/js` | Laravel 12, Pest tests | — |

Read an app's own `AGENTS.md` / context files (`BACKEND_CONTEXT.md`, `FRONTEND_CONTEXT.md`) before working inside it.

## Running locally

> Remember: all commands in this section run **on the server** (via SSH — see setup section above), not on the Windows client.

- **Full stack (fastest):** `docker compose -f docker-compose.local.yml up -d --build` (reads root `.env`). Ports: atoms frontend `5656`, atoms backend `5657`, rostering frontend `5658`, rostering backend `5659`, sakti `5660`.
  - ⚠️ `docker-compose.yml` and `docker-compose.prod.yml` are stale — they build `./atoms/...` which no longer exists. Use `docker-compose.local.yml` for local dev; prod uses `.env.prod` + `docker-compose.prod.yml` after fixing that path.
- **Per-app, without Docker (run from that app dir):**
  - Frontends: `npm install` → `npm run dev` (Vite). `npm run lint` (ESLint), `npm run build` (`tsc -b && vite build`). No test framework.
  - Laravel backends: `composer dev` (runs `artisan serve` + queue + pail + `npm run dev` together; Postgres must be reachable per `.env`). `composer test` / `php artisan test`.
  - sakti: `composer dev`; verification gate `composer ci:check` (= `npm run lint:check` + `format:check` + `types:check` + tests); `composer lint` runs Pint.
- Frontends call backends directly (no Vite proxy). Targets come from each frontend's `.env` (`VITE_API_URL`, `VITE_SAKTI_URL`, `VITE_ROSTERING_FRONTEND_URL`). `frontend_atoms-maintenance/.env` points API at `http://localhost:5657/api` (Docker port); a bare-metal backend serves `:8000`.

## Cross-app conventions

- **Rostering owns auth/users.** maintenance + sakti authenticate via rostering SSO, or bypass in dev with `DEV_MOCK_AUTH=true` (backend) + `VITE_DEV_MOCK_AUTH=true` (frontend, seeded mock users). Don't duplicate login/account logic elsewhere.
- **Design system (shared, light-mode only):** AirNav navy + single amber accent, fonts `Plus Jakarta Sans` / `IBM Plex Mono` (self-hosted in `/fonts/`). maintenance frontend uses `brand-*` tokens, rostering uses `navy-*`/`accent-*` (each in its `tailwind.config.js`). Follow existing tokens; never introduce dark mode or a new palette.
- **Backends are separate apps:** frontend/backend pairs are sibling dirs (e.g. `frontend_atoms-maintenance` vs `backend_atoms-maintenance`). JSON responses use `{success, message, data, errors?}`; endpoints validate via Form Request.
- **Secrets:** `.gitignore` excludes `.env*` (root `.env`, `.env.local`, etc.). Only commit `.env.example` / `.env.local.example` / `.env.prod.example`.
- **Tests:** backend PHPUnit; sakti Pest (`php artisan test`). Seeders reset/duplicate data on a non-empty DB — reseed only on fresh DBs.

## Deploy

- `DEPLOYMENT.md` — prod flow (`.env.prod`, migrate-on-start, seed once, volume backups).
- `deploy/Caddyfile` — Caddy reverse proxy for the two domains.

# Docker Production Infrastructure — ATOMS Monorepo

> Dokumen perencanaan pembangunan infrastruktur Docker production lengkap untuk repositori ATOMS.
> Pembaca: developer & AI agent lain yang akan mengimplementasi/meninjau. Status: **disetujui, siap eksekusi**.

## 1. Latar Belakang & Masalah

- `docker-compose.prod.yml` saat ini **usang**: masih mengacu struktur `./atoms/frontend_atoms` & `./atoms/backend_atoms` yang sudah tidak ada — Rostering sudah dipisah jadi app sendiri (`atoms-rostering/`) dan Maintenance menjadi `atoms-maintenance/`.
- **Tidak ada satupun** `Dockerfile.prod` untuk frontend & backend Maintenance dan Rostering.
- yang berfungsi: `sakti/Dockerfile` (multi-stage, Inertia — frontend+backend satu image). Dipakai sebagai **referensi pola** untuk bagian *backend/PHP* saja.

## 2. Struktur Repo Aktual

| App | Frontend | Backend |
|-----|----------|---------|
| Maintenance | `atoms-maintenance/frontend_atoms-maintenance/` (React 19 + Vite 8 + TS) | `atoms-maintenance/backend_atoms-maintenance/` (Laravel 13, PHP ^8.3, API-only) |
| Rostering | `atoms-rostering/frontend_atoms/` (React 19 + Vite 7 + TS) | `atoms-rostering/backend_atoms/` (Laravel 12, PHP ^8.2, API-only) |
| Sakti | `resources/js` (Inertia v2) | (dalam satu image, tidak disentuh) |

## 3. Keputusan Kunci (hasil riset)

### Skema Penamaan — Rostering = Halaman Utama

Variabel domain/URL diubah agar Rostering menjadi halaman utama (entry "ATOMS"):

| Variabel lama | Variabel baru | Isi/makna |
|---|---|---|
| `ATOMS_DOMAIN` | `MAIN_DOMAIN` | entry utama, mengarah ke **Rostering** |
| `ATOMS_PUBLIC_URL/API_URL/CORS` | `MAIN_PUBLIC_URL`, `MAIN_PUBLIC_API_URL`, `MAIN_CORS_ALLOWED_ORIGINS` | URL publik Rostering |
| — | `MAINTENANCE_DOMAIN`, `MAINTENANCE_PUBLIC_URL`, `MAINTENANCE_PUBLIC_API_URL`, `MAINTENANCE_CORS_ALLOWED_ORIGINS` | domain Maintenance |
| `ATOMS_APP_KEY` | `MAINTENANCE_APP_KEY` | kunci aplikasi Maintenance |
| `ATOMS_DB_*` | `MAINTENANCE_DB_*` | database Maintenance |
| `ROSTERING_APP_KEY`, `ROSTERING_DB_*` | tetap | infra app Rostering |
| `SAKTI_*` | tetap | — |

**Alias backward-compat:** Semua `ATOMS_*` lama tetap didukung via fallback di compose:
```yaml
MAINTENANCE_DOMAIN: ${MAINTENANCE_DOMAIN:-${ATOMS_DOMAIN:-atoms-maintenance.example.com}}
```
Ini membuat `.env.prod` lama yang pakai `ATOMS_*` tetap jalan. `ROSTERING_*` yang baru tidak perlu alias (belum pernah ada di compose lama).

**Arsitektural:** Rostering = SSO & source-of-truth user → user masuk lewat utama (login di Rostering), lalu lompat ke Maintenance/Sakti via SSO token. Caddy unifies port 80/443 untuk VPN.

### Pola referensi — `sakti/Dockerfile` + `sakti/docker/`
- Base `php:8.4-fpm-alpine`; instal nginx + supervisor.
- Entrypoint: tunggu DB → `migrate --force` → `storage:link` → `config:route:view:event cache` → chown storage → `exec supervisord`.
- Supervisor: `nginx` + `php-fpm` + `queue:work`. **Adaptasi API-only**: tidak ada stage build frontend; tetap servis `public/`.

### Extension PHP (KEDUA backend identik — **tanpa redis**)
```
pdo pdo_pgsql pgsql gd mbstring xml zip intl bcmath exif pcntl opcache
```
- gd dikonfigurasi `--with-freetype --with-jpeg --with-webp`.
- **Tanpa redis**: `predis/predis` di `composer.json` = client Redis murni PHP (tidak butuh ekstensi C); `QUEUE_CONNECTION/CACHE_STORE/SESSION_DRIVER` semuanya `database`; tidak ada service Redis di compose prod.
- Rostering tidak punya Dockerfile dev → daftar extension disalin dari perintah inline `docker-compose.local.yml` (set yang sama dgn Maintenance), ditambah `xml`/`pcntl`/`opcache`.
- Composer pakai `composer install --no-dev --optimize-autoloader` + `--no-interaction --no-scripts` (kedua app punya `composer.lock`).

### Scheduler (penting — jangan lupa)
- Maintenance: `routes/console.php` menjalankan perintah tiap menit.
- Rostering: `bootstrap/app.php` → `withSchedule` → `notifications:process-scheduled` tiap 5 menit.
- ⇒ Supervisor kedua backend perlu program **`schedule:work`**, bukan cuma `queue:work`.

### Variabel VITE yang dibaca kode (untuk ARG build frontend)
- **Maintenance** (`src/config/index.ts`, `ProtectedRoute.tsx`, `AuthContext.tsx`, dsb):
  `VITE_API_URL`, `VITE_API_URL_PROD`, `VITE_ROSTERING_FRONTEND_URL`, `VITE_ROSTERING_URL_PROD`, `VITE_SAKTI_URL`, `VITE_DEV_MOCK_AUTH`.
- **Rostering** (`src/lib/api.ts`, `utils/redirectMaintenance.ts`, `utils/redirectSakti.ts`, `leaveRequestService.ts`):
  `VITE_API_URL`, `VITE_API_URL_PROD`, `VITE_MAINTENANCE_URL`, `VITE_MAINTENANCE_URL_PROD`, `VITE_SAKTI_URL`, `VITE_SAKTI_URL_PROD`, `VITE_BACKEND_URL`.
- Kedua frontend memilih var `*_PROD` saat URL **bukan** `localhost/127.0.0.1` ⇒ pada domain production, ARG `*_PROD` **wajib** di-inject (compose lama tidak melakukan ini — diperbaiki).
- **Asumsi:** kode Maintenance membaca `VITE_ROSTERING_URL_PROD`, namun `.env`-nya mendefinisikan `VITE_ROSTERING_FRONTEND_URL_PROD` → yang dipass adalah `VITE_ROSTERING_URL_PROD` (sesuai yang dibaca kode).

### Integrasi SSO Maintenance ↔ Rostering (celah di compose lama, diperbaiki)
Maintenance backend butuh env berikut agar prod SSO berfungsi (`DEV_MOCK_AUTH=false`):
`ROSTERING_API_URL=http://rostering-backend:80`, `ROSTERING_FRONTEND_URL=${MAIN_PUBLIC_URL}`, `ROSTERING_DB_HOST=rostering-db`, `ROSTERING_DB_PORT=5432`, `ROSTERING_DB_DATABASE/USERNAME/PASSWORD`.

### Non-root
- php-fpm workers = `www-data`, nginx = `nginx` (keduanya non-root), supervisord = `root` — identik dengan sakti.

## 4. Rencana Task — File yang Dibuat/Diubah

### Task 1 — Backend `Dockerfile.prod` (+ `docker/`, `.dockerignore`) — ×2 app
| File | Keterangan |
|------|-----------|
| `atoms-maintenance/backend_atoms-maintenance/Dockerfile.prod` | multi-stage; composer stage `php:8.4-cli-alpine`; runtime `php:8.4-fpm-alpine` + nginx + supervisor. `EXPOSE 80` |
| `atoms-maintenance/backend_atoms-maintenance/.dockerignore` | copy pola `sakti/.dockerignore` (vendor, node_modules, .env*, tests, dsb) |
| `atoms-maintenance/backend_atoms-maintenance/docker/nginx.conf` | **API-only**: root `/var/www/html/public`, `try_files $uri $uri/ /index.php?$query_string`, fastcgi `127.0.0.1:9000`, deny dotfiles, cache static |
| `atoms-maintenance/backend_atoms-maintenance/docker/php.ini` | copy `sakti/docker/php.ini` (opcache, upload/exec limits) |
| `atoms-maintenance/backend_atoms-maintenance/docker/supervisord.conf` | `nginx`, `php-fpm`, `queue:work` ×2, `schedule:work` |
| `atoms-maintenance/backend_atoms-maintenance/docker/entrypoint.sh` | migrate → storage:link → config/route/view/event cache → chown → exec supervisord |
| `atoms-rostering/backend_atoms/Dockerfile.prod` | sama seperti di atas (extension **tanpa redis**, daftar sama persis dengan Maintenance) |
| `atoms-rostering/backend_atoms/.dockerignore` | — |
| `atoms-rostering/backend_atoms/docker/nginx.conf` | API-only; secara alami juga menyervis `api-docs.html` + `swagger.json` |
| `atoms-rostering/backend_atoms/docker/php.ini` | — |
| `atoms-rostering/backend_atoms/docker/supervisord.conf` | `queue:work`, `schedule:work` (scheduler notification) |
| `atoms-rostering/backend_atoms/docker/entrypoint.sh` | — |

### Task 2 — Frontend `Dockerfile.prod` (+ `docker/nginx.conf`, `.dockerignore`) — ×2 app
| File | Keterangan |
|------|-----------|
| `atoms-maintenance/frontend_atoms-maintenance/Dockerfile.prod` | stage1 `node:22-alpine` `npm ci && npm run build`; ARG+ENV var Maintenance; stage2 `nginx:alpine` serve `dist/`, SPA fallback `try_files $uri $uri/ /index.html;`, `EXPOSE 80` |
| `atoms-maintenance/frontend_atoms-maintenance/docker/nginx.conf` | SPA static + cache khusus asset + security headers |
| `atoms-maintenance/frontend_atoms-maintenance/.dockerignore` | node_modules, dist, .env*, dsb |
| `atoms-rostering/frontend_atoms/Dockerfile.prod` | sama, ARG+ENV var Rostering |
| `atoms-rostering/frontend_atoms/docker/nginx.conf` | — |
| `atoms-rostering/frontend_atoms/.dockerignore` | — |

### Task 3 — `docker-compose.prod.yml`
- Perbaiki context `atoms-frontend` → `./atoms-maintenance/frontend_atoms-maintenance`; `atoms-backend` → `./atoms-maintenance/backend_atoms-maintenance`.
- Rename env: `ATOMS_*` → `MAINTENANCE_*` dengan alias fallback ke `ATOMS_*`.
- `MAIN_*` = Rostering (halaman utama). `MAINTENANCE_*` = Maintenance. `SAKTI_*` tetap.
- **Service baru** `rostering-frontend`, `rostering-backend`, `rostering-db` — clone pola `atoms-frontend/backend/db` (env production `APP_ENV=production`, `APP_DEBUG=false`, `DB_*` dari env, volume storage & logs, healthcheck `pg_isready`, network `teknik_prod`).
- Tambah `rostering-backend` & `rostering-frontend` ke `proxy.depends_on`.
- Tambah volume: `rostering_db_data`, `rostering_storage_data`, `rostering_logs_data`.
- `BATASAN: docker-compose.local.yml TIDAK disentuh.`

### Task 4 — `deploy/Caddyfile`
- Blok `{$MAIN_DOMAIN}` → `/api/*` ke `rostering-backend:80`, sisanya ke `rostering-frontend:80` *(Rostering halaman utama)*.
- Blok `{$MAINTENANCE_DOMAIN}` → `/api/*` ke `atoms-backend:80`, sisanya ke `atoms-frontend:80` *(Maintenance)*.
- Blok `{$SAKTI_DOMAIN}` → `sakti:80` *(Sakti, tidak diubah)*.
- Tambah `MAIN_DOMAIN` dan `MAINTENANCE_DOMAIN` ke `environment:` service `proxy` di compose prod.

### Task 5 — `.env.prod.example`
- Variabel kanonik: `MAIN_*` (Rostering) + `MAINTENANCE_*` (Maintenance) + `SAKTI_*` (Sakti).
- Baris alias `ATOMS_*` dikomentari dengan catatan kompatibilitas.
- Placeholder: `base64:CHANGE_ME` / `CHANGE_ME_STRONG_PASSWORD` / `*.example.com`.

## 5. Validasi
```
docker compose -f docker-compose.prod.yml config
```
- hanya validasi syntax (`config`), **bukan** `up`.
- Laporkan hasil ke user.

## 6. Batasan / Larangan
- ❌ Ubah `docker-compose.local.yml`.
- ❌ Commit `.env` berisi credential asli — hanya `.env.prod.example` yang boleh di-update.
- ✅ Tulis asumsi sebagai komentar di file terkait (bukan diam-diam menebak).

## 7. Risiko yang Perlu Diketahui
- **Named volume** `atoms_db_data`/`rostering_db_data`/`sakti_db_data` **dipakai bersama** oleh compose lokal dan prod. Kalau `prod up` dijalankan, container DB akan mount volume yang sama → data bisa kolide. Ini perilaku lama (sudah ada sebelum plan ini).
- **Port 80/443** harus kosong di host (kalau ada web server lain, terjadi konflik).
- **DNS/Caddy TLS**: untuk domain intranet-only (`.local`/custom suffix), Caddy ACME butuh public DNS — perlu `tls internal` atau self-signed kalau belum ada DNS valid. Ini di luar scope plan ini tapi perlu diperhatikan saat deploy.

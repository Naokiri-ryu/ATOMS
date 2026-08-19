# DEVELOPMENT_SETUP_NATIVE — Menjalankan 3 Web App tanpa Docker (Laragon, Windows)

> Tujuan: environment **development** yang ringan & cepat di Windows, tanpa Docker virtualisasi.
> Produksi/server **tetap memakai Docker** (`docker-compose.prod.yml` + Caddy). File yang diedit di sini hampir semuanya `.env` (tidak di-commit) sehingga tidak mengganggu konfig produksi.

## 1. Ringkasan

Monorepo `teknik2026` berisi 3 app independen. Semua bisa jalan native; skrip `composer dev` sudah disediakan tiap backend.

| App | Backend (port) | Frontend (port) | DB |
|---|---|---|---|
| atoms-maintenance | `http://localhost:8000` | `http://localhost:5173` | `atoms` |
| atoms-rostering | `http://localhost:8001` | `http://localhost:5174` | `rostering` |
| sakti | `http://localhost:8002` | (Inertia, dilayani backend — Vite HMR `5175`) | `airnav_db` |

**Kenapa PostgreSQL wajib (bukan SQLite):**
- maintenance membaca DB rostering langsung antar-DB (`ROSTERING_DB_*`).
- sakti memakai fungsi Postgres-only `json_extract_path_text()` (`CheckLowStock.php:40`).

## 2. Prasyarat

Diperlukan: **Laragon Full** (gratis, Windows). Versi paket yang relevan sudah dibundel oleh Laragon: PHP 8.1–8.5, Composer, npm/Node, PostgreSQL 15–18, git, Nginx/Apache.
Durasi setup total ≈ 30–60 menit termasuk `composer install` + `npm install` untuk 3 app.

## 3. Langkah 1 — Install & verifikasi Laragon

1. Download Laragon Full dari laragon.org → jalankan installer (admin). Disarankan install di `C:\laragon`.
2. Menu **Tools → Path → Add Laragon to Path**.
3. Menu **PHP → Version** → pilih **8.3** atau **8.4** (memenuhi semua: maintenance butuh ^8.3, rostering & sakti ^8.2).
4. Verifikasi di terminal baru:
```powershell
php -v      # 8.3/8.4
composer -V
node -v     # v20.19+/v22.12+ (sudah ada v24 — ok)
psql --version
```

## 4. Langkah 2 — Aktifkan ekstensi PHP

Buka `C:\laragon\bin\php\php-<versi>\php.ini`, sehingga ekstensi berikut **tidak** dikomentari (`;extension=` dihapus):

```
extension=pdo_pgsql
extension=pgsql
extension=mbstring
extension=intl
extension=bcmath
extension=gd
extension=exif
extension=zip
extension=fileinfo
```

Verifikasi: `php -m | Out-String` harus memuat `pdo_pgsql`.

## 5. Langkah 3 — PostgreSQL lokal + buat database

1. Menu **PostgreSQL → Start** (Laragon). Default user superuser = `postgres`; pastikan password diketahui / set ulang:
```powershell
psql -U postgres -h 127.0.0.1 -c "ALTER USER postgres WITH PASSWORD 'pilih_password_kuat';"
```
(Bila koneksi ditolak: cek `pg_hba.conf` di `C:\laragon\bin\postgresql\pgsql-*\data\`.)
2. Buat 3 database:
```powershell
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE atoms;"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE rostering;"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE airnav_db;"
```

## 6. Langkah 4 — Konfig `backend/.env` (file tidak di-commit)

### `atoms-maintenance/backend_atoms-maintenance/.env`
```ini
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=atoms
DB_USERNAME=postgres
DB_PASSWORD=pilih_password_kuat

ROSTERING_DB_HOST=127.0.0.1
ROSTERING_DB_PORT=5432
ROSTERING_DB_DATABASE=rostering
ROSTERING_DB_USERNAME=postgres
ROSTERING_DB_PASSWORD=pilih_password_kuat

ROSTERING_API_URL=http://localhost:8001        # sudah benar, biarkan
ROSTERING_FRONTEND_URL=http://localhost:5174/home

SANCTUM_STATEFUL_DOMAINS=localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
```
> Nilai lama memakai nama service Docker (`atoms-db`, `rostering-db`) — wajib diganti `127.0.0.1`.

### `atoms-rostering/backend_atoms/.env`
```ini
APP_NAME=ATOMS-Rostering
APP_URL=http://localhost:8001

DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=rostering
DB_USERNAME=postgres
DB_PASSWORD=pilih_password_kuat
```
> CORS rostering sudah hardcode mengizinkan `localhost:5173/5174` di `app/Http/Middleware/CorsMiddleware.php:19-35` — tidak perlu ubah **kecuali** memakai port frontend lain.

### `sakti/.env`
```ini
APP_URL=http://localhost:8002

DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=airnav_db
DB_USERNAME=postgres
DB_PASSWORD=pilih_password_kuat

ROSTERING_FRONTEND_URL=http://localhost:5174
```

## 7. Langkah 5 — Konfig `frontend/.env`

### `atoms-maintenance/frontend_atoms-maintenance/.env`
```ini
VITE_API_URL="http://localhost:8000/api"
VITE_ROSTERING_FRONTEND_URL="http://localhost:5174"
VITE_SAKTI_URL="http://localhost:8002"
# VITE_API_URL_PROD / VITE_SAKTI_URL_PROD / VITE_ROSTERING_FRONTEND_URL_PROD — jangan diubah
```
> `src/config/index.ts:13` memilih `VITE_API_URL` saat diakses dari localhost; service lain fallback ke `localhost:8000/api` bila kosong.

### `atoms-rostering/frontend_atoms/.env`
```ini
VITE_API_URL=http://localhost:8001/api
VITE_MAINTENANCE_URL=http://localhost:5173
VITE_SAKTI_URL=http://localhost:8002
# VITE_*_PROD/_LOCAL lainnya — jangan diubah
```
> Redirect pakai `VITE_MAINTENANCE_URL`/`VITE_SAKTI_URL` ketika diakses dari localhost (lihat `src/utils/redirectMaintenance.ts:13`, `redirectSakti.ts:14`).

## 8. Langkah 6 — Install dependency & migrate

Per app (dari folder masing-masing):
```powershell
composer install
npm install
php artisan migrate --force
```
- maintenance & rostering: migrate harus sukses pada DB baru.
- **sakti: `migrate` masih BLOKIR** oleh migration korup `database/migrations/2026_07_29_105823*.php` — wajib dipatch dulu (lihat §11). Sampai selesai, kerjakan maintenance & rostering.

## 9. Langkah 7 — Jalankan (bukan `composer dev`!)

> ⚠️ `composer dev` di Windows **gagal**: skripnya menjalankan `php artisan pail` yang butuh ekstensi `pcntl` (tidak tersedia di Windows). Maka jalankan proses secara manual / pakai skrip bantu (§10).

Per app (3 terminal per app, atau gunakan skrip bantu):

**atoms-maintenance** — backend (`backend_atoms-maintenance/`):
```powershell
php artisan serve --port=8000
php artisan queue:listen --tries=1
```
— frontend (`frontend_atoms-maintenance/`):
```powershell
npm run dev -- --port 5173
```

**atoms-rostering** — backend (`backend_atoms/`):
```powershell
php artisan serve --port=8001
php artisan queue:listen --tries=1
```
— frontend (`frontend_atoms/`):
```powershell
npm run dev -- --port 5174
```

**sakti** (setelah migrate dibetulkan) — backend (`sakti/`):
```powershell
php artisan serve --port=8002
php artisan queue:listen --tries=1
```
— frontend HMR (`sakti/`):
```powershell
npm run dev -- --port 5175
```
> Lihat log Laravel dengan `Get-Content storage/logs/laravel.log -Wait -Tail 50` (pengganti pail).

## 10. Lampiran: skrip bantu (opsional)

Buat `start-native.ps1` di root repo untuk membuka semua proses di jendela terpisah:

```powershell
function Dev($Name, $Dir, $Cmd) {
  Start-Process powershell -WorkingDirectory $Dir -ArgumentList "-NoExit -Command $Cmd"
}
Dev "maintenance-BE"   "$PSScriptRoot\atoms-maintenance\backend_atoms-maintenance"       "php artisan serve --port=8000"
Dev "maintenance-Q"    "$PSScriptRoot\atoms-maintenance\backend_atoms-maintenance"       "php artisan queue:listen --tries=1"
Dev "maintenance-FE"   "$PSScriptRoot\atoms-maintenance\frontend_atoms-maintenance"      "npm run dev -- --port 5173"
Dev "rostering-BE"     "$PSScriptRoot\atoms-rostering\backend_atoms"                     "php artisan serve --port=8001"
Dev "rostering-Q"      "$PSScriptRoot\atoms-rostering\backend_atoms"                     "php artisan queue:listen --tries=1"
Dev "rostering-FE"     "$PSScriptRoot\atoms-rostering\frontend_atoms"                    "npm run dev -- --port 5174"
Dev "sakti-BE"         "$PSScriptRoot\sakti"                                             "php artisan serve --port=8002"
Dev "sakti-Q"          "$PSScriptRoot\sakti"                                             "php artisan queue:listen --tries=1"
Dev "sakti-FE"         "$PSScriptRoot\sakti"                                             "npm run dev -- --port 5175"
```
(Jalankan sakti setelah migration-nya dibetulkan.)

## 11. Verifikasi

1. **Rostering**: buka `http://localhost:5174` → login → buat/lihat roster.
2. **SSO handoff**: dari rostering klik "masuk ke maintenance" → browser pindah ke `http://localhost:5173?token=...&tokenfix=...` → maintenance `AuthController::verify` memvalidasi ke rostering backend (`ROSTERING_API_URL` :8001) → masuk dashboard.
3. **Cross-DB maintenance**: isi form CNSD/TFP yang butuh data shift → data terbaca dari DB `rostering` via `ROSTERING_DB_*`.
4. **Sakti**: `http://localhost:8002` → `/sso?token=...` dari rostering → login via SSO.

## 12. Troubleshooting

| Gejala | Solusi |
|---|---|
| Error `ext-pcntl` saat `composer install`/`dev` | Normal di Windows; install tetap jalan (pcntl hanya dipakai Pail). Jangan jalankan `php artisan pail`; pakai §9. |
| `SQLSTATE[HY000] ... connection refused` | Postgres belum start / host masih nama service Docker → cek §5–7. |
| CORS `Forbidden 403` (rostering) | Origin frontend belum ada di `CorsMiddleware.php:19-35`. |
| Port 5173 bentrok | Pakai `--port` berbeda, lalu samakan di `.env` yang terkait. |
| `migrate` gagal (sakti) | Patch migration korup `2026_07_29_105823` (proyek terpisah, lihat analisis sebelumnya). |
| npm lambat / antivirus | Tambahkan pengecualian Windows Defender untuk folder `node_modules`. |
| `php artisan serve` port dipakai | Cek proses lain / gunakan port lain, sinkronkan ke `.env`. |

## 13. Yang TIDAK disentuh (demi produksi)

- `docker-compose.local.yml` / `docker-compose.prod.yml` / `deploy/Caddyfile` / `DEPLOYMENT.md` — konfig server.
- Semua file ter-commit (`*.php`, `*.tsx`, `composer.json`, dsb) kecuali bila memang perlu perubahan kode (mis. `CorsMiddleware.php` bila ganti port FE).
- Nilai `.env` produksi (`ATOMS_APP_KEY`, dll) — `.env` lokal kita tidak di-commit.
- **Dev mode: `DEV_MOCK_AUTH=true`** (jika pernah aktif) — nonaktifkan agar SSO beneran diuji end-to-end.
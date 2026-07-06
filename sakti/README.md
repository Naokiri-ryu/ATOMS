# SAKTI — Sistem Aplikasi Kesiapan Teknisi & Inventaris

Aplikasi manajemen inventaris berbasis web untuk pengelolaan peralatan, komponen, dan asset dengan sistem peminjaman yang dilengkapi QR Code scanner. Dibangun menggunakan **Laravel 12**, **React 19**, **Inertia.js**, dan **TailwindCSS 4**.

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Fitur Utama](#-fitur-utama)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Akun Default](#-akun-default)
- [Panduan Development](#-panduan-development)
- [🐳 Docker & Hosting](#-docker--hosting)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | PHP 8.2+, Laravel 12, Fortify (Auth) |
| **Frontend** | React 19, TypeScript, Inertia.js v2 |
| **Styling** | TailwindCSS 4, Radix UI, Lucide Icons |
| **Build Tool** | Vite 7 |
| **Database** | PostgreSQL |
| **QR Code** | chillerlan/php-qrcode (Generate), jsQR (Scan) |
| **Export** | PhpSpreadsheet (Excel), DomPDF (PDF) |

---

## ✨ Fitur Utama

### Role: Admin
- **Dashboard** — Statistik inventaris, peminjaman aktif, peringatan overdue
- **Manajemen Barang** — CRUD barang (peralatan, komponen, asset) dengan QR Code otomatis
- **Kategori** — Kelola kategori barang
- **Peminjaman** — Lihat & kelola semua log peminjaman/penggunaan
- **Berita Acara** — Upload, lihat, download, dan hapus berita acara
- **Audit Stok** — Log keluar/masuk barang dengan filter tanggal
- **Export** — Export data ke Excel/PDF (pisah per jenis: Asset vs Peralatan & Komponen)

### Role: Teknisi
- **Dashboard** — Barang tersedia, peminjaman aktif, peringatan overdue
- **Notifikasi** — Pemberitahuan untuk barang yang telat dikembalikan
- **Pinjam Alat** — Scan QR Code real-time, foto bukti, catat peminjaman
- **Pengembalian** — Kembalikan barang yang dipinjam dengan foto bukti
- **Berita Acara** — Upload, lihat, download berita acara
- **Riwayat** — Lihat riwayat peminjaman sendiri

### Jenis Barang
| Jenis | Perilaku |
|-------|----------|
| **Peralatan** | Dipinjam → harus dikembalikan (max 6 jam) |
| **Komponen** | Diambil → stok berkurang permanen (habis pakai) |
| **Asset** | Barang tetap dengan serial number |

---

## 📦 Persyaratan Sistem

- **PHP** ≥ 8.2 (dengan ext: `pdo_pgsql`, `mbstring`, `gd`, `xml`, `zip`)
- **PostgreSQL** ≥ 14.x
- **Composer** ≥ 2.x
- **Node.js** ≥ 18.x
- **NPM** ≥ 9.x

> 💡 **Disarankan**: Gunakan [Laravel Herd](https://herd.laravel.com/) untuk setup PHP + Composer secara otomatis di Windows/macOS.

---

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone https://github.com/<username>/mgnk.git
cd mgnk
```

### 2. Install Dependencies

```bash
composer install
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env` sesuai kebutuhan:

```env
APP_NAME=SAKTI
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sakti
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

> ⚠️ Pastikan database `sakti` sudah dibuat di PostgreSQL sebelum menjalankan migration.

### 4. Setup Database

```bash
php artisan migrate
php artisan db:seed   # (opsional) isi data sample
```

### 5. Setup Storage Link

```bash
php artisan storage:link
```

---

## ▶ Menjalankan Aplikasi

```bash
# Development — jalankan semua sekaligus (Laravel + Vite + Queue)
composer dev

# Atau manual di 2 terminal terpisah:
php artisan serve   # Terminal 1
npm run dev         # Terminal 2
```

Akses aplikasi di: **http://localhost:8000**

---

## 🔐 Akun Default

Setelah menjalankan `php artisan db:seed`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@sakti.local` | `password` |
| **Teknisi** | `teknisi@sakti.local` | `password` |

---

## 👨‍💻 Panduan Development

### Perintah Penting

```bash
# Linting & formatting
npm run lint          # ESLint fix
npm run format        # Prettier fix
npm run types:check   # TypeScript type check
composer lint         # PHP Pint (code style)

# Testing
php artisan test
composer ci:check     # Full CI pipeline

# Database
php artisan migrate:fresh --seed   # Reset & seed ulang
```

### Menambah Halaman Baru

1. Buat **Controller** di `app/Http/Controllers/`
2. Tambahkan **Route** di `routes/web.php`
3. Buat **React Page** di `resources/js/pages/<role>/<nama>/`
4. Tambahkan **Type** di `resources/js/types/models.ts` jika ada model baru
5. Update **Sidebar** di `resources/js/components/app-sidebar.tsx`

### File Upload

File disimpan di `storage/app/public/` dengan sub-folder:

| Folder | Konten |
|--------|--------|
| `items/` | Foto barang |
| `qrcodes/` | QR Code SVG |
| `borrowings/borrow/` | Foto bukti pinjam |
| `borrowings/return/` | Foto bukti kembali |
| `berita-acara/` | Dokumen berita acara (PDF/Word, max 2MB) |

---

## 🐳 Docker & Hosting

### Struktur File Docker

```
mgnk/
├── Dockerfile               # Multi-stage build (Node → PHP-FPM)
├── docker-compose.yml       # Orkestrasi: app + postgres + redis
├── .dockerignore
├── .env.docker.example      # Template env untuk deployment
└── docker/
    ├── nginx.conf           # Web server config
    ├── supervisord.conf     # Process manager (nginx + php-fpm + queue)
    ├── php.ini              # OPcache + upload limits
    └── entrypoint.sh        # Bootstrap: migrate, cache, storage:link
```

### Arsitektur Container

| Container | Image | Fungsi |
|-----------|-------|--------|
| `sakti_app` | Custom (PHP 8.2 + Nginx) | Laravel app, Nginx, Queue worker |
| `sakti_postgres` | postgres:16-alpine | Database utama |
| `sakti_redis` | redis:7-alpine | Cache, Session, Queue driver |

### Deploy ke Server

**1. Siapkan file environment:**
```bash
cp .env.docker.example .env.docker
# Edit .env.docker — isi APP_KEY, DB_PASSWORD, APP_URL
nano .env.docker
```

**2. Generate APP_KEY** (jika belum ada):
```bash
# Jalankan sekali untuk mendapatkan key
docker run --rm php:8.2-alpine php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

**3. Build dan jalankan:**
```bash
docker compose --env-file .env.docker up -d --build
```

Entrypoint otomatis menjalankan migration, `storage:link`, dan cache warming saat container pertama kali start.

**4. Seed data awal** (opsional, hanya pertama kali):
```bash
docker compose exec app php artisan db:seed
```

### Perintah Berguna

```bash
# Lihat log real-time
docker compose logs -f app

# Masuk ke container
docker compose exec app sh

# Jalankan artisan command
docker compose exec app php artisan migrate:status

# Restart hanya satu service
docker compose restart app

# Stop semua
docker compose down

# Stop + hapus volume (HATI-HATI: data DB hilang)
docker compose down -v
```

### Update Aplikasi

```bash
git pull
docker compose --env-file .env.docker up -d --build
```

> ⚠️ **Penting untuk production:**
> - Selalu set `APP_DEBUG=false` dan `APP_ENV=production` di `.env.docker`
> - Gunakan password DB yang kuat
> - Pertimbangkan pasang reverse proxy (Nginx/Caddy/Traefik) dengan SSL di depan container
> - Hapus baris `DB_PORT_EXPOSE` di `.env.docker` jika PostgreSQL tidak perlu diakses dari luar container

---

## ❗ Troubleshooting

### `Vite manifest not found`
```bash
npm run build
# atau jalankan npm run dev di terminal terpisah
```

### `SQLSTATE: no such table`
```bash
php artisan migrate
```

### `symlink(): No such file or directory`
```bash
php artisan storage:link
```

### Port 8000 sudah dipakai
```bash
php artisan serve --port=8080
```

### Webcam / QR Scanner tidak muncul
- Pastikan browser mengizinkan akses kamera.
- Gunakan **HTTPS** atau `localhost` (bukan IP address langsung).

---

## 📱 Akses Mobile (WiFi)

1. Jalankan server dengan bind ke semua interface:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```
2. Cek IP laptop: buka CMD → `ipconfig` → cari IPv4 (misal: `192.168.1.15`)
3. Buka di HP: `http://192.168.1.15:8000`

**Mengaktifkan kamera di HP (Non-HTTPS):**
Di Chrome HP, buka `chrome://flags` → cari `unsafely-treat-insecure-origin-as-secure` → masukkan URL laptop → **Enable** → Relaunch.

---

## 📄 Lisensi

MIT License

---

> **SAKTI** — Sistem Aplikasi Kesiapan Teknisi & Inventaris  
> Dibangun dengan Laravel + React + Inertia.js  
> Special thanks to: Daniel, Fachri, Ripan — OJT Teknik
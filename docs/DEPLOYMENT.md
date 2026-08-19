# Production Deployment

Konfigurasi produksi memakai `docker-compose.prod.yml`. Port yang dibuka ke jaringan hanya `80` dan `443`; database, ATOMS backend, dan service internal lain tetap berada di network Docker.

## 1. Siapkan env

```bash
cp .env.prod.example .env.prod
```

Edit `.env.prod`, lalu isi:

- `ATOMS_DOMAIN` dan `SAKTI_DOMAIN` sesuai domain kantor.
- `ATOMS_PUBLIC_URL`, `ATOMS_PUBLIC_API_URL`, dan `SAKTI_PUBLIC_URL` sesuai domain tersebut.
- `ATOMS_APP_KEY` dan `SAKTI_APP_KEY` dari aplikasi yang sudah ada atau generate dengan Laravel.
- Password database yang kuat.

Contoh domain:

```env
ATOMS_DOMAIN=atoms.airnav-kantor.local
SAKTI_DOMAIN=sakti.airnav-kantor.local
ATOMS_PUBLIC_URL=https://atoms.airnav-kantor.local
ATOMS_PUBLIC_API_URL=https://atoms.airnav-kantor.local/api
SAKTI_PUBLIC_URL=https://sakti.airnav-kantor.local
```

## 2. Jalankan

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## 3. Migrasi dan seed awal

Migration dijalankan otomatis saat container Laravel start. Seeder hanya dijalankan sekali untuk database baru.

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec atoms-backend php artisan db:seed
docker compose --env-file .env.prod -f docker-compose.prod.yml exec sakti php artisan db:seed
```

Jangan rerun seeder pada database yang sudah berisi data kecuali memang ingin reset/menambah data dummy.

## 4. Operasional

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f proxy
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f atoms-backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f sakti
```

Backup volume database secara rutin:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec atoms-db pg_dump -U atoms atoms > atoms-backup.sql
docker compose --env-file .env.prod -f docker-compose.prod.yml exec sakti-db pg_dump -U sakti sakti > sakti-backup.sql
```

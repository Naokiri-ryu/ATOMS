#!/bin/sh
set -e

echo "==> Menunggu database siap..."
until php artisan migrate --force 2>/dev/null; do
    echo "    Database belum siap, coba lagi dalam 3 detik..."
    sleep 3
done

echo "==> Menjalankan migration..."
php artisan migrate --force

echo "==> Membuat storage link..."
php artisan storage:link --force 2>/dev/null || true

echo "==> Optimasi cache production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> Membuat log & storage directories..."
mkdir -p /var/log/supervisor
mkdir -p storage/logs
mkdir -p storage/framework/{cache,sessions,views}
chown -R www-data:www-data storage bootstrap/cache

echo "==> Aplikasi siap! Menjalankan services..."
exec "$@"

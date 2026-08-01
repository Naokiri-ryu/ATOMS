# =============================================================
# Stage 1: Build frontend assets
# =============================================================
FROM php:8.4-cli-alpine AS frontend

RUN apk add --no-cache \
        nodejs \
        npm \
        git \
        unzip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --ignore-platform-reqs

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY app/ app/
COPY bootstrap/ bootstrap/
COPY config/ config/
COPY database/ database/
COPY routes/ routes/
COPY artisan ./
COPY resources/ resources/
COPY vite.config.ts tsconfig.json ./
COPY public/ public/

ENV APP_ENV=production \
    APP_KEY=base64:5EHPpt5IdgfUMUI/BQ+9btirkl+5p73VRPw7gNJn4SQ= \
    DB_CONNECTION=sqlite \
    DB_DATABASE=/tmp/sakti_build.sqlite

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && touch /tmp/sakti_build.sqlite

RUN php artisan package:discover --ansi

RUN npm run build

# =============================================================
# Stage 2: Production PHP-FPM image
# =============================================================
FROM php:8.4-fpm-alpine AS app

# Install system dependencies + PHP extensions
RUN apk add --no-cache \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        libxml2-dev \
        oniguruma-dev \
        postgresql-dev \
        supervisor \
        nginx \
        curl \
        $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        gd \
        mbstring \
        xml \
        zip \
        bcmath \
        pcntl \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies (production only)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application source
COPY . .

# Copy built frontend assets from stage 1
COPY --from=frontend /app/public/build public/build

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Copy config files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

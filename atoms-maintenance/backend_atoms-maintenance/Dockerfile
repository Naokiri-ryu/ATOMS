FROM php:8.4-cli-alpine

RUN apk add --no-cache \
      git zip unzip postgresql-client libpq-dev \
      oniguruma-dev icu-dev libzip-dev \
      libpng-dev libjpeg-turbo-dev freetype-dev libwebp-dev \
      autoconf g++ make linux-headers \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_pgsql mbstring zip intl bcmath gd exif

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

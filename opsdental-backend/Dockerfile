FROM php:8.2-fpm-alpine

# Dependencias del sistema
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    curl-dev \
    libxml2-dev \
    oniguruma-dev \
    icu-dev \
    linux-headers

# Extensiones PHP (equivalente a nixpacks.toml)
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    xml \
    curl \
    zip \
    pcntl \
    opcache \
    intl

# Redis via PECL
RUN pecl install redis && docker-php-ext-enable redis

# OPcache para producción
RUN echo "opcache.enable=1\nopcache.memory_consumption=128\nopcache.max_accelerated_files=10000\nopcache.revalidate_freq=0" \
    > /usr/local/etc/php/conf.d/opcache.ini

# Composer 2
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencias PHP primero (caché de capa)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Código de la aplicación
COPY . .

# Permisos Laravel
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Script de inicio
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]

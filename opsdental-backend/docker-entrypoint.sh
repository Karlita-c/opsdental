#!/bin/sh
set -e

echo "Iniciando OpsDental Backend..."

# Cachear configuración y rutas
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force

echo "Backend listo."
exec "$@"

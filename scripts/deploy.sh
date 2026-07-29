#!/bin/bash
# ================================================================
# OpsDental — Script de despliegue en producción
# ================================================================
# Uso: bash scripts/deploy.sh
# Requisito: docker y docker compose instalados en el servidor
# ================================================================

set -e

echo "Desplegando OpsDental en producción..."

# 1. Actualizar código
git pull origin main

# 2. Construir imágenes
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 3. Levantar servicios
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Migraciones y caché
echo "Ejecutando migraciones..."
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache
docker compose exec backend php artisan view:cache

# 5. Verificar
echo "Estado de los contenedores:"
docker compose ps

echo "Despliegue completado."

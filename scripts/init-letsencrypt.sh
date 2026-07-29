#!/bin/bash
# ================================================================
# OpsDental — Primer certificado SSL con Let's Encrypt
# ================================================================
# Uso: bash scripts/init-letsencrypt.sh opsdental.com tu@email.com
# Requisito: dominio ya apuntando a este servidor (Cloudflare DNS)
# ================================================================

set -e

DOMAIN=${1:-opsdental.com}
EMAIL=${2:-soporte@opsdental.com}

echo "Obteniendo certificado SSL para $DOMAIN..."

# Crear carpetas necesarias
mkdir -p certbot/conf certbot/www

# Levantar solo nginx en modo HTTP primero (para el challenge)
docker compose up -d nginx

# Obtener certificado via webroot
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "api.$DOMAIN" \
    -d "n8n.$DOMAIN"

echo "Certificado obtenido. Reiniciando nginx con HTTPS..."

# Recargar nginx con config de producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx

echo "HTTPS activo en https://$DOMAIN"

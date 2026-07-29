# OpsDental — Backend

API REST construida con Laravel 12 + PHP 8.2 para la plataforma de agendamiento dental OpsDental.

## Requisitos

- PHP 8.2
- Composer 2.x
- PostgreSQL 16

## Instalación local

```bash
composer install
copy .env.example .env
# Editar .env con tus credenciales de BD y SMTP
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

API disponible en `http://localhost:8000`.

## Tests

```bash
php artisan test
```

## Despliegue (Railway)

```bash
railway up
```

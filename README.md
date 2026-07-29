# OpsDental

Plataforma web de agendamiento de citas para consultorios dentales.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + Bootstrap 5.3 |
| Backend | Laravel 12 + PHP 8.2 |
| Base de datos | PostgreSQL 16 |
| Caché | Redis 7 |
| Automatización | N8N + Meta WhatsApp Cloud API |

## Requisitos previos

- PHP 8.2 (XAMPP)
- Composer 2.x
- Node.js 22 + npm
- PostgreSQL 16 corriendo en puerto 5432
- Redis corriendo en puerto 6379

## Cómo levantar el backend

```bash
cd opsdental-backend

composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

El backend queda disponible en `http://localhost:8000`.

## Cómo levantar el frontend

```bash
cd opsdental-frontend

npm install
npm run dev
```

El frontend queda disponible en `http://localhost:3000`.

## Cuentas de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Gestor (admin) | gestor@opsdental.com | Gestor1234! |
| Paciente | demo_pac@opsdental.com | Demo1234! |
| Consultorio | demo_cons@opsdental.com | Demo1234! |

## Ejecutar tests

```bash
# Backend — PHPUnit
cd opsdental-backend
php artisan test

# Frontend — Cypress E2E
cd opsdental-frontend
npm run cypress:open
```

## Estructura del proyecto

```
artefacto/
├── opsdental-backend/    # Laravel 12 API REST
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Controladores por recurso
│   │   ├── Events/                 # Observer: NuevaCitaRegistrada, CitaCancelada
│   │   ├── Listeners/              # Manejadores de eventos
│   │   ├── Repositories/           # Patrón Repository
│   │   └── Services/Notifications/ # Patrón Strategy (WhatsApp)
│   ├── database/migrations/
│   └── tests/
└── opsdental-frontend/   # Next.js 16
    ├── app/
    │   ├── paciente/     # Buscar, agendar, mis citas, perfil
    │   ├── consultorio/  # Agenda, tratamientos, horarios, estadísticas
    │   └── admin/        # Gestión de consultorios y membrecías
    ├── components/ui/
    └── lib/
        ├── api.js        # Cliente HTTP centralizado con Bearer token
        ├── utils.js      # Utilidades de fecha compartidas
        └── constants.js
```

## Patrones de diseño implementados

- **Observer** — `NuevaCitaRegistrada` y `CitaCancelada` disparan notificaciones automáticas
- **Strategy** — `NotificacionFactory` selecciona el canal de notificación según el contexto
- **Repository** — `BaseRepository` + repositorios especializados abstraen el acceso a datos
- **Singleton** — Conexiones a PostgreSQL y Redis gestionadas por el contenedor de servicios de Laravel

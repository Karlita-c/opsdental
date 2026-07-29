# OpsDental — Frontend

Interfaz web construida con Next.js 15 para la plataforma de agendamiento dental OpsDental.

## Requisitos

- Node.js 20+
- npm

## Instalación local

```bash
npm install
cp .env.example .env.local
# Editar .env.local con la URL del backend
npm run dev
```

Disponible en `http://localhost:3000`.

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Despliegue (Railway)

```bash
railway up
```

# Flujos N8N — OpsDental

## Importar flujos
1. Abre N8N en http://localhost:5678 (usuario: admin / contraseña: OpsDental2026!)
2. Menú → Import from File → selecciona el archivo .json

## Variables de entorno requeridas en N8N
Configura en N8N Settings → Variables:
- `OPSDENTAL_API_URL` → http://backend:8000  (URL interna del backend en Docker)
- `OPSDENTAL_N8N_TOKEN` → token de API generado en OpsDental para N8N
- `WA_PHONE_NUMBER_ID` → ID del número de Meta WhatsApp Business
- `WA_TOKEN` → Token de acceso de Meta WhatsApp Business Cloud API

## Configurar webhook de Meta
En Meta for Developers → tu App → WhatsApp → Configuración:
- URL del webhook: https://tu-dominio.com/webhook/whatsapp-incoming
- Token de verificación: el valor de WHATSAPP_VERIFY_TOKEN en tu .env

## Flujo 1 — Recordatorios diarios
Se activa automáticamente a las 9AM. Llama al endpoint `/api/n8n/citas-manana`
del backend para obtener las citas del día siguiente y envía un mensaje WA a cada paciente.

## Flujo 2 — Confirmación/cancelación por WhatsApp
Recibe los mensajes entrantes de Meta (webhook). Si el paciente responde SÍ/SI confirma
la cita en la BD. Si responde CANCELAR, la cancela.

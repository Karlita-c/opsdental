<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta activada — OpsDental</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b; }
    .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.07); }
    .header { background: linear-gradient(135deg, #6d28d9, #4f46e5); padding: 36px 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .header p { color: rgba(255,255,255,.8); font-size: 14px; margin: 0; }
    .body { padding: 32px; }
    .body p { font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 16px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 8px; margin: 8px 0 24px; }
    .info { background: #f1f5f9; border-radius: 8px; padding: 16px 20px; font-size: 14px; color: #64748b; line-height: 1.5; }
    .footer { text-align: center; padding: 20px 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>&#10003; Cuenta verificada</h1>
      <p>OpsDental — Plataforma de citas dentales</p>
    </div>
    <div class="body">
      <span class="badge">Verificación exitosa</span>
      <p>Hola <strong>{{ $user->name }}</strong>,</p>
      <p>
        Tu consultorio ha sido revisado y <strong>activado</strong> en OpsDental.
        Ya puedes comenzar a recibir citas y configurar tu panel.
      </p>
      <p>Usa el botón de abajo para ingresar de forma inmediata:</p>

      <div style="text-align:center">
        <a href="{{ config('app.frontend_url') }}/acceso/{{ $token }}" class="btn">
          Ingresar a mi panel
        </a>
      </div>

      <div class="info">
        <strong>¿El enlace no funciona?</strong><br>
        También puedes ingresar desde
        <a href="{{ config('app.frontend_url') }}/login">{{ config('app.frontend_url') }}/login</a>
        con tu correo y contraseña registrados.<br><br>
        El enlace directo expira en <strong>48 horas</strong>.
      </div>
    </div>
    <div class="footer">
      OpsDental · {{ date('Y') }} · <a href="mailto:soporte@opsdental.com">soporte@opsdental.com</a>
    </div>
  </div>
</body>
</html>

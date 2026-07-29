import PublicLayout from '@/components/layout/PublicLayout';

const SECCION = ({ id, titulo, children }) => (
  <section id={id} className="mb-5">
    <h2 className="h5 fw-bold mb-3 pb-2" style={{ borderBottom: '2px solid var(--bs-primary)', display: 'inline-block' }}>
      {titulo}
    </h2>
    <div className="text-secondary lh-lg" style={{ fontSize: '.95rem' }}>{children}</div>
  </section>
);

export const metadata = {
  title: 'Aviso de Privacidad — OpsDental',
  description: 'Conoce cómo OpsDental recopila, usa y protege tus datos personales conforme a la LFPDPPP.',
};

export default function PrivacidadPage() {
  const fecha = '27 de julio de 2026';

  return (
    <PublicLayout>
      <main className="container py-5" style={{ maxWidth: 820 }}>

        {/* Encabezado */}
        <div className="mb-5">
          <span className="badge text-bg-primary mb-3">Aviso de Privacidad</span>
          <h1 className="fw-bold mb-2">Política de Privacidad</h1>
          <p className="text-muted small">Última actualización: {fecha}</p>
          <p className="text-secondary">
            En <strong>OpsDental</strong> tomamos muy en serio la protección de tus datos personales.
            Este Aviso de Privacidad explica qué información recopilamos, cómo la usamos y cuáles son tus derechos,
            de conformidad con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento.
          </p>
        </div>

        {/* Índice */}
        <div className="card border-0 bg-body-secondary p-4 mb-5 rounded-3">
          <h2 className="h6 fw-bold mb-3">Contenido</h2>
          <ol className="mb-0 ps-3" style={{ fontSize: '.9rem' }}>
            {[
              ['#responsable',    '1. Responsable del tratamiento'],
              ['#datos',          '2. Datos personales que recabamos'],
              ['#finalidades',    '3. Finalidades del tratamiento'],
              ['#transferencias', '4. Transferencia de datos'],
              ['#arco',           '5. Derechos ARCO'],
              ['#cookies',        '6. Uso de cookies'],
              ['#menores',        '7. Menores de edad'],
              ['#cambios',        '8. Cambios a este aviso'],
              ['#contacto',       '9. Contacto'],
            ].map(([href, label]) => (
              <li key={href} className="mb-1">
                <a href={href} className="text-primary text-decoration-none">{label}</a>
              </li>
            ))}
          </ol>
        </div>

        <SECCION id="responsable" titulo="1. Responsable del tratamiento">
          <p>
            <strong>OpsDental</strong> es responsable del tratamiento de tus datos personales.
            Para cualquier consulta relacionada con este aviso puedes contactarnos en:
          </p>
          <ul>
            <li><strong>Correo electrónico:</strong> privacidad@opsdental.com</li>
            <li><strong>País de operación:</strong> México</li>
          </ul>
        </SECCION>

        <SECCION id="datos" titulo="2. Datos personales que recabamos">
          <p>Según el tipo de usuario, recabamos los siguientes datos:</p>

          <p><strong>Pacientes:</strong></p>
          <ul>
            <li>Nombre completo y correo electrónico (para crear tu cuenta)</li>
            <li>Número de teléfono (para notificaciones de citas vía WhatsApp)</li>
            <li>Historial de citas: consultorio, tratamiento, fecha, estado</li>
            <li>Notas clínicas ingresadas por el consultorio en tu expediente digital</li>
            <li>Calificaciones otorgadas a consultorios</li>
          </ul>

          <p><strong>Consultorios (dentistas):</strong></p>
          <ul>
            <li>Nombre del titular y del consultorio, correo electrónico y contraseña</li>
            <li>Teléfono, dirección, ciudad y descripción del consultorio</li>
            <li>Cédula profesional (para verificación de identidad)</li>
            <li>Horarios de atención y catálogo de tratamientos</li>
            <li>Datos de membresía y plan contratado</li>
          </ul>

          <p>
            Los datos se recaban directamente a través del formulario de registro en la plataforma.
            No recabamos datos sensibles (datos biométricos, salud, religión, etc.) de forma directa,
            aunque los consultorios pueden registrar notas clínicas de sus pacientes.
          </p>
        </SECCION>

        <SECCION id="finalidades" titulo="3. Finalidades del tratamiento">
          <p><strong>Finalidades primarias (necesarias para el servicio):</strong></p>
          <ul>
            <li>Crear y gestionar tu cuenta de usuario</li>
            <li>Permitir el agendamiento, confirmación y cancelación de citas dentales</li>
            <li>Enviar notificaciones de recordatorio de citas vía correo electrónico y WhatsApp</li>
            <li>Verificar la cédula profesional de los consultorios registrados</li>
            <li>Gestionar el plan de membresía de los consultorios</li>
            <li>Generar estadísticas de uso del consultorio (solo visibles para el propio consultorio)</li>
          </ul>

          <p><strong>Finalidades secundarias (opcionales):</strong></p>
          <ul>
            <li>Enviarte comunicaciones sobre nuevas funciones o promociones de OpsDental</li>
          </ul>
          <p>
            Si no deseas que tus datos sean tratados para finalidades secundarias, puedes manifestarlo
            enviando un correo a <strong>privacidad@opsdental.com</strong> con el asunto "Oposición finalidades secundarias".
          </p>
        </SECCION>

        <SECCION id="transferencias" titulo="4. Transferencia de datos">
          <p>
            OpsDental puede compartir tus datos con los siguientes terceros, únicamente para los fines indicados:
          </p>
          <div className="table-responsive">
            <table className="table table-bordered table-sm" style={{ fontSize: '.9rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Tercero</th>
                  <th>Finalidad</th>
                  <th>Requiere consentimiento</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Meta (WhatsApp Cloud API)</td>
                  <td>Envío de recordatorios y notificaciones de citas</td>
                  <td>No (necesario para el servicio)</td>
                </tr>
                <tr>
                  <td>Mercado Pago</td>
                  <td>Procesamiento de depósitos y pagos de membresía</td>
                  <td>No (necesario para el servicio)</td>
                </tr>
                <tr>
                  <td>Google (Calendar API)</td>
                  <td>Sincronización de citas al calendario del consultorio (opcional)</td>
                  <td>Sí (bajo consentimiento expreso del consultorio)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            No vendemos, cedemos ni transferimos tus datos personales a terceros con fines comerciales o publicitarios.
          </p>
        </SECCION>

        <SECCION id="arco" titulo="5. Derechos ARCO">
          <p>
            Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> (derechos ARCO)
            al tratamiento de tus datos personales. Para ejercerlos:
          </p>
          <ol>
            <li>Envía un correo a <strong>privacidad@opsdental.com</strong> con el asunto "Solicitud ARCO"</li>
            <li>Incluye: tu nombre completo, correo registrado en OpsDental y descripción de tu solicitud</li>
            <li>Adjunta una copia de tu identificación oficial vigente</li>
          </ol>
          <p>
            Daremos respuesta en un plazo máximo de <strong>20 días hábiles</strong> a partir de recibir tu solicitud.
          </p>
          <p>
            También puedes revocar tu consentimiento en cualquier momento solicitando la eliminación de tu cuenta
            desde la configuración de perfil o mediante correo electrónico.
          </p>
        </SECCION>

        <SECCION id="cookies" titulo="6. Uso de cookies">
          <p>
            OpsDental utiliza cookies de sesión estrictamente necesarias para mantenerte autenticado mientras usas la plataforma.
            Estas cookies no rastrean tu comportamiento con fines publicitarios y se eliminan al cerrar sesión o al cerrar el navegador.
          </p>
          <p>No utilizamos cookies de análisis ni publicidad de terceros.</p>
        </SECCION>

        <SECCION id="menores" titulo="7. Menores de edad">
          <p>
            OpsDental está dirigido a personas mayores de 18 años. No recabamos intencionalmente datos de menores.
            Si eres padre o tutor y detectas que un menor registró una cuenta, contáctanos para eliminar la información.
          </p>
        </SECCION>

        <SECCION id="cambios" titulo="8. Cambios a este aviso">
          <p>
            OpsDental se reserva el derecho de actualizar este Aviso de Privacidad en cualquier momento.
            Cuando se realicen cambios materiales, notificaremos a los usuarios registrados por correo electrónico
            con al menos 10 días de anticipación antes de que los cambios entren en vigor.
          </p>
          <p>
            La versión vigente siempre estará disponible en <strong>opsdental.com/privacidad</strong>.
          </p>
        </SECCION>

        <SECCION id="contacto" titulo="9. Contacto">
          <p>
            Para cualquier duda, comentario o solicitud relacionada con este Aviso de Privacidad, contáctanos:
          </p>
          <ul>
            <li><strong>Correo:</strong> privacidad@opsdental.com</li>
            <li><strong>Asunto:</strong> Aviso de Privacidad OpsDental</li>
          </ul>
          <p>
            Si no quedas satisfecho con nuestra respuesta, puedes acudir al
            Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (<strong>INAI</strong>)
            en <a href="https://www.inai.org.mx" target="_blank" rel="noopener" className="text-primary">www.inai.org.mx</a>.
          </p>
        </SECCION>

      </main>
    </PublicLayout>
  );
}

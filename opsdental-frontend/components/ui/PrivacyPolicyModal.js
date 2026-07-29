import Link from 'next/link';

export default function PrivacyPolicyModal() {
  return (
    <div className="modal fade" id="modalPrivacidad" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-shield-check text-primary me-2" />
              Aviso de Privacidad — OpsDental
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
          </div>

          <div className="modal-body small text-muted" style={{ lineHeight: 1.75 }}>
            <p className="mb-1">
              <strong className="text-body">Última actualización:</strong> julio 2026
            </p>
            <p>
              En <strong className="text-body">OpsDental</strong> protegemos tus datos personales conforme a la{' '}
              <strong className="text-body">Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>.
            </p>

            <h6 className="fw-semibold text-body mt-4">1. Responsable</h6>
            <p>OpsDental — privacidad@opsdental.com</p>

            <h6 className="fw-semibold text-body mt-4">2. Datos que recopilamos</h6>
            <ul>
              <li><strong className="text-body">Pacientes:</strong> nombre, correo, teléfono e historial de citas.</li>
              <li><strong className="text-body">Consultorios:</strong> nombre del titular y del consultorio, correo, teléfono, dirección, ciudad y cédula profesional.</li>
            </ul>

            <h6 className="fw-semibold text-body mt-4">3. Finalidad</h6>
            <ul>
              <li>Gestionar tu cuenta y permitir el agendamiento de citas.</li>
              <li>Enviar notificaciones de confirmación y recordatorios (correo y WhatsApp).</li>
              <li>Verificar la cédula profesional de los consultorios.</li>
              <li>Gestionar membresías y planes de los consultorios.</li>
            </ul>

            <h6 className="fw-semibold text-body mt-4">4. Transferencias</h6>
            <p>
              Compartimos datos únicamente con Meta (WhatsApp), Mercado Pago y Google Calendar —
              todos necesarios para el funcionamiento del servicio.
              No vendemos datos a terceros con fines comerciales.
            </p>

            <h6 className="fw-semibold text-body mt-4">5. Derechos ARCO</h6>
            <p>
              Puedes <strong className="text-body">Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento
              de tus datos escribiendo a <strong className="text-body">privacidad@opsdental.com</strong>.
              Respondemos en un máximo de 20 días hábiles.
            </p>

            <h6 className="fw-semibold text-body mt-4">6. Seguridad</h6>
            <p>
              Las contraseñas se almacenan con cifrado bcrypt. La autenticación usa tokens de sesión seguros.
              No almacenamos datos de tarjetas de crédito.
            </p>

            <div className="alert alert-light border mt-4 mb-0 d-flex align-items-center gap-2" style={{ fontSize: '.82rem' }}>
              <i className="bi bi-info-circle-fill text-primary flex-shrink-0" />
              <span>
                Para leer el aviso completo visita{' '}
                <Link href="/privacidad" className="text-primary fw-semibold" target="_blank">
                  opsdental.com/privacidad
                </Link>
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <Link href="/privacidad" target="_blank" className="btn btn-outline-secondary btn-sm me-auto">
              Ver aviso completo
            </Link>
            <button type="button" className="btn btn-primary" data-bs-dismiss="modal">
              Entendido
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

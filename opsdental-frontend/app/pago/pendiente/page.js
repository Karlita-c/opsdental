'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PendienteContent() {
  const params = useSearchParams();
  const citaId = params.get('cita');

  return (
    <div className="text-center py-4" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
        style={{ width: 88, height: 88, background: 'rgba(217,119,6,.1)' }}>
        <i className="bi bi-hourglass-split" style={{ fontSize: '2.8rem', color: '#d97706' }} />
      </div>
      <h4 className="fw-bold mb-2">Pago en proceso</h4>
      <p className="text-muted mb-4">
        Tu pago está siendo procesado. Esto puede tardar hasta 72 horas si pagaste en OXXO o con transferencia.
      </p>
      <div className="card border-0 bg-body-secondary mb-4 text-start">
        <div className="card-body p-4">
          <p className="fw-semibold small mb-3">¿Qué pasa ahora?</p>
          <ul className="list-unstyled mb-0">
            {[
              { icon: 'bi-clock text-warning',   text: 'Tu cita sigue reservada mientras el pago se confirma' },
              { icon: 'bi-whatsapp text-success', text: 'Recibirás un mensaje de WhatsApp cuando se confirme el pago' },
              { icon: 'bi-envelope text-primary', text: 'Revisa el correo de confirmación de Mercado Pago' },
            ].map(item => (
              <li key={item.text} className="d-flex align-items-center gap-3 py-2 border-bottom small text-muted">
                <i className={`bi ${item.icon} flex-shrink-0 fs-6`} />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="d-flex justify-content-center gap-3 flex-wrap">
        <Link className="btn btn-primary px-4" href="/paciente/citas">
          <i className="bi bi-calendar3 me-2" />Ver mis citas
        </Link>
        <Link className="btn btn-outline-secondary" href="/paciente/dashboard">
          <i className="bi bi-house me-2" />Ir al panel
        </Link>
      </div>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}>
      <PendienteContent />
    </Suspense>
  );
}

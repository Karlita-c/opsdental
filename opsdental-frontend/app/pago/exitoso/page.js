'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ExitosoContent() {
  const params = useSearchParams();
  const citaId = params.get('cita');

  return (
    <div className="text-center py-4" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
        style={{ width: 88, height: 88, background: 'rgba(22,163,74,.1)' }}>
        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '2.8rem' }} />
      </div>
      <h4 className="fw-bold mb-2">¡Pago recibido!</h4>
      <p className="text-muted mb-4">
        Tu depósito fue procesado correctamente. Tu cita está confirmada y asegurada.
      </p>
      <div className="alert alert-success d-inline-flex align-items-center gap-2 mb-4 px-4">
        <i className="bi bi-shield-check-fill flex-shrink-0" />
        <span className="small text-start">Depósito registrado. Recibirás confirmación por WhatsApp.</span>
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

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}>
      <ExitosoContent />
    </Suspense>
  );
}

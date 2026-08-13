'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function FallidoContent() {
  const params  = useSearchParams();
  const citaId  = params.get('cita');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reintentar = async () => {
    if (!citaId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/citas/${citaId}/deposito`);
      window.location.href = data.init_point;
    } catch (e) {
      setError(e.message || 'No se pudo reiniciar el pago. Intenta más tarde.');
      setLoading(false);
    }
  };

  return (
    <div className="text-center py-4" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
        style={{ width: 88, height: 88, background: 'rgba(220,38,38,.1)' }}>
        <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '2.8rem' }} />
      </div>
      <h4 className="fw-bold mb-2">Pago no completado</h4>
      <p className="text-muted mb-4">
        Hubo un problema al procesar tu pago. Tu cita sigue reservada pero el depósito queda pendiente.
      </p>
      {error && <div className="alert alert-danger small mb-3">{error}</div>}
      <div className="d-flex justify-content-center gap-3 flex-wrap">
        {citaId && (
          <button
            className="btn btn-primary px-4 d-flex align-items-center gap-2"
            onClick={reintentar}
            disabled={loading}
          >
            {loading
              ? <span className="spinner-border spinner-border-sm" />
              : <i className="bi bi-arrow-repeat" />}
            Intentar de nuevo
          </button>
        )}
        <Link className="btn btn-outline-secondary" href="/paciente/citas">
          <i className="bi bi-calendar3 me-2" />Ver mis citas
        </Link>
      </div>
    </div>
  );
}

export default function PagoFallidoPage() {
  return (
    <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}>
      <FallidoContent />
    </Suspense>
  );
}

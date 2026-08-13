'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function PagoSimuladoPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [cita,    setCita]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState('');
  const [metodo,  setMetodo]  = useState('tarjeta');

  useEffect(() => {
    if (!id) return;
    api.get(`/citas/${id}`)
      .then(r => setCita(r.data.cita ?? r.data))
      .catch(() => setError('No se pudo cargar la cita.'))
      .finally(() => setLoading(false));
  }, [id]);

  const confirmar = async () => {
    setPaying(true);
    setError('');
    try {
      await api.post('/deposito/webhook', {
        type: 'payment',
        data: { id: `simulado-${id}` },
      });
      router.push(`/pago/exitoso?cita=${id}`);
    } catch (e) {
      setError(e.message || 'Error al procesar el pago simulado.');
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" />
    </div>
  );

  if (error && !cita) return (
    <div className="alert alert-danger" style={{ maxWidth: 480, margin: '2rem auto' }}>{error}</div>
  );

  const monto = cita?.tratamiento?.deposito_monto ?? 0;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {/* Cabecera entorno de prueba */}
      <div className="alert alert-warning d-flex align-items-center gap-2 mb-4 small">
        <i className="bi bi-cone-striped flex-shrink-0" />
        <span>
          <strong>Entorno de prueba</strong> — ningún cargo real será procesado.
        </span>
      </div>

      <h5 className="fw-bold mb-1">Pago simulado</h5>
      <p className="text-muted small mb-4">
        {cita?.tratamiento?.nombre} — {cita?.consultorio?.nombre ?? 'Consultorio'}
      </p>

      {/* Selector de método */}
      <div className="d-flex gap-2 mb-4">
        {[
          { value: 'tarjeta', label: 'Tarjeta',  icon: 'bi-credit-card' },
          { value: 'oxxo',    label: 'OXXO',      icon: 'bi-cash-coin'  },
        ].map(m => (
          <button
            key={m.value}
            onClick={() => setMetodo(m.value)}
            className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 ${
              metodo === m.value ? 'btn-primary' : 'btn-outline-secondary'
            }`}
          >
            <i className={`bi ${m.icon}`} />
            {m.label}
          </button>
        ))}
      </div>

      {metodo === 'tarjeta' && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <p className="small fw-semibold text-muted mb-3">Datos de tarjeta de prueba</p>
            <div className="mb-3">
              <label className="form-label small">Número de tarjeta</label>
              <input
                className="form-control font-monospace"
                defaultValue="4242 4242 4242 4242"
                readOnly
              />
            </div>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small">Vencimiento</label>
                <input className="form-control" defaultValue="12/30" readOnly />
              </div>
              <div className="col-6">
                <label className="form-label small">CVV</label>
                <input className="form-control" defaultValue="123" readOnly />
              </div>
            </div>
            <div className="mt-3">
              <label className="form-label small">Nombre en tarjeta</label>
              <input className="form-control" defaultValue="TEST USER" readOnly />
            </div>
          </div>
        </div>
      )}

      {metodo === 'oxxo' && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4 text-center">
            <i className="bi bi-upc-scan display-4 text-muted mb-3 d-block" />
            <p className="small text-muted">
              En producción se generaría un código de barras OXXO. En modo simulado, el pago se aprueba directamente al confirmar.
            </p>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="card border-0 bg-body-secondary mb-4">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-muted">Depósito</span>
            <span className="fw-semibold">
              ${Number(monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </span>
          </div>
          <div className="d-flex justify-content-between small text-muted">
            <span>Comisión</span>
            <span>$0.00</span>
          </div>
          <hr className="my-2" />
          <div className="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span>
              ${Number(monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger small mb-3">{error}</div>}

      <button
        className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center gap-2"
        onClick={confirmar}
        disabled={paying}
      >
        {paying
          ? <><span className="spinner-border spinner-border-sm" /> Procesando…</>
          : <><i className="bi bi-shield-lock-fill" /> Confirmar pago simulado</>}
      </button>

      <p className="text-center text-muted small mt-3">
        <i className="bi bi-lock-fill me-1" />
        Pago protegido · Entorno de prueba
      </p>
    </div>
  );
}

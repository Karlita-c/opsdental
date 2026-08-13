'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fmtFechaCorta as fmtFecha } from '@/lib/utils';

export default function ListaEsperaPage() {
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/consultorio/lista-espera')
      .then(r => setLista(r.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de espera.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-0">Lista de espera</h3>
          <p className="text-muted small mb-0">
            {lista.length} paciente{lista.length !== 1 ? 's' : ''} en espera
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger small mb-4">{error}</div>
      )}

      {lista.length === 0 && !error ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <i className="bi bi-hourglass d-block mb-2" style={{ fontSize: '2rem' }} />
            <p className="mb-0">No hay pacientes en lista de espera.</p>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 fw-semibold small">#</th>
                  <th className="py-3 fw-semibold small">Paciente</th>
                  <th className="py-3 fw-semibold small d-none d-md-table-cell">Tratamiento</th>
                  <th className="py-3 fw-semibold small d-none d-lg-table-cell">En espera desde</th>
                  <th className="py-3 fw-semibold small text-center">Estado</th>
                  <th className="py-3 pe-4 fw-semibold small text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((item, i) => (
                  <tr key={item.id ?? i}>
                    <td className="px-4 py-3">
                      <span className="badge bg-secondary-subtle text-secondary-emphasis fw-bold rounded-pill px-3">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
                          style={{ width: 36, height: 36, fontSize: '.8rem' }}>
                          {(item.paciente?.name ?? 'P')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold small">{item.paciente?.name ?? '—'}</div>
                          <div className="text-muted" style={{ fontSize: '.75rem' }}>{item.paciente?.email ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 d-none d-md-table-cell">
                      <span className="small">{item.tratamiento?.nombre ?? '—'}</span>
                    </td>
                    <td className="py-3 d-none d-lg-table-cell">
                      <span className="small text-muted">{fmtFecha(item.created_at)}</span>
                    </td>
                    <td className="py-3 text-center">
                      <AppBadge text={item.estado ?? 'espera'} />
                    </td>
                    <td className="py-3 pe-4 text-end">
                      {item.paciente?.telefono ? (
                        <a
                          href={`https://wa.me/52${item.paciente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hola ${item.paciente.name ?? ''}, tenemos un espacio disponible para tu cita.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                          title="Contactar por WhatsApp"
                        >
                          <i className="bi bi-whatsapp" />
                          <span className="d-none d-sm-inline">WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-muted small">Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

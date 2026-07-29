'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const StatCard = ({ icon, label, value, color = 'primary' }) => (
  <div className="col-6 col-md-3">
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '0.875rem' }}>
      <div className="card-body py-3 px-4 d-flex align-items-center gap-3">
        <div className={`d-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10 flex-shrink-0`}
          style={{ width: 44, height: 44 }}>
          <i className={`bi ${icon} text-${color}`} />
        </div>
        <div>
          <div className="fw-bold fs-4 lh-1">{value}</div>
          <div className="text-muted small">{label}</div>
        </div>
      </div>
    </div>
  </div>
);

export default function EstadisticasPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/consultorio/estadisticas')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats)  return <p className="text-muted">No se pudieron cargar las estadísticas.</p>;

  const topTratamientos = stats.top_tratamientos ?? [];
  const maxTrat = topTratamientos[0]?.total ?? 1;

  return (
    <>
      <div className="mb-4">
        <h3 className="fw-bold mb-0">Estadísticas</h3>
        <p className="text-muted mb-0 small">Resumen de actividad de tu consultorio</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="row g-3 mb-4">
        <StatCard icon="bi-calendar-check" label="Citas este mes"    value={stats.citas_mes}             color="primary"   />
        <StatCard icon="bi-check2-circle"  label="Total confirmadas" value={stats.total_general}         color="success"   />
        <StatCard icon="bi-people"         label="Pacientes únicos"  value={stats.pacientes_unicos}      color="info"      />
        <StatCard icon="bi-star-half"      label="Calificación prom" value={stats.calificacion_promedio > 0 ? `${stats.calificacion_promedio} / 5` : '—'} color="warning" />
      </div>

      {/* Top tratamientos */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
        <div className="card-body p-4">
          <h6 className="fw-semibold mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-bar-chart-fill text-primary" />
            Tratamientos más solicitados
          </h6>

          {topTratamientos.length === 0 ? (
            <p className="text-muted small mb-0 text-center py-3">
              Aún no hay citas registradas para mostrar estadísticas.
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {topTratamientos.map((t, i) => (
                <div key={t.nombre}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-medium">
                      <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill me-2">{i + 1}</span>
                      {t.nombre}
                    </span>
                    <span className="small text-muted fw-semibold">{t.total} {t.total === 1 ? 'cita' : 'citas'}</span>
                  </div>
                  <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${Math.round((t.total / maxTrat) * 100)}%`, borderRadius: 4 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

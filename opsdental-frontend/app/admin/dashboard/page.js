'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PLAN_LABEL, PLAN_COLOR } from '@/lib/constants';
import { getSaludo, diasHastaVencer } from '@/lib/utils';

const hoy  = new Date();
const en7d = new Date(hoy); en7d.setDate(hoy.getDate() + 7);

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3 p-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 52, height: 52, background: bg }}
        >
          <i className={`bi ${icon}`} style={{ fontSize: '1.4rem', color }} />
        </div>
        <div>
          <div className="h2 fw-bold mb-0 lh-1">{value}</div>
          <div className="text-muted small mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user }                      = useAuth();
  const [lista,   setLista]           = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get('/admin/consultorios')
      .then(r => setLista(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pendientes = lista.filter(c => !c.activo);
    const activos    = lista.filter(c => c.activo);
    const vencidos   = lista.filter(c => {
      if (!c.membrecia?.fecha_vencimiento) return false;
      return new Date(c.membrecia.fecha_vencimiento) < hoy;
    });
    const porVencer  = lista.filter(c => {
      if (!c.membrecia?.fecha_vencimiento || !c.activo) return false;
      const venc = new Date(c.membrecia.fecha_vencimiento);
      return venc >= hoy && venc <= en7d;
    });

    const recientes = [...lista]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);

    return { pendientes, activos, vencidos, porVencer, recientes };
  }, [lista]);

  const saludo = getSaludo();

  return (
    <>
      {/* Encabezado */}
      <div className="mb-5">
        <h3 className="fw-bold mb-1">{saludo}, {user?.name}</h3>
        <p className="text-muted mb-0">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Alerta de pendientes */}
          {stats.pendientes.length > 0 && (
            <div className="alert alert-warning d-flex align-items-center gap-3 mb-4 shadow-sm">
              <i className="bi bi-exclamation-triangle-fill fs-4 flex-shrink-0" />
              <div className="flex-grow-1">
                <strong>
                  {stats.pendientes.length} consultorio{stats.pendientes.length !== 1 ? 's' : ''} esperan verificación
                </strong>
                <div className="small">Revisa las cédulas profesionales y activa las cuentas pendientes.</div>
              </div>
              <Link href="/admin/consultorios?filtro=pendientes" className="btn btn-warning btn-sm fw-semibold flex-shrink-0">
                Revisar ahora
              </Link>
            </div>
          )}

          {/* Alerta de por vencer */}
          {stats.porVencer.length > 0 && (
            <div className="alert alert-info d-flex align-items-center gap-3 mb-4 shadow-sm">
              <i className="bi bi-clock-history fs-4 flex-shrink-0" />
              <div className="flex-grow-1">
                <strong>
                  {stats.porVencer.length} membrecía{stats.porVencer.length !== 1 ? 's' : ''} vence{stats.porVencer.length === 1 ? '' : 'n'} en los próximos 7 días
                </strong>
                <div className="small">Considera contactar a los consultorios afectados.</div>
              </div>
            </div>
          )}

          {/* Stats cards */}
          <div className="row g-3 mb-5">
            {[
              {
                icon: 'bi-buildings-fill',
                label: 'Total registrados',
                value: lista.length,
                color: 'var(--bb-primary)',
                bg:    'rgba(var(--bb-primary-rgb),.12)',
              },
              {
                icon: 'bi-check-circle-fill',
                label: 'Consultorios activos',
                value: stats.activos.length,
                color: '#16a34a',
                bg:    'rgba(22,163,74,.12)',
              },
              {
                icon: 'bi-hourglass-split',
                label: 'Pendientes de verificar',
                value: stats.pendientes.length,
                color: '#d97706',
                bg:    'rgba(217,119,6,.12)',
              },
              {
                icon: 'bi-x-circle-fill',
                label: 'Membresías vencidas',
                value: stats.vencidos.length,
                color: '#dc2626',
                bg:    'rgba(220,38,38,.12)',
              },
            ].map(s => (
              <div key={s.label} className="col-6 col-xl-3">
                <StatCard {...s} />
              </div>
            ))}
          </div>

          {/* Paneles: recientes + por vencer */}
          <div className="row g-4">

            {/* Últimos registros */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                  <div>
                    <h6 className="fw-bold mb-0">Últimos registros</h6>
                    <small className="text-muted">Los 5 consultorios más recientes</small>
                  </div>
                  <Link href="/admin/consultorios" className="btn btn-outline-primary btn-sm">
                    Ver todos
                  </Link>
                </div>
                <div className="card-body p-0">
                  {stats.recientes.length === 0 ? (
                    <p className="text-muted text-center py-5 mb-0">No hay consultorios registrados aún.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stats.recientes.map(c => (
                        <li key={c.id} className="list-group-item px-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-2 fw-bold flex-shrink-0"
                              style={{
                                width: 38, height: 38,
                                background: 'rgba(var(--bb-primary-rgb),.1)',
                                color: 'var(--bb-primary)',
                                fontSize: '.85rem',
                              }}
                            >
                              {c.nombre?.[0]?.toUpperCase() ?? 'C'}
                            </div>
                            <div className="flex-grow-1 min-width-0">
                              <div className="fw-semibold text-truncate" style={{ fontSize: '.875rem' }}>
                                {c.nombre}
                              </div>
                              <div className="text-muted" style={{ fontSize: '.75rem' }}>
                                {c.ciudad} · {c.user?.email}
                              </div>
                            </div>
                            <AppBadge
                              text={c.activo ? 'activo' : 'pendiente'}
                              variant={c.activo ? 'success' : 'warning'}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Membresías por vencer */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-transparent border-bottom py-3">
                  <h6 className="fw-bold mb-0">Membresías próximas a vencer</h6>
                  <small className="text-muted">Próximos 7 días</small>
                </div>
                <div className="card-body p-0">
                  {stats.porVencer.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-check2-circle text-success fs-2 d-block mb-2" />
                      <p className="text-muted small mb-0">Ninguna membrecía vence pronto.</p>
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stats.porVencer.map(c => {
                        const dias = diasHastaVencer(c.membrecia.fecha_vencimiento);
                        return (
                          <li key={c.id} className="list-group-item px-4 py-3">
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '.875rem' }}>{c.nombre}</div>
                                <div className="text-muted" style={{ fontSize: '.75rem' }}>
                                  Plan {PLAN_LABEL[c.membrecia.plan] ?? c.membrecia.plan}
                                </div>
                              </div>
                              <span
                                className={`badge rounded-pill ${dias <= 2 ? 'text-bg-danger' : 'text-bg-warning'}`}
                              >
                                {dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `${dias} días`}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Resumen de planes */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-header bg-transparent border-bottom py-3">
              <h6 className="fw-bold mb-0">Distribución de planes</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {['basico', 'premium', 'pro', 'gratuito'].map(plan => {
                  const count = lista.filter(c => c.membrecia?.plan === plan).length;
                  const pct   = lista.length ? Math.round((count / lista.length) * 100) : 0;
                  return (
                    <div key={plan} className="col-md-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-medium small">{PLAN_LABEL[plan]}</span>
                        <span className="text-muted small">{count} ({pct}%)</span>
                      </div>
                      <div className="progress" style={{ height: 8, borderRadius: 99 }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${pct}%`, background: PLAN_COLOR[plan], borderRadius: 99 }}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </>
      )}
    </>
  );
}

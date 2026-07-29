'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { fmtFecha, getSaludo } from '@/lib/utils';

function waLink(telefono, nombre, consultorioNombre) {
  const num = (telefono ?? '').replace(/\D/g, '').replace(/^0/, '');
  const tel = num.startsWith('52') ? num : `52${num}`;
  const msg = encodeURIComponent(
    `Hola, soy ${nombre} y quisiera hacer una consulta sobre mis citas en ${consultorioNombre}.`
  );
  return `https://wa.me/${tel}?text=${msg}`;
}

export default function PacienteDashboard() {
  const { user }                          = useAuth();
  const [citas,         setCitas]         = useState([]);
  const [consultorio,   setConsultorio]   = useState(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/citas'),
      api.get('/paciente/mi-consultorio').catch(() => ({ data: null })),
    ]).then(([rc, rm]) => {
      setCitas(rc.data ?? []);
      setConsultorio(rm.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const proximas    = citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado));
  const completadas = citas.filter(c => c.estado === 'completada');
  const canceladas  = citas.filter(c => c.estado === 'cancelada');

  const stats = [
    { label: 'Total',       value: citas.length,       color: 'var(--bb-p)',  bg: 'rgba(var(--bb-p-rgb),.12)', icon: 'bi-calendar3' },
    { label: 'Próximas',    value: proximas.length,    color: '#16a34a',       bg: 'rgba(22,163,74,.12)',        icon: 'bi-calendar-check' },
    { label: 'Completadas', value: completadas.length, color: '#64748b',       bg: 'rgba(100,116,139,.12)',      icon: 'bi-check2-all' },
    { label: 'Canceladas',  value: canceladas.length,  color: '#dc2626',       bg: 'rgba(220,38,38,.12)',        icon: 'bi-x-circle' },
  ];

  const saludo = getSaludo();

  if (loading) return <div className="py-5"><LoadingSpinner /></div>;

  return (
    <>
      {/* Cabecera */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <p className="text-muted small mb-1">{saludo}</p>
          <h3 className="fw-bold mb-0">{user?.name}</h3>
          <p className="text-muted mb-0 small">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {consultorio && (
          <div className="d-flex gap-2 flex-wrap">
            <a
              href={waLink(consultorio.telefono, user?.name, consultorio.nombre)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success d-flex align-items-center gap-2"
            >
              <i className="bi bi-whatsapp" /> Contactar consultorio
            </a>
            <Link className="btn btn-primary d-flex align-items-center gap-2" href={`/paciente/consultorios/${consultorio.id}`}>
              <i className="bi bi-plus-lg" /> Nueva cita
            </Link>
          </div>
        )}
      </div>

      {/* Mi Consultorio — card prominente */}
      {consultorio && (
        <div className="card border-0 shadow-sm mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(var(--bb-p-rgb),.06) 0%, rgba(var(--bb-p-rgb),.02) 100%)', borderLeft: '4px solid var(--bb-p)' }}>
          <div className="card-body p-4">
            <div className="d-flex flex-wrap align-items-center gap-3 justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: 52, height: 52, background: 'rgba(var(--bb-p-rgb),.12)', color: 'var(--bb-p)', fontSize: '1.4rem' }}>
                  <i className="bi bi-building" />
                </div>
                <div>
                  <p className="text-muted small mb-0 text-uppercase fw-semibold" style={{ letterSpacing: '.06em', fontSize: '.68rem' }}>Tu consultorio</p>
                  <h5 className="fw-bold mb-0">{consultorio.nombre}</h5>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-geo-alt me-1" />{consultorio.ciudad}
                    {consultorio.telefono && <><span className="mx-2">·</span><i className="bi bi-telephone me-1" />{consultorio.telefono}</>}
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <a
                  href={waLink(consultorio.telefono, user?.name, consultorio.nombre)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success btn-sm d-flex align-items-center gap-2 fw-semibold"
                >
                  <i className="bi bi-whatsapp" /> WhatsApp
                </a>
                <Link href={`/paciente/consultorios/${consultorio.id}`}
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-plus" /> Agendar cita
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {stats.map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: 44, height: 44, background: s.bg }}>
                  <i className={`bi ${s.icon}`} style={{ fontSize: '1.2rem', color: s.color }} />
                </div>
                <div>
                  <div className="fw-bold fs-4 lh-1">{s.value}</div>
                  <div className="text-muted" style={{ fontSize: '.78rem' }}>{s.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Próxima cita destacada */}
      {proximas.length > 0 && (() => {
        const next = proximas[0];
        return (
          <div className="card border-0 shadow-sm mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(var(--bb-p-rgb),.07) 0%, rgba(var(--bb-p-rgb),.03) 100%)' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: 52, height: 52, background: 'rgba(var(--bb-p-rgb),.12)' }}>
                  <i className="bi bi-calendar-event" style={{ fontSize: '1.4rem', color: 'var(--bb-p)' }} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                    <p className="text-muted small fw-medium mb-0 text-uppercase" style={{ letterSpacing: '.06em', fontSize: '.7rem' }}>
                      Tu próxima cita
                    </p>
                    <AppBadge text={next.estado} />
                  </div>
                  <h5 className="fw-bold mt-1 mb-1">{next.tratamiento?.nombre}</h5>
                  <p className="text-muted small mb-1">
                    <i className="bi bi-building me-1" />{next.consultorio?.nombre}
                  </p>
                  <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
                    <span className="small fw-medium">
                      <i className="bi bi-calendar3 me-1 text-primary" />{fmtFecha(next.fecha)}
                    </span>
                    <span className="small fw-medium">
                      <i className="bi bi-clock me-1 text-primary" />{next.hora_inicio} – {next.hora_fin}
                    </span>
                    <span className="small fw-medium">
                      <i className="bi bi-stopwatch me-1 text-primary" />{next.tratamiento?.duracion_minutos} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lista de próximas citas */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3 px-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="fw-semibold mb-0">Próximas citas</h6>
              <p className="text-muted small mb-0">Pendientes y confirmadas</p>
            </div>
            <Link className="btn btn-outline-primary btn-sm" href="/paciente/citas">Ver todas</Link>
          </div>
        </div>
        <div className="card-body p-0">
          {proximas.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                style={{ width: 60, height: 60, background: 'rgba(var(--bb-p-rgb),.08)' }}>
                <i className="bi bi-calendar-plus" style={{ fontSize: '1.5rem', color: 'var(--bb-p)' }} />
              </div>
              <p className="text-muted mb-3 small">No tienes citas próximas.</p>
              {consultorio ? (
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Link className="btn btn-primary btn-sm px-4" href={`/paciente/consultorios/${consultorio.id}`}>
                    <i className="bi bi-calendar-plus me-2" />Agendar cita
                  </Link>
                  <a
                    href={waLink(consultorio.telefono, user?.name, consultorio.nombre)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-success btn-sm px-4"
                  >
                    <i className="bi bi-whatsapp me-2" />Preguntar por WhatsApp
                  </a>
                </div>
              ) : (
                <p className="text-muted small">Contacta a tu consultorio para que te registre en la plataforma.</p>
              )}
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {proximas.slice(0, 5).map(c => (
                <li key={c.id} className="list-group-item px-4 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{ width: 46, height: 46, background: 'rgba(var(--bb-p-rgb),.09)' }}>
                      <i className="bi bi-tooth" style={{ fontSize: '1.2rem', color: 'var(--bb-p)' }} />
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-semibold text-truncate small">{c.tratamiento?.nombre}</div>
                      <div className="text-muted" style={{ fontSize: '.78rem' }}>
                        {c.consultorio?.nombre}
                        <span className="mx-2">·</span>
                        {fmtFecha(c.fecha)} {c.hora_inicio}
                      </div>
                    </div>
                    <AppBadge text={c.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

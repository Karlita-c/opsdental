'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { ESTADO_COLOR } from '@/lib/constants';
import { diasHastaVencer } from '@/lib/utils';

export default function ConsultorioDashboard() {
  const { user }              = useAuth();
  const [citas,   setCitas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState({ text: '', type: 'success' });

  const activo = user?.consultorio?.activo;

  const cargar = () => {
    setLoading(true);
    api.get('/consultorio/agenda')
      .then(r => setCitas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activo) cargar();
    else setLoading(false);
  }, [activo]);

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/consultorio/citas/${id}/estado`, { estado });
      setMsg({ text: `Cita marcada como ${estado}.`, type: 'success' });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const cancelarCita = async (id) => {
    if (!confirm('¿Cancelar esta cita? El paciente será notificado.')) return;
    try {
      await api.patch(`/consultorio/citas/${id}/cancelar`);
      setMsg({ text: 'Cita cancelada.', type: 'warning' });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const membrecia = user?.consultorio?.membrecia;

  // Pantalla de cuenta pendiente de verificación
  if (activo === false) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center" style={{ maxWidth: 480 }}>
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
            style={{ width: 80, height: 80, background: 'rgba(217,119,6,.12)', border: '2px solid rgba(217,119,6,.3)' }}>
            <i className="bi bi-hourglass-split fs-1 text-warning" />
          </div>
          <h4 className="fw-bold mb-2">Cuenta pendiente de verificación</h4>
          <p className="text-muted mb-4">
            El administrador revisará tu cédula profesional y activará tu consultorio.
            Una vez activo, comenzarás a recibir citas en la plataforma.
          </p>

          {/* ¿Qué se valida? */}
          <div className="card border-0 bg-body-secondary mb-4">
            <div className="card-body p-4 text-start">
              <p className="fw-semibold small mb-3">¿Qué se verifica?</p>
              {[
                { icon: 'bi-patch-check', text: 'Cédula profesional registrada ante la SEP' },
                { icon: 'bi-building-check', text: 'Dirección del consultorio' },
                { icon: 'bi-person-badge', text: 'Identidad del titular' },
              ].map(item => (
                <div key={item.text} className="d-flex align-items-center gap-2 mb-2">
                  <i className={`bi ${item.icon} text-primary`} />
                  <span className="text-muted small">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Datos registrados */}
          <div className="card border-0 bg-body-secondary text-start">
            <div className="card-body py-3 px-4 small">
              <p className="mb-2 fw-semibold text-body">Datos registrados:</p>
              <ul className="mb-0 text-muted list-unstyled">
                <li className="py-1 border-bottom">Consultorio: <strong className="text-body">{user?.consultorio?.nombre}</strong></li>
                <li className="py-1 border-bottom">Titular: <strong className="text-body">{user?.name}</strong></li>
                <li className="py-1 border-bottom">Correo: <strong className="text-body">{user?.email}</strong></li>
                <li className="py-1">Cédula: <strong className="text-body font-monospace">{user?.consultorio?.cedula_profesional ?? '—'}</strong></li>
              </ul>
            </div>
          </div>

          <p className="text-muted small mt-4 mb-0">
            <i className="bi bi-envelope me-1" />
            Dudas: <strong className="text-body">soporte@OpsDental.com</strong>
          </p>
        </div>
      </div>
    );
  }

  const pendientes  = citas.filter(c => c.estado === 'pendiente');
  const confirmadas = citas.filter(c => c.estado === 'confirmada');
  const completadas = citas.filter(c => c.estado === 'completada');

  const stats = [
    { label: 'Citas hoy',   value: citas.length,       color: 'var(--bb-p)', bg: 'rgba(var(--bb-p-rgb),.1)', icon: 'bi-calendar3' },
    { label: 'Pendientes',  value: pendientes.length,  color: '#d97706',     bg: 'rgba(217,119,6,.1)',        icon: 'bi-hourglass-split' },
    { label: 'Confirmadas', value: confirmadas.length, color: '#16a34a',     bg: 'rgba(22,163,74,.1)',        icon: 'bi-check2-circle' },
    { label: 'Completadas', value: completadas.length, color: '#64748b',     bg: 'rgba(100,116,139,.1)',      icon: 'bi-check2-all' },
  ];

  return (
    <>
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-5">
        <div>
          <h3 className="fw-bold mb-1">{user?.consultorio?.nombre ?? user?.name}</h3>
          <p className="text-muted mb-0 small">
            {(() => { const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); })()}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {membrecia && <AppBadge text={membrecia.plan} />}
          <Link className="btn btn-outline-primary btn-sm" href="/consultorio/agenda">
            <i className="bi bi-calendar3 me-1" />Agenda completa
          </Link>
        </div>
      </div>

      {/* Alerta si membrecía vence pronto */}
      {membrecia?.fecha_vencimiento && (() => {
        const dias = diasHastaVencer(membrecia.fecha_vencimiento);
        if (dias <= 7 && dias >= 0) return (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
            <span className="small">
              Tu membrecía <strong>{membrecia.plan}</strong> vence en <strong>{dias === 0 ? 'hoy' : `${dias} día${dias !== 1 ? 's' : ''}`}</strong>.{' '}
              <a href="/consultorio/membrecia" className="alert-link">Renueva o cambia tu plan</a>.
            </span>
          </div>
        );
        return null;
      })()}

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

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

      {/* Lista de citas de hoy */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3 px-4">
          <h6 className="fw-semibold mb-0">Citas de hoy</h6>
          <p className="text-muted small mb-0">Gestiona el estado de cada cita</p>
        </div>
        <div className="card-body p-0">
          {loading ? <div className="p-4"><LoadingSpinner /></div> : citas.length === 0 ? (
            <div className="text-center py-5 px-3">
              <i className="bi bi-calendar-check text-muted d-block mb-2" style={{ fontSize: '2rem' }} />
              <p className="text-muted mb-0 small">No hay citas agendadas para hoy.</p>
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {citas.map(c => {
                const es = ESTADO_COLOR[c.estado] ?? ESTADO_COLOR.pendiente;
                return (
                  <li key={c.id} className="list-group-item px-4 py-3">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">

                      <div className="d-flex align-items-center gap-3">
                        {/* Hora */}
                        <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                          style={{ width: 52, height: 52, background: es.bg }}>
                          <div className="text-center" style={{ color: es.text }}>
                            <div className="fw-bold lh-1" style={{ fontSize: '.9rem' }}>{c.hora_inicio}</div>
                            <div style={{ fontSize: '.68rem' }}>{c.hora_fin}</div>
                          </div>
                        </div>
                        {/* Info */}
                        <div>
                          <div className="fw-semibold small">{c.paciente?.user?.name}</div>
                          <div className="text-muted" style={{ fontSize: '.78rem' }}>
                            {c.tratamiento?.nombre}
                            <span className="ms-1 opacity-75">· {c.tratamiento?.duracion_minutos} min</span>
                          </div>
                          {c.notas && (
                            <div className="text-muted small fst-italic mt-1">
                              <i className="bi bi-chat-left-text me-1" />{c.notas}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estado + acciones */}
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <AppBadge text={c.estado} />
                        {c.estado === 'pendiente' && (
                          <button className="btn btn-outline-success btn-sm" onClick={() => cambiarEstado(c.id, 'confirmada')}>
                            <i className="bi bi-check2 me-1" />Confirmar
                          </button>
                        )}
                        {c.estado === 'confirmada' && (
                          <button className="btn btn-outline-primary btn-sm" onClick={() => cambiarEstado(c.id, 'completada')}>
                            <i className="bi bi-check2-all me-1" />Completar
                          </button>
                        )}
                        {['pendiente','confirmada'].includes(c.estado) && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => cancelarCita(c.id)}>
                            <i className="bi bi-x-circle me-1" />Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}


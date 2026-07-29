'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fmtISO, fmtFechaLarga as fmtLarg } from '@/lib/utils';
import { ESTADO_COLOR } from '@/lib/constants';

export default function AgendaPage() {
  const [fecha,   setFecha]   = useState('');        // se inicializa en el cliente vía useEffect
  const [citas,   setCitas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState({ text: '', type: 'success' });

  const cargar = (f) => {
    setLoading(true);
    api.get(`/consultorio/agenda?fecha=${f}`)
      .then(r => setCitas(r?.data ?? []))
      .catch(() => setCitas([]))
      .finally(() => setLoading(false));
  };

  // Inicializar con la fecha local del cliente (no SSR) para evitar diferencia UTC
  useEffect(() => { if (!fecha) setFecha(fmtISO(new Date())); }, [fecha]);
  useEffect(() => { if (fecha) cargar(fecha); }, [fecha]);

  const irDia = (delta) => {
    const d = new Date(`${fecha}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setFecha(fmtISO(d));
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/consultorio/citas/${id}/estado`, { estado });
      setMsg({ text: `Cita marcada como ${estado}.`, type: 'success' });
      cargar(fecha);
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const cancelarCita = async (id) => {
    if (!confirm('¿Cancelar esta cita? El paciente será notificado.')) return;
    try {
      await api.patch(`/consultorio/citas/${id}/cancelar`);
      setMsg({ text: 'Cita cancelada.', type: 'warning' });
      cargar(fecha);
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const hoyLocal = fmtISO(new Date());
  const esHoy = fecha === hoyLocal;

  const STATS = [
    { label: 'Total',       value: citas.length,                                        color: 'var(--bb-p)', bg: 'rgba(var(--bb-p-rgb),.1)', icon: 'bi-calendar3' },
    { label: 'Confirmadas', value: citas.filter(c => c.estado === 'confirmada').length, color: '#16a34a',     bg: 'rgba(22,163,74,.1)',        icon: 'bi-check2-circle' },
    { label: 'Pendientes',  value: citas.filter(c => c.estado === 'pendiente').length,  color: '#d97706',     bg: 'rgba(217,119,6,.1)',         icon: 'bi-hourglass-split' },
    { label: 'Completadas', value: citas.filter(c => c.estado === 'completada').length, color: '#64748b',     bg: 'rgba(100,116,139,.1)',       icon: 'bi-check2-all' },
  ];

  return (
    <>
      {/* Encabezado con navegación de días */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-0">Agenda</h3>
          <p className="text-muted mb-0 small">{fmtLarg(fecha)}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => irDia(-1)}>
            <i className="bi bi-chevron-left" />
          </button>
          <div className="input-group input-group-sm" style={{ width: 170 }}>
            <input type="date" className="form-control text-center"
              value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => irDia(1)}>
            <i className="bi bi-chevron-right" />
          </button>
          {!esHoy && (
            <button className="btn btn-outline-primary btn-sm" onClick={() => setFecha(hoyLocal)}>
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {STATS.map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: 40, height: 40, background: s.bg }}>
                  <i className={`bi ${s.icon}`} style={{ fontSize: '1.1rem', color: s.color }} />
                </div>
                <div>
                  <div className="fw-bold fs-4 lh-1">{s.value}</div>
                  <div className="text-muted" style={{ fontSize: '.75rem' }}>{s.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

      {/* Citas */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3 px-4">
          <h6 className="fw-semibold mb-0">Citas del día</h6>
          <p className="text-muted small mb-0">Usa las flechas para navegar entre días</p>
        </div>
        <div className="card-body p-0">
          {loading ? <div className="p-4"><LoadingSpinner /></div> : citas.length === 0 ? (
            <div className="text-center py-5 px-3">
              <i className="bi bi-calendar-x text-muted d-block mb-2" style={{ fontSize: '2rem' }} />
              <p className="text-muted mb-1 small">No hay citas agendadas para este día.</p>
              <p className="text-muted small mb-0">Usa las flechas para ver otros días.</p>
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {citas.map(c => {
                const es = ESTADO_COLOR[c.estado] ?? ESTADO_COLOR.pendiente;
                return (
                  <li key={c.id} className="list-group-item px-4 py-3">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">

                      <div className="d-flex align-items-center gap-3">
                        {/* Hora visual */}
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
                          {c.paciente?.user?.email && (
                            <div className="text-muted" style={{ fontSize: '.75rem' }}>
                              <i className="bi bi-envelope me-1" />{c.paciente.user.email}
                            </div>
                          )}
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
                      <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
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

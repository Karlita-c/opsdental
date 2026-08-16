'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fmtISO, fmtFechaLarga as fmtLarg } from '@/lib/utils';
import { ESTADO_COLOR } from '@/lib/constants';
import NuevaCitaModal from './NuevaCitaModal';

// Badge compacto del estado del anticipo
function DepositoBadge({ cita }) {
  if (!cita.deposito_monto || parseFloat(cita.deposito_monto) <= 0) return null;
  const monto = parseFloat(cita.deposito_monto).toFixed(2);

  const cfg = {
    pagado:           { label: `💰 $${monto}`, cls: 'text-bg-success' },
    pendiente:        { label: `⏳ $${monto} pen.`, cls: 'text-bg-warning text-dark' },
    retenido:         { label: `🔒 $${monto} retenido`, cls: 'text-bg-danger' },
    retenido_parcial: { label: `⚠️ parcial`, cls: 'text-bg-warning text-dark' },
    devuelto:         { label: `↩ devuelto`, cls: 'text-bg-secondary' },
  };
  const c = cfg[cita.deposito_estado] ?? { label: `$${monto}`, cls: 'text-bg-secondary' };
  return <span className={`badge ${c.cls}`} style={{ fontSize: '.65rem' }}>{c.label}</span>;
}

// Countdown para citas reservadas (slot bloqueado esperando pago)
function CountdownReservada({ expiresAt }) {
  const [segs, setSegs] = useState(() => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)));

  useEffect(() => {
    if (segs <= 0) return;
    const t = setInterval(() => setSegs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [segs]);

  if (segs <= 0) return <span className="badge text-bg-danger" style={{ fontSize: '.65rem' }}>Expirada</span>;

  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return (
    <span className="badge text-bg-warning text-dark" style={{ fontSize: '.65rem' }}>
      ⏱ {m}:{String(s).padStart(2, '0')} para pagar
    </span>
  );
}

export default function AgendaPage() {
  const [fecha,      setFecha]      = useState('');
  const [citas,      setCitas]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState({ text: '', type: 'success' });
  const [modalOpen,  setModalOpen]  = useState(false);

  const cargar = useCallback((f) => {
    setLoading(true);
    api.get(`/consultorio/agenda?fecha=${f}`)
      .then(r => setCitas(r?.data ?? []))
      .catch(() => setCitas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!fecha) setFecha(fmtISO(new Date())); }, [fecha]);
  useEffect(() => { if (fecha) cargar(fecha); }, [fecha, cargar]);

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
      setMsg({ text: err.response?.data?.message || err.message, type: 'danger' });
    }
  };

  const cancelarCita = async (id) => {
    if (!confirm('¿Cancelar esta cita? El paciente será notificado.')) return;
    try {
      await api.patch(`/consultorio/citas/${id}/cancelar`);
      setMsg({ text: 'Cita cancelada.', type: 'warning' });
      cargar(fecha);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || err.message, type: 'danger' });
    }
  };

  const retenerDeposito = async (id) => {
    if (!confirm('¿Retener el anticipo? Úsalo solo en caso de no-show o cancelación tardía.')) return;
    try {
      await api.patch(`/consultorio/citas/${id}/deposito/retener`);
      setMsg({ text: 'Anticipo retenido.', type: 'warning' });
      cargar(fecha);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || err.message, type: 'danger' });
    }
  };

  const devolverDeposito = async (id) => {
    if (!confirm('¿Devolver el anticipo completo al paciente?')) return;
    try {
      await api.patch(`/consultorio/citas/${id}/deposito/devolver`);
      setMsg({ text: 'Anticipo devuelto al paciente.', type: 'success' });
      cargar(fecha);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || err.message, type: 'danger' });
    }
  };

  const hoyLocal = fmtISO(new Date());
  const esHoy    = fecha === hoyLocal;

  const citasActivas   = citas.filter(c => c.estado !== 'reservada');
  const citasReservadas = citas.filter(c => c.estado === 'reservada');

  const STATS = [
    { label: 'Total',         value: citasActivas.length,                                          color: 'var(--bb-p)', bg: 'rgba(var(--bb-p-rgb),.1)', icon: 'bi-calendar3' },
    { label: 'Confirmadas',   value: citasActivas.filter(c => c.estado === 'confirmada').length,   color: '#16a34a',     bg: 'rgba(22,163,74,.1)',        icon: 'bi-check2-circle' },
    { label: 'Pendientes',    value: citasActivas.filter(c => c.estado === 'pendiente').length,    color: '#d97706',     bg: 'rgba(217,119,6,.1)',         icon: 'bi-hourglass-split' },
    { label: 'Completadas',   value: citasActivas.filter(c => c.estado === 'completada').length,   color: '#64748b',     bg: 'rgba(100,116,139,.1)',       icon: 'bi-check2-all' },
  ];

  return (
    <>
      <NuevaCitaModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreada={(f) => { setMsg({ text: 'Cita creada correctamente.', type: 'success' }); cargar(f); }}
        fechaInicial={fecha}
      />

      {/* Encabezado */}
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
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setModalOpen(true)}>
            <i className="bi bi-plus-lg" />
            Nueva cita
          </button>
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

      {/* Slots esperando pago */}
      {citasReservadas.length > 0 && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderLeft: '3px solid #7c3aed' }}>
          <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center gap-2">
            <i className="bi bi-lock-fill" style={{ color: '#7c3aed' }} />
            <div>
              <h6 className="fw-semibold mb-0">Slots en espera de pago ({citasReservadas.length})</h6>
              <p className="text-muted small mb-0">El paciente tiene 30 min para pagar el anticipo. Si no paga, el slot se libera automáticamente.</p>
            </div>
          </div>
          <ul className="list-group list-group-flush">
            {citasReservadas.map(c => (
              <li key={c.id} className="list-group-item px-4 py-3">
                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{ width: 52, height: 52, background: 'rgba(124,58,237,.1)' }}>
                      <div className="text-center" style={{ color: '#7c3aed' }}>
                        <div className="fw-bold lh-1" style={{ fontSize: '.9rem' }}>{c.hora_inicio}</div>
                        <div style={{ fontSize: '.68rem' }}>{c.hora_fin}</div>
                      </div>
                    </div>
                    <div>
                      <div className="fw-semibold small">{c.paciente?.user?.name}</div>
                      <div className="text-muted" style={{ fontSize: '.78rem' }}>{c.tratamiento?.nombre}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {c.deposito_expires_at && <CountdownReservada expiresAt={c.deposito_expires_at} />}
                    <DepositoBadge cita={c} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citas del día */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3 px-4">
          <h6 className="fw-semibold mb-0">Citas del día</h6>
          <p className="text-muted small mb-0">Usa las flechas para navegar entre días</p>
        </div>
        <div className="card-body p-0">
          {loading ? <div className="p-4"><LoadingSpinner /></div> : citasActivas.length === 0 ? (
            <div className="text-center py-5 px-3">
              <i className="bi bi-calendar-x text-muted d-block mb-2" style={{ fontSize: '2rem' }} />
              <p className="text-muted mb-1 small">No hay citas agendadas para este día.</p>
              <p className="text-muted small mb-0">Usa las flechas para ver otros días.</p>
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {citasActivas.map(c => {
                const es = ESTADO_COLOR[c.estado] ?? ESTADO_COLOR.pendiente;
                const tieneAnticipoPagado = c.deposito_estado === 'pagado' && parseFloat(c.deposito_monto ?? 0) > 0;

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
                          {/* Badge de anticipo */}
                          <div className="mt-1 d-flex gap-1 flex-wrap">
                            <DepositoBadge cita={c} />
                          </div>
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
                        {['pendiente', 'confirmada'].includes(c.estado) && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => cancelarCita(c.id)}>
                            <i className="bi bi-x-circle me-1" />Cancelar
                          </button>
                        )}

                        {/* Acciones de anticipo */}
                        {tieneAnticipoPagado && ['pendiente', 'confirmada'].includes(c.estado) && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            title="No-show: retener anticipo"
                            onClick={() => retenerDeposito(c.id)}
                          >
                            <i className="bi bi-lock-fill me-1" />No-show
                          </button>
                        )}
                        {tieneAnticipoPagado && c.estado === 'completada' && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            title="Devolver anticipo al paciente"
                            onClick={() => devolverDeposito(c.id)}
                          >
                            <i className="bi bi-arrow-return-left me-1" />Devolver
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

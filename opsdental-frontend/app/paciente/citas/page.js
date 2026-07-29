'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fmtFecha } from '@/lib/utils';

const Stars = ({ value, onChange }) => (
  <div className="d-flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" className="btn p-0 border-0 lh-1"
        onClick={() => onChange(n)}
        style={{ fontSize: '1.5rem', color: n <= value ? '#f59e0b' : '#d1d5db' }}>
        {n <= value ? '★' : '☆'}
      </button>
    ))}
  </div>
);

export default function MisCitasPage() {
  const [citas,   setCitas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('proximas');
  const [msg,     setMsg]     = useState({ text: '', type: 'info' });

  // Calificar
  const [calForm,    setCalForm]    = useState({});   // { [citaId]: { calificacion, comentario } }
  const [calSaving,  setCalSaving]  = useState(null);

  // Reagendar
  const [reaId,      setReaId]      = useState(null);
  const [reaFecha,   setReaFecha]   = useState('');
  const [slots,      setSlots]      = useState([]);
  const [slotsLoad,  setSlotsLoad]  = useState(false);
  const [reaHora,    setReaHora]    = useState('');
  const [reaSaving,  setReaSaving]  = useState(false);

  const cargar = () => {
    setLoading(true);
    api.get('/citas').then(r => setCitas(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const { proximas, historial } = useMemo(() => ({
    proximas:  citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado)),
    historial: citas.filter(c => ['completada', 'cancelada'].includes(c.estado)),
  }), [citas]);

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await api.patch(`/citas/${id}/cancelar`);
      setMsg({ text: 'Cita cancelada.', type: 'success' });
      cargar();
    } catch (e) { setMsg({ text: e.message, type: 'danger' }); }
  };

  // ── Calificar ──
  const initCal  = (id) => setCalForm(f => ({ ...f, [id]: { calificacion: 0, comentario_calificacion: '' } }));
  const cancelCal = (id) => setCalForm(f => { const n = { ...f }; delete n[id]; return n; });

  const enviarCalificacion = async (cita) => {
    const form = calForm[cita.id];
    if (!form?.calificacion) { setMsg({ text: 'Selecciona una calificación (1–5 estrellas).', type: 'danger' }); return; }
    setCalSaving(cita.id);
    try {
      await api.post(`/citas/${cita.id}/calificar`, form);
      setMsg({ text: 'Calificación enviada. ¡Gracias!', type: 'success' });
      cancelCal(cita.id);
      cargar();
    } catch (e) { setMsg({ text: e.response?.data?.message ?? e.message, type: 'danger' }); }
    finally { setCalSaving(null); }
  };

  // ── Reagendar ──
  const abrirReagendar = (id) => { setReaId(id); setReaFecha(''); setSlots([]); setReaHora(''); };
  const cerrarReagendar = () => { setReaId(null); setSlots([]); };

  const buscarSlots = async () => {
    const cita = citas.find(c => c.id === reaId);
    if (!reaFecha || !cita) return;
    setSlotsLoad(true); setSlots([]); setReaHora('');
    try {
      const { data } = await api.get(
        `/disponibilidad?consultorio_id=${cita.consultorio_id}&tratamiento_id=${cita.tratamiento_id}&fecha=${reaFecha}`
      );
      setSlots(data.slots ?? []);
    } catch { setSlots([]); }
    finally { setSlotsLoad(false); }
  };

  const confirmarReagendar = async () => {
    if (!reaHora) return;
    setReaSaving(true);
    try {
      await api.patch(`/citas/${reaId}/reagendar`, { fecha: reaFecha, hora_inicio: reaHora });
      setMsg({ text: 'Cita reagendada correctamente.', type: 'success' });
      cerrarReagendar();
      cargar();
    } catch (e) { setMsg({ text: e.response?.data?.message ?? e.message, type: 'danger' }); }
    finally { setReaSaving(false); }
  };

  const vista = tab === 'proximas' ? proximas : historial;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-0">Mis citas</h3>
          <p className="text-muted mb-0 small">Gestiona tus citas dentales</p>
        </div>
        <Link className="btn btn-primary d-flex align-items-center gap-2" href="/paciente/consultorios">
          <i className="bi bi-plus-lg" /> Nueva cita
        </Link>
      </div>

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'info' })} />

      {/* Modal reagendar */}
      {reaId && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reagendar cita</h5>
                <button className="btn-close" onClick={cerrarReagendar} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium small">Nueva fecha</label>
                  <div className="d-flex gap-2">
                    <input type="date" className="form-control" value={reaFecha}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setReaFecha(e.target.value); setSlots([]); setReaHora(''); }} />
                    <button className="btn btn-outline-primary flex-shrink-0" onClick={buscarSlots}
                      disabled={!reaFecha || slotsLoad}>
                      {slotsLoad ? <span className="spinner-border spinner-border-sm" /> : 'Buscar'}
                    </button>
                  </div>
                </div>

                {slots.length > 0 && (
                  <div>
                    <label className="form-label fw-medium small">Horario disponible</label>
                    <div className="d-flex flex-wrap gap-2">
                      {slots.filter(s => s.disponible).map(s => (
                        <button key={s.hora_inicio} type="button"
                          className={`btn btn-sm ${reaHora === s.hora_inicio ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setReaHora(s.hora_inicio)}>
                          {s.hora_inicio}
                        </button>
                      ))}
                    </div>
                    {slots.every(s => !s.disponible) && (
                      <p className="text-muted small mb-0 mt-2">No hay horarios disponibles para esa fecha.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={cerrarReagendar}>Cancelar</button>
                <button className="btn btn-primary" onClick={confirmarReagendar}
                  disabled={!reaHora || reaSaving}>
                  {reaSaving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Confirmar reagendado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner /> : citas.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
              style={{ width: 72, height: 72, background: 'rgba(var(--bb-primary-rgb),.1)' }}>
              <i className="bi bi-calendar-x" style={{ fontSize: '2rem', color: 'var(--bb-primary)' }} />
            </div>
            <h5 className="fw-semibold mb-2">Aún no tienes citas</h5>
            <p className="text-muted mb-4">Comunícate con tu consultorio para agendar tu primera cita.</p>
            <Link className="btn btn-primary px-4" href="/paciente/consultorios">
              <i className="bi bi-building me-2" />Ver mi consultorio
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex gap-2 mb-4">
            {[
              { key: 'proximas',  label: 'Próximas',  count: proximas.length,  icon: 'bi-calendar-check' },
              { key: 'historial', label: 'Historial', count: historial.length, icon: 'bi-clock-history'  },
            ].map(t => (
              <button key={t.key}
                className={`btn rounded-pill d-flex align-items-center gap-2 ${tab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setTab(t.key)}>
                <i className={`bi ${t.icon}`} />{t.label}
                <span className={`badge rounded-pill ${tab === t.key ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary-emphasis'}`}
                  style={{ fontSize: '.65rem' }}>{t.count}</span>
              </button>
            ))}
          </div>

          {vista.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-muted">
                <i className={`bi ${tab === 'proximas' ? 'bi-calendar-check' : 'bi-clock-history'} d-block mb-2`} style={{ fontSize: '2rem' }} />
                {tab === 'proximas' ? 'No tienes citas próximas.' : 'Tu historial de citas aparecerá aquí.'}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {vista.map(c => (
                <div key={c.id} className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
                      <div className="d-flex align-items-start gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                          style={{ width: 44, height: 44, background: 'rgba(var(--bb-primary-rgb),.1)' }}>
                          <i className="bi bi-tooth text-primary" />
                        </div>
                        <div>
                          <div className="fw-bold">{c.tratamiento?.nombre}</div>
                          <div className="text-muted small">{c.consultorio?.nombre}</div>
                          <div className="text-muted small mt-1 d-flex align-items-center gap-2 flex-wrap">
                            <span className="d-flex align-items-center gap-1"><i className="bi bi-calendar3" />{fmtFecha(c.fecha)}</span>
                            <span className="d-flex align-items-center gap-1"><i className="bi bi-clock" />{c.hora_inicio}</span>
                            <span className="d-flex align-items-center gap-1"><i className="bi bi-stopwatch" />{c.tratamiento?.duracion_minutos} min</span>
                          </div>
                          {c.notas && (
                            <div className="text-muted small fst-italic mt-1">
                              <i className="bi bi-chat-left-text me-1" />{c.notas}
                            </div>
                          )}
                          {/* Calificación enviada */}
                          {c.calificacion && (
                            <div className="mt-2 small text-warning">
                              {'★'.repeat(c.calificacion)}{'☆'.repeat(5 - c.calificacion)}
                              {c.comentario_calificacion && (
                                <span className="text-muted ms-2 fst-italic">"{c.comentario_calificacion}"</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap justify-content-end">
                        <AppBadge text={c.estado} />
                        {['pendiente', 'confirmada'].includes(c.estado) && (<>
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => abrirReagendar(c.id)}>
                            <i className="bi bi-calendar-event me-1" />Reagendar
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => cancelar(c.id)}>
                            <i className="bi bi-x-circle me-1" />Cancelar
                          </button>
                        </>)}
                        {c.estado === 'completada' && !c.calificacion && !calForm[c.id] && (
                          <button className="btn btn-outline-warning btn-sm" onClick={() => initCal(c.id)}>
                            <i className="bi bi-star me-1" />Calificar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formulario de calificación inline */}
                    {calForm[c.id] && (
                      <div className="mt-3 pt-3 border-top">
                        <p className="small fw-semibold mb-2">¿Cómo fue tu experiencia?</p>
                        <Stars value={calForm[c.id].calificacion} onChange={v => setCalForm(f => ({ ...f, [c.id]: { ...f[c.id], calificacion: v } }))} />
                        <textarea
                          className="form-control mt-2"
                          rows={2}
                          placeholder="Comentario (opcional)"
                          maxLength={500}
                          value={calForm[c.id].comentario_calificacion}
                          onChange={e => setCalForm(f => ({ ...f, [c.id]: { ...f[c.id], comentario_calificacion: e.target.value } }))}
                        />
                        <div className="d-flex gap-2 mt-2">
                          <button className="btn btn-warning btn-sm fw-medium" onClick={() => enviarCalificacion(c)}
                            disabled={calSaving === c.id}>
                            {calSaving === c.id ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                            Enviar calificación
                          </button>
                          <button className="btn btn-link btn-sm text-muted" onClick={() => cancelCal(c.id)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

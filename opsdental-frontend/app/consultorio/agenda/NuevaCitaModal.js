'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtISO } from '@/lib/utils';

const EMPTY = { paciente_id: '', tratamiento_id: '', fecha: '', slot: '', notas: '' };

export default function NuevaCitaModal({ show, onClose, onCreada, fechaInicial }) {
  const [pacientes,    setPacientes]    = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [slots,        setSlots]        = useState([]);
  const [form,         setForm]         = useState(EMPTY);
  const [loadSlots,    setLoadSlots]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!show) return;
    setForm({ ...EMPTY, fecha: fechaInicial || fmtISO(new Date()) });
    setSlots([]);
    setError('');
    Promise.all([
      api.get('/consultorio/mis-pacientes'),
      api.get('/tratamientos'),
    ]).then(([p, t]) => {
      setPacientes(p.data ?? []);
      setTratamientos((t.data ?? []).filter(t => t.activo));
    }).catch(() => {});
  }, [show, fechaInicial]);

  useEffect(() => {
    if (!form.tratamiento_id || !form.fecha) { setSlots([]); return; }
    setLoadSlots(true);
    setForm(f => ({ ...f, slot: '' }));
    api.get(`/consultorio/slots?fecha=${form.fecha}&tratamiento_id=${form.tratamiento_id}`)
      .then(r => setSlots(r.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadSlots(false));
  }, [form.tratamiento_id, form.fecha]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.slot) { setError('Selecciona un horario disponible.'); return; }
    setError('');
    setSaving(true);
    try {
      await api.post('/consultorio/citas', {
        paciente_id:    parseInt(form.paciente_id),
        tratamiento_id: parseInt(form.tratamiento_id),
        fecha:          form.fecha,
        hora_inicio:    form.slot,
        notas:          form.notas || undefined,
      });
      onCreada(form.fecha);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear la cita.');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const slotLibres = slots.filter(s => s.disponible);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.45)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-bottom py-3 px-4">
            <h6 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-calendar-plus text-primary" />
              Nueva cita
            </h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={submit}>
            <div className="modal-body px-4 py-3 d-flex flex-column gap-3">

              {error && (
                <div className="alert alert-danger py-2 mb-0 small">{error}</div>
              )}

              {/* Paciente */}
              <div>
                <label className="form-label fw-medium small mb-1">Paciente</label>
                <select name="paciente_id" className="form-select form-select-sm" value={form.paciente_id} onChange={handle} required>
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tratamiento */}
              <div>
                <label className="form-label fw-medium small mb-1">Tratamiento</label>
                <select name="tratamiento_id" className="form-select form-select-sm" value={form.tratamiento_id} onChange={handle} required>
                  <option value="">Seleccionar tratamiento…</option>
                  {tratamientos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} · {t.duracion_minutos} min</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="form-label fw-medium small mb-1">Fecha</label>
                <input
                  name="fecha"
                  type="date"
                  className="form-control form-control-sm"
                  value={form.fecha}
                  min={fmtISO(new Date())}
                  onChange={handle}
                  required
                />
              </div>

              {/* Horarios disponibles */}
              {form.tratamiento_id && form.fecha && (
                <div>
                  <label className="form-label fw-medium small mb-1">
                    Horario disponible
                    {loadSlots && <span className="spinner-border spinner-border-sm ms-2" />}
                  </label>

                  {!loadSlots && slots.length === 0 && (
                    <p className="text-muted small mb-0">Sin horarios configurados para ese día.</p>
                  )}

                  {!loadSlots && slotLibres.length === 0 && slots.length > 0 && (
                    <p className="text-muted small mb-0">Todos los horarios de ese día están ocupados.</p>
                  )}

                  {slotLibres.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {slotLibres.map(s => (
                        <button
                          key={s.hora_inicio}
                          type="button"
                          className={`btn btn-sm ${form.slot === s.hora_inicio ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setForm(f => ({ ...f, slot: s.hora_inicio }))}
                        >
                          {s.hora_inicio}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="form-label fw-medium small mb-1">Notas <span className="text-muted">(opcional)</span></label>
                <textarea
                  name="notas"
                  className="form-control form-control-sm"
                  rows={2}
                  maxLength={500}
                  value={form.notas}
                  onChange={handle}
                  placeholder="Instrucciones previas, observaciones…"
                />
              </div>

            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2" disabled={saving || !form.slot}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm" /> Guardando…</>
                  : <><i className="bi bi-check2" /> Crear cita</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

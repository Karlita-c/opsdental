'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AppModal from '@/components/ui/AppModal';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DIAS } from '@/lib/constants';

const BLANK = { dia_semana: 'lunes', hora_inicio: '09:00', hora_fin: '18:00' };

export default function HorariosPage() {
  const [lista,   setLista]   = useState([]);
  const [form,    setForm]    = useState(BLANK);
  const [editId,  setEditId]  = useState(null);
  const [msg,     setMsg]     = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(true);

  const cargar   = () => api.get('/horarios').then(r => setLista(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { cargar(); }, []);

  const handle   = e  => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const resetForm = () => { setForm(BLANK); setEditId(null); };

  const abrirDia = (dia) => {
    const existente = lista.find(h => h.dia_semana === dia.key);
    if (existente) {
      setForm(existente);
      setEditId(existente.id);
    } else {
      setForm({ ...BLANK, dia_semana: dia.key });
      setEditId(null);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      editId
        ? await api.put(`/horarios/${editId}`, form)
        : await api.post('/horarios', form);
      setMsg({ text: 'Horario guardado correctamente.', type: 'success' });
      resetForm();
      cargar();
      document.getElementById('modalHorario')?.querySelector('[data-bs-dismiss]')?.click();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/horarios/${id}`);
      setMsg({ text: 'Horario eliminado.', type: 'success' });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const totalHoras = (h) => {
    const [hi, mi] = h.hora_inicio.split(':').map(Number);
    const [hf, mf] = h.hora_fin.split(':').map(Number);
    const mins = (hf * 60 + mf) - (hi * 60 + mi);
    return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}min` : ''}`.trim() : '';
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Horarios de atención</h3>
          <p className="text-muted mb-0 small">
            Configura los días y horas en que recibes pacientes.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          data-bs-toggle="modal"
          data-bs-target="#modalHorario"
          onClick={resetForm}
        >
          <i className="bi bi-plus-lg" /> Agregar horario
        </button>
      </div>

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Vista semanal en cards */}
          <div className="row g-3 mb-4">
            {DIAS.map(dia => {
              const h = lista.find(x => x.dia_semana === dia.key);
              return (
                <div key={dia.key} className="col-6 col-sm-4 col-md-3 col-xl">
                  <div
                    className={`card border-0 shadow-sm h-100 ${h ? '' : 'border-dashed'}`}
                    style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
                    data-bs-toggle="modal"
                    data-bs-target="#modalHorario"
                    onClick={() => abrirDia(dia)}
                  >
                    <div className="card-body p-3 d-flex flex-column align-items-center text-center gap-2">
                      <div
                        className="rounded-2 d-flex align-items-center justify-content-center fw-bold small flex-shrink-0"
                        style={{
                          width: 36, height: 36,
                          background: h ? 'rgba(var(--bb-primary-rgb),.12)' : 'rgba(var(--bs-secondary-rgb),.08)',
                          color: h ? 'var(--bb-primary)' : 'var(--bs-secondary-color)',
                        }}
                      >
                        {dia.label.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="fw-semibold small">{dia.label}</div>

                      {h ? (
                        <>
                          <div className="text-muted" style={{ fontSize: '.72rem', lineHeight: 1.4 }}>
                            {h.hora_inicio} – {h.hora_fin}
                          </div>
                          <div className="badge text-bg-success" style={{ fontSize: '.65rem' }}>
                            {totalHoras(h)}
                          </div>
                        </>
                      ) : (
                        <div className="text-muted" style={{ fontSize: '.72rem' }}>Sin horario</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla detalle */}
          {lista.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <h6 className="fw-bold mb-0">Detalle de horarios</h6>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Día</th>
                      <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Apertura</th>
                      <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cierre</th>
                      <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Duración</th>
                      <th className="py-3 pe-4 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...lista].sort((a, b) =>
                      DIAS.findIndex(d => d.key === a.dia_semana) - DIAS.findIndex(d => d.key === b.dia_semana)
                    ).map(h => {
                      const diaLabel = DIAS.find(d => d.key === h.dia_semana)?.label ?? h.dia_semana;
                      return (
                        <tr key={h.id}>
                          <td className="px-4 fw-semibold">{diaLabel}</td>
                          <td>{h.hora_inicio}</td>
                          <td>{h.hora_fin}</td>
                          <td>
                            <span className="badge text-bg-success">{totalHoras(h)}</span>
                          </td>
                          <td className="pe-4">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                data-bs-toggle="modal"
                                data-bs-target="#modalHorario"
                                onClick={() => { setForm(h); setEditId(h.id); }}
                              >
                                <i className="bi bi-pencil me-1" />Editar
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => eliminar(h.id)}
                              >
                                <i className="bi bi-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {lista.length === 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 mx-auto mb-4"
                  style={{ width: 64, height: 64, background: 'rgba(var(--bb-primary-rgb),.1)' }}
                >
                  <i className="bi bi-clock" style={{ fontSize: '1.75rem', color: 'var(--bb-primary)' }} />
                </div>
                <h5 className="fw-semibold mb-2">Sin horarios configurados</h5>
                <p className="text-muted mb-4">
                  Define los días y horas en que atiendes para que los pacientes puedan ver tu disponibilidad.
                </p>
                <button
                  className="btn btn-primary px-4"
                  data-bs-toggle="modal"
                  data-bs-target="#modalHorario"
                  onClick={resetForm}
                >
                  <i className="bi bi-plus-lg me-2" />Configurar primer horario
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AppModal
        id="modalHorario"
        title={editId ? 'Editar horario' : 'Nuevo horario'}
        footer={
          <>
            <button className="btn btn-secondary" data-bs-dismiss="modal" onClick={resetForm}>Cancelar</button>
            <button form="formHorario" type="submit" className="btn btn-primary">
              <i className="bi bi-check2 me-1" />Guardar
            </button>
          </>
        }
      >
        <form id="formHorario" onSubmit={guardar}>
          <div className="mb-3">
            <label className="form-label fw-medium">Día de la semana</label>
            <select name="dia_semana" className="form-select" value={form.dia_semana} onChange={handle}>
              {DIAS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fw-medium">Hora de apertura</label>
              <input name="hora_inicio" type="time" className="form-control" value={form.hora_inicio} onChange={handle} required />
            </div>
            <div className="col-6">
              <label className="form-label fw-medium">Hora de cierre</label>
              <input name="hora_fin" type="time" className="form-control" value={form.hora_fin} onChange={handle} required />
            </div>
          </div>
        </form>
      </AppModal>
    </>
  );
}

'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { fmtFechaCorta, fmtISO } from '@/lib/utils';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const EMPTY = {
  fecha_visita: '',
  diagnostico: '',
  tratamiento_realizado: '',
  observaciones: '',
};

export default function ExpedientePage({ params }) {
  const { id: pacienteId } = use(params);
  const router = useRouter();

  const [paciente,     setPaciente]     = useState(null);
  const [expedientes,  setExpedientes]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [form,         setForm]         = useState(EMPTY);
  const [editId,       setEditId]       = useState(null);   // null = nuevo, number = editar
  const [showForm,     setShowForm]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const [msg,          setMsg]          = useState({ text: '', type: 'success' });

  const cargar = async () => {
    try {
      const [pacRes, expRes] = await Promise.all([
        api.get(`/consultorio/pacientes/${pacienteId}`),
        api.get(`/consultorio/pacientes/${pacienteId}/expediente`),
      ]);
      setPaciente(pacRes.data.paciente);
      setExpedientes(expRes.data ?? []);
    } catch {
      setMsg({ text: 'No se pudo cargar el expediente.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [pacienteId]);

  const abrirNuevo = () => {
    setForm({ ...EMPTY, fecha_visita: fmtISO(new Date()) });
    setEditId(null);
    setErrors({});
    setShowForm(true);
  };

  const abrirEditar = (exp) => {
    setForm({
      fecha_visita:          exp.fecha_visita?.slice(0, 10) ?? '',
      diagnostico:           exp.diagnostico ?? '',
      tratamiento_realizado: exp.tratamiento_realizado ?? '',
      observaciones:         exp.observaciones ?? '',
    });
    setEditId(exp.id);
    setErrors({});
    setShowForm(true);
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditId(null);
    setErrors({});
  };

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editId) {
        await api.patch(`/consultorio/pacientes/${pacienteId}/expediente/${editId}`, form);
        setMsg({ text: 'Entrada actualizada correctamente.', type: 'success' });
      } else {
        await api.post(`/consultorio/pacientes/${pacienteId}/expediente`, form);
        setMsg({ text: 'Nueva entrada agregada al expediente.', type: 'success' });
      }
      cancelarForm();
      cargar();
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) {
        setErrors(err.errors);
      } else {
        setMsg({ text: err.message, type: 'danger' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Encabezado */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left" />
          </button>
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
            style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
            {(paciente?.name ?? 'P')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="fw-bold mb-0">Expediente clínico</h3>
            <p className="text-muted mb-0 small">
              {paciente?.name ?? '—'}
              {paciente?.email ? ` · ${paciente.email}` : ''}
            </p>
          </div>
        </div>
        {!showForm && (
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={abrirNuevo}>
            <i className="bi bi-plus-lg" /> Nueva entrada
          </button>
        )}
      </div>

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

      <div className="row g-4">

        {/* Formulario nuevo / editar */}
        {showForm && (
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">
                    <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-file-earmark-plus'} me-2 text-primary`} />
                    {editId ? 'Editar entrada' : 'Nueva entrada clínica'}
                  </h6>
                  <button className="btn btn-link btn-sm text-muted p-0" onClick={cancelarForm}>
                    <i className="bi bi-x-lg" />
                  </button>
                </div>

                <form onSubmit={guardar}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Fecha de visita <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date" name="fecha_visita"
                      className={`form-control ${errors.fecha_visita ? 'is-invalid' : ''}`}
                      value={form.fecha_visita} onChange={onChange} required
                    />
                    {errors.fecha_visita && <div className="invalid-feedback">{errors.fecha_visita[0]}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Diagnóstico <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="diagnostico" rows={3}
                      className={`form-control ${errors.diagnostico ? 'is-invalid' : ''}`}
                      placeholder="Describe el diagnóstico clínico..."
                      value={form.diagnostico} onChange={onChange} required
                    />
                    {errors.diagnostico && <div className="invalid-feedback">{errors.diagnostico[0]}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Tratamiento realizado <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="tratamiento_realizado" rows={3}
                      className={`form-control ${errors.tratamiento_realizado ? 'is-invalid' : ''}`}
                      placeholder="Describe el procedimiento realizado..."
                      value={form.tratamiento_realizado} onChange={onChange} required
                    />
                    {errors.tratamiento_realizado && <div className="invalid-feedback">{errors.tratamiento_realizado[0]}</div>}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-medium">Observaciones</label>
                    <textarea
                      name="observaciones" rows={2}
                      className={`form-control ${errors.observaciones ? 'is-invalid' : ''}`}
                      placeholder="Notas adicionales, alergias, indicaciones..."
                      value={form.observaciones} onChange={onChange}
                    />
                    {errors.observaciones && <div className="invalid-feedback">{errors.observaciones[0]}</div>}
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
                      {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                        : <><i className="bi bi-check2 me-1" />{editId ? 'Actualizar' : 'Guardar entrada'}</>
                      }
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelarForm}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Timeline de entradas */}
        <div className={showForm ? 'col-12 col-lg-7' : 'col-12'}>
          {expedientes.length === 0 && !showForm ? (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
              <div className="card-body text-center py-5 text-muted">
                <i className="bi bi-folder2-open d-block mb-2" style={{ fontSize: '2.5rem' }} />
                <p className="mb-1">Este paciente aún no tiene entradas en su expediente.</p>
                <button className="btn btn-primary btn-sm mt-2" onClick={abrirNuevo}>
                  <i className="bi bi-plus-lg me-1" /> Crear primera entrada
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {expedientes.map((exp, i) => (
                <div key={exp.id} className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
                  <div className="card-body p-4">

                    {/* Cabecera de la entrada */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded-2 bg-primary bg-opacity-10 flex-shrink-0"
                          style={{ width: 36, height: 36 }}>
                          <i className="bi bi-file-earmark-medical text-primary" />
                        </div>
                        <div>
                          <div className="fw-semibold small">
                            {fmtFechaCorta(exp.fecha_visita)}
                          </div>
                          <div className="text-muted" style={{ fontSize: '.72rem' }}>
                            Entrada #{expedientes.length - i}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => abrirEditar(exp)}
                        title="Editar entrada"
                      >
                        <i className="bi bi-pencil" />
                      </button>
                    </div>

                    {/* Diagnóstico */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-1 text-muted mb-1" style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        <i className="bi bi-stethoscope" /> Diagnóstico
                      </div>
                      <p className="mb-0 small">{exp.diagnostico}</p>
                    </div>

                    {/* Tratamiento */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-1 text-muted mb-1" style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        <i className="bi bi-bandaid" /> Tratamiento realizado
                      </div>
                      <p className="mb-0 small">{exp.tratamiento_realizado}</p>
                    </div>

                    {/* Observaciones */}
                    {exp.observaciones && (
                      <div className="p-3 rounded-3 bg-body-secondary">
                        <div className="d-flex align-items-center gap-1 text-muted mb-1" style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          <i className="bi bi-chat-left-text" /> Observaciones
                        </div>
                        <p className="mb-0 small text-muted fst-italic">{exp.observaciones}</p>
                      </div>
                    )}

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

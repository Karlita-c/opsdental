'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fmtFechaCorta as fmtFecha } from '@/lib/utils';

const BLANK = { name: '', email: '', telefono: '' };

export default function PacientesPage() {
  const router = useRouter();

  const [pacientes,   setPacientes]   = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [historial,   setHistorial]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingH,    setLoadingH]    = useState(false);

  // Formulario de invitación
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form,        setForm]        = useState(BLANK);
  const [guardando,   setGuardando]   = useState(false);
  const [link,        setLink]        = useState('');
  const [error,       setError]       = useState('');
  const [errores,     setErrores]     = useState({});

  const cargar = () => {
    setLoading(true);
    api.get('/consultorio/pacientes')
      .then(r => setPacientes(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const verHistorial = async (p) => {
    setSelected(p);
    setHistorial(null);
    setLoadingH(true);
    try {
      const { data } = await api.get(`/consultorio/pacientes/${p.id}`);
      setHistorial(data);
    } catch {
      setHistorial({ citas: [] });
    } finally {
      setLoadingH(false);
    }
  };

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const registrar = async (e) => {
    e.preventDefault();
    setGuardando(true); setError(''); setErrores({}); setLink('');
    try {
      const { data } = await api.post('/consultorio/pacientes/invitar', form);
      setLink(data.link_acceso);
      setForm(BLANK);
      cargar();
    } catch (err) {
      setError(err.message || 'No se pudo registrar al paciente.');
      setErrores(err.errors || {});
    } finally {
      setGuardando(false);
    }
  };

  const copiar = () => {
    navigator.clipboard.writeText(link);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-0">Pacientes</h3>
          <p className="text-muted mb-0 small">{pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} registrado{pacientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => { setMostrarForm(f => !f); setLink(''); setError(''); setErrores({}); }}
        >
          <i className={`bi ${mostrarForm ? 'bi-x-lg' : 'bi-person-plus-fill'}`} />
          {mostrarForm ? 'Cancelar' : 'Registrar paciente'}
        </button>
      </div>

      {/* Formulario de registro/invitación */}
      {mostrarForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-transparent border-bottom py-3 px-4">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-person-plus text-primary" /> Registrar nuevo paciente
            </h6>
          </div>
          <div className="card-body p-4">
            {link ? (
              /* Enlace generado */
              <div>
                <div className="alert alert-success d-flex align-items-start gap-2 mb-3">
                  <i className="bi bi-check-circle-fill flex-shrink-0 mt-1" />
                  <div>
                    <strong>Paciente registrado.</strong> Comparte este enlace para que acceda a la plataforma.
                    El enlace expira en <strong>7 días</strong>.
                  </div>
                </div>

                <div className="alert alert-info d-flex align-items-start gap-2 mb-3" style={{ fontSize: '.85rem' }}>
                  <i className="bi bi-whatsapp flex-shrink-0 mt-1 text-success" />
                  <span>
                    Puedes enviar este enlace directamente por <strong>WhatsApp</strong>, SMS o correo.
                    El paciente entra con un clic y queda vinculado a tu consultorio.
                  </span>
                </div>

                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={link}
                    readOnly
                    style={{ fontSize: '.82rem' }}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={copiar} title="Copiar enlace">
                    <i className="bi bi-clipboard" />
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Hola, aquí está tu enlace de acceso a OpsDental: ' + link)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success"
                    title="Enviar por WhatsApp"
                  >
                    <i className="bi bi-whatsapp" />
                  </a>
                </div>

                <button className="btn btn-outline-primary btn-sm" onClick={() => { setLink(''); setMostrarForm(true); }}>
                  <i className="bi bi-plus me-1" /> Registrar otro paciente
                </button>
              </div>
            ) : (
              /* Formulario */
              <form onSubmit={registrar}>
                <AppAlert type="danger" message={error} onClose={() => setError('')} />
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label fw-medium small">Nombre completo <span className="text-danger">*</span></label>
                    <input
                      name="name" type="text" required
                      className={`form-control ${errores.name ? 'is-invalid' : ''}`}
                      value={form.name} onChange={handle}
                      placeholder="Sofía Mondragón"
                    />
                    {errores.name && <div className="invalid-feedback">{errores.name[0]}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium small">Correo electrónico <span className="text-danger">*</span></label>
                    <input
                      name="email" type="email" required
                      className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                      value={form.email} onChange={handle}
                      placeholder="sofia@ejemplo.com"
                    />
                    {errores.email && <div className="invalid-feedback">{errores.email[0]}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium small">Teléfono <span className="text-muted">(opcional)</span></label>
                    <input
                      name="telefono" type="tel"
                      className="form-control"
                      value={form.telefono} onChange={handle}
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={guardando}>
                    {guardando
                      ? <><span className="spinner-border spinner-border-sm" /> Registrando…</>
                      : <><i className="bi bi-send" /> Registrar y generar enlace</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Lista de pacientes */}
        <div className={selected ? 'col-12 col-lg-5' : 'col-12'}>
          {pacientes.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-muted">
                <i className="bi bi-people d-block mb-2" style={{ fontSize: '2rem' }} />
                <p className="mb-2">Aún no hay pacientes registrados.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setMostrarForm(true)}>
                  <i className="bi bi-person-plus me-1" /> Registrar el primero
                </button>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
              <div className="list-group list-group-flush rounded-3">
                {pacientes.map(p => (
                  <button
                    key={p.id}
                    className={`list-group-item list-group-item-action px-4 py-3 border-0 ${selected?.id === p.id ? 'active' : ''}`}
                    onClick={() => verHistorial(p)}
                    style={{ borderRadius: 0 }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold flex-shrink-0 ${selected?.id === p.id ? 'bg-white text-primary' : 'bg-primary text-white'}`}
                        style={{ width: 40, height: 40 }}>
                        {(p.name ?? 'P')[0].toUpperCase()}
                      </div>
                      <div className="text-start min-w-0">
                        <div className="fw-semibold text-truncate">{p.name}</div>
                        <div className={`small text-truncate ${selected?.id === p.id ? 'opacity-75' : 'text-muted'}`}>{p.email}</div>
                      </div>
                      <div className="ms-auto text-end flex-shrink-0">
                        <div className="small fw-semibold">{p.total_citas} cita{p.total_citas !== 1 ? 's' : ''}</div>
                        <div className={`small ${selected?.id === p.id ? 'opacity-75' : 'text-muted'}`}>{fmtFecha(p.ultima_visita)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Historial del paciente seleccionado */}
        {selected && (
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0.875rem' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
                    style={{ width: 48, height: 48 }}>
                    {(selected.name ?? 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">{selected.name}</h6>
                    <p className="text-muted small mb-0">
                      {selected.email}
                      {selected.telefono && (
                        <>
                          {' · '}
                          <a
                            href={`https://wa.me/52${selected.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selected.name}, te contactamos desde ${''}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-success text-decoration-none"
                            title="Contactar por WhatsApp"
                          >
                            <i className="bi bi-whatsapp me-1" />{selected.telefono}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="ms-auto d-flex align-items-center gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => router.push(`/consultorio/pacientes/${selected.id}/expediente`)}
                      title="Ver expediente clínico"
                    >
                      <i className="bi bi-file-earmark-medical me-1" />Expediente
                    </button>
                    <button className="btn btn-link btn-sm text-muted p-0" onClick={() => setSelected(null)}>
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                </div>

                {loadingH ? <LoadingSpinner /> : historial?.citas?.length === 0 ? (
                  <p className="text-muted text-center small py-3 mb-0">Sin citas registradas.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {historial?.citas?.map(c => (
                      <div key={c.id} className="d-flex align-items-center gap-3 p-3 rounded-3 bg-body-secondary">
                        <div className="text-center" style={{ minWidth: '3.5rem' }}>
                          <div className="fw-bold small">{fmtFecha(c.fecha)}</div>
                          <div className="text-muted" style={{ fontSize: '.7rem' }}>{c.hora_inicio}</div>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-medium small text-truncate">{c.tratamiento?.nombre}</div>
                          {c.calificacion && (
                            <div className="text-warning small">
                              {'★'.repeat(c.calificacion)}{'☆'.repeat(5 - c.calificacion)}
                            </div>
                          )}
                        </div>
                        <AppBadge text={c.estado} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

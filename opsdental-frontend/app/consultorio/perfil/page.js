'use client';
import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppAlert from '@/components/ui/AppAlert';
import AppBadge from '@/components/ui/AppBadge';

export default function PerfilConsultorioPage() {
  const { user, setUser } = useAuth();
  const c = user?.consultorio ?? {};

  const [form, setForm] = useState({
    nombre:             c.nombre             ?? '',
    direccion:          c.direccion          ?? '',
    ciudad:             c.ciudad             ?? '',
    telefono:           c.telefono           ?? '',
    cedula_profesional: c.cedula_profesional ?? '',
    descripcion:        c.descripcion        ?? '',
  });
  const [msg,        setMsg]        = useState({ text: '', type: 'success' });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);

  // Logo
  const fileInputRef              = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoMsg,     setLogoMsg]     = useState({ text: '', type: 'success' });
  const [logoLoading, setLogoLoading] = useState(false);

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoMsg({ text: '', type: 'success' });
  };

  const subirLogo = async () => {
    if (!logoFile) return;
    setLogoLoading(true);
    setLogoMsg({ text: '', type: 'success' });
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const { data } = await api.post('/consultorio/logo', fd);
      setUser(u => ({ ...u, consultorio: { ...u.consultorio, foto: data.foto } }));
      setLogoFile(null);
      setLogoPreview(null);
      setLogoMsg({ text: 'Logo actualizado correctamente.', type: 'success' });
    } catch (err) {
      setLogoMsg({ text: err.message || 'Error al subir el logo.', type: 'danger' });
    } finally {
      setLogoLoading(false);
    }
  };

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMsg({ text: '', type: 'success' });
    try {
      const { data } = await api.patch('/consultorio/perfil', form);
      setUser(u => ({ ...u, consultorio: data }));
      setMsg({ text: 'Perfil actualizado correctamente.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
      setErrors(err.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const vence = c.membrecia?.fecha_vencimiento
    ? new Date(c.membrecia.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      <div className="mb-5">
        <h3 className="fw-bold mb-1">Perfil del consultorio</h3>
        <p className="text-muted mb-0">
          Esta información es visible para los pacientes que buscan consultorios en la plataforma.
        </p>
      </div>

      <div className="row g-4">

        {/* Formulario */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-building text-primary" />
                Datos del consultorio
              </h6>
            </div>
            <div className="card-body p-4">
              <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

              <form onSubmit={guardar}>
                {[
                  { name: 'nombre',             label: 'Nombre del consultorio', required: true  },
                  { name: 'direccion',          label: 'Dirección',              required: true  },
                  { name: 'ciudad',             label: 'Ciudad',                 required: true  },
                  { name: 'telefono',           label: 'Teléfono de contacto',   required: false },
                  { name: 'cedula_profesional', label: 'Cédula profesional',     required: false },
                ].map(f => (
                  <div key={f.name} className="mb-3">
                    <label className="form-label fw-medium">
                      {f.label}
                      {f.required && <span className="text-danger ms-1">*</span>}
                    </label>
                    <input
                      name={f.name}
                      type={f.name === 'telefono' ? 'tel' : 'text'}
                      className={`form-control ${errors[f.name] ? 'is-invalid' : ''}`}
                      value={form[f.name]}
                      onChange={handle}
                      required={f.required}
                    />
                    {errors[f.name] && <div className="invalid-feedback">{errors[f.name][0]}</div>}
                  </div>
                ))}

                <div className="mb-4">
                  <label className="form-label fw-medium">Descripción</label>
                  <textarea
                    name="descripcion"
                    className="form-control"
                    rows={3}
                    maxLength={500}
                    value={form.descripcion}
                    onChange={handle}
                  />
                  <div className="form-text">{form.descripcion.length}/500 caracteres</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm" /> Guardando…</>
                    : <><i className="bi bi-check2" /> Guardar cambios</>}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-lg-5 d-flex flex-column gap-4">

          {/* Logo del consultorio */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-image text-primary" />
                Logo del consultorio
              </h6>
            </div>
            <div className="card-body p-4">
              <AppAlert type={logoMsg.type} message={logoMsg.text} onClose={() => setLogoMsg({ text: '', type: 'success' })} />

              {/* Vista previa */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                  style={{ width: 88, height: 88, background: 'var(--bs-tertiary-bg)' }}
                >
                  {(logoPreview || c.foto) ? (
                    <img
                      src={logoPreview || c.foto}
                      alt="Logo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="bi bi-building text-muted" style={{ fontSize: '2rem' }} />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-upload" />
                    {c.foto ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  <p className="text-muted mb-0 mt-1" style={{ fontSize: '.72rem' }}>
                    JPG, PNG o WebP · Máx. 2 MB
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="d-none"
                onChange={onLogoChange}
              />

              {logoFile && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2 w-100"
                  onClick={subirLogo}
                  disabled={logoLoading}
                >
                  {logoLoading
                    ? <><span className="spinner-border spinner-border-sm" /> Subiendo…</>
                    : <><i className="bi bi-check2" /> Guardar logo</>}
                </button>
              )}
            </div>
          </div>

          {/* Membresía */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-award text-primary" />
                Membresía
              </h6>
            </div>
            <div className="card-body p-3">
              <ul className="list-unstyled mb-0">
                {[
                  { label: 'Plan',    value: <AppBadge text={c.membrecia?.plan ?? '—'} /> },
                  { label: 'Vence',   value: vence },
                  { label: 'Estado',  value: <AppBadge text={c.activo ? 'activo' : 'bloqueado'} variant={c.activo ? 'success' : 'danger'} /> },
                  { label: 'Límite',  value: c.membrecia?.limite_citas_mes ? `${c.membrecia.limite_citas_mes} citas/mes` : '—' },
                ].map(r => (
                  <li key={r.label} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">{r.label}</span>
                    <span className="fw-semibold small">{r.value}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted small mt-3 mb-0">
                Para cambiar de plan contacta al administrador de la plataforma.
              </p>
            </div>
          </div>

          {/* Cédula */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-primary" />
                Verificación profesional
              </h6>
            </div>
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                  style={{ width: 40, height: 40, background: 'rgba(22,163,74,.1)' }}
                >
                  <i className="bi bi-patch-check-fill text-success" />
                </div>
                <div>
                  <div className="small fw-semibold">Cédula profesional</div>
                  <div className="font-monospace text-muted small">{c.cedula_profesional ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

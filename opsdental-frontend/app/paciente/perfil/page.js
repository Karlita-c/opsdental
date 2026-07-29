'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import FormField from '@/components/ui/FormField';
import PasswordField from '@/components/ui/PasswordField';
import AppAlert from '@/components/ui/AppAlert';

export default function PerfilPacientePage() {
  const { user, setUser } = useAuth();

  const [form,    setForm]    = useState({ name: user?.name ?? '', telefono: user?.telefono ?? '' });
  const [pass,    setPass]    = useState({ current_password: '', password: '', password_confirmation: '' });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const handle = (setter) => (e) => setter(p => ({ ...p, [e.target.name]: e.target.value }));

  const request = async (payload) => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const { data } = await api.patch('/perfil', payload);
      if (data.id) setUser(data);
      setSuccess('Guardado correctamente.');
    } catch (err) {
      const msgs = err.errors;
      setError(msgs && Object.keys(msgs).length ? Object.values(msgs).flat()[0] : err.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const savePerfil = (e) => { e.preventDefault(); request({ name: form.name, telefono: form.telefono || null }); };

  const savePass = async (e) => {
    e.preventDefault();
    if (pass.password !== pass.password_confirmation) { setError('Las contraseñas no coinciden.'); return; }
    await request(pass);
    setPass({ current_password: '', password: '', password_confirmation: '' });
  };

  const initial = (user?.name ?? 'U')[0].toUpperCase();

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold fs-4 flex-shrink-0"
          style={{ width: 56, height: 56 }}>
          {initial}
        </div>
        <div>
          <h3 className="fw-bold mb-0">Mi perfil</h3>
          <p className="text-muted mb-0 small">{user?.email}</p>
        </div>
      </div>

      <AppAlert type="success" message={success} onClose={() => setSuccess('')} />
      <AppAlert type="danger"  message={error}   onClose={() => setError('')}   />

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '0.875rem' }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-person text-primary" /> Datos personales
              </h6>
              <form onSubmit={savePerfil}>
                <FormField label="Nombre completo" name="name"     required value={form.name}     onChange={handle(setForm)} />
                <div className="mb-3">
                  <label className="form-label fw-medium">Correo electrónico</label>
                  <input className="form-control bg-body-secondary" value={user?.email ?? ''} disabled readOnly />
                  <div className="form-text">El correo no puede cambiarse.</div>
                </div>
                <FormField label="Teléfono" name="telefono" value={form.telefono} onChange={handle(setForm)} />
                <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}Guardar cambios
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '0.875rem' }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock text-primary" /> Cambiar contraseña
              </h6>
              <form onSubmit={savePass}>
                <PasswordField label="Contraseña actual"          name="current_password"      required value={pass.current_password}      onChange={handle(setPass)} autoComplete="current-password" />
                <PasswordField label="Nueva contraseña"           name="password"              required value={pass.password}              onChange={handle(setPass)} />
                <PasswordField label="Confirmar nueva contraseña" name="password_confirmation" required value={pass.password_confirmation} onChange={handle(setPass)} />
                <button type="submit" className="btn btn-outline-primary w-100 fw-medium mt-1" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}Actualizar contraseña
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

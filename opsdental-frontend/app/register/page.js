'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppAlert from '@/components/ui/AppAlert';
import FormField from '@/components/ui/FormField';
import PasswordField from '@/components/ui/PasswordField';
import PrivacyPolicyModal from '@/components/ui/PrivacyPolicyModal';
import PublicLayout from '@/components/layout/PublicLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const REDIRECT = {
  consultorio: '/consultorio/dashboard',
};

const BLANK = {
  name: '', email: '', password: '', password_confirmation: '',
  telefono: '', nombre: '', direccion: '', ciudad: '', cedula_profesional: '',
};

function RegisterForm() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { setUser, user, loading: authLoading } = useAuth();

  const role = 'consultorio';
  const [form,       setForm]       = useState(BLANK);
  const [error,      setError]      = useState('');
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [acepto,     setAcepto]     = useState(false);

  // Redirige si ya hay sesión activa
  useEffect(() => {
    if (!authLoading && user) router.replace(REDIRECT[user.role] ?? '/');
  }, [user, authLoading, router]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!acepto) { setError('Debes aceptar la política de privacidad para continuar.'); return; }

    setError(''); setErrors({});
    setSubmitting(true);

    // Lee valores del DOM para capturar autofill del navegador
    const domValues = {};
    e.target.querySelectorAll('[name]').forEach(el => { domValues[el.name] = el.value; });

    const payload = { ...form, ...domValues, role };

    // Los campos de consultorio no se envían para paciente para evitar
    // que validaciones min:N fallen con valores vacíos
    if (role === 'paciente') {
      ['nombre', 'direccion', 'ciudad', 'cedula_profesional'].forEach(k => delete payload[k]);
    }

    try {
      const { data } = await api.post('/register', payload);
      localStorage.setItem('bb-token', data.token);
      setUser(data.user);
      router.push(REDIRECT[role] ?? '/consultorio/dashboard');
    } catch (err) {
      setError(err.message);
      setErrors(err.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <LoadingSpinner />;

  return (
    <PublicLayout>
      <div className="auth-bg d-flex align-items-start justify-content-center p-3 pt-4">
        <div className="card auth-card w-100" style={{ maxWidth: 540 }}>
          <div className="card-body p-4 p-sm-5">

            {/* Icono + título */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                style={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, var(--bb-primary), var(--bb-primary-dark))',
                  boxShadow: '0 6px 20px rgba(var(--bb-primary-rgb),.40)',
                }}
              >
                <i className="bi bi-person-plus-fill fs-3 text-white" />
              </div>
              <h5 className="fw-bold mb-1">Crear cuenta</h5>
              <p className="text-muted small mb-0">Completa los datos para registrarte en OpsDental.</p>
            </div>

            {/* Info para pacientes */}
            <div className="alert alert-info py-2 px-3 small d-flex align-items-start gap-2 mb-4">
              <i className="bi bi-person-heart flex-shrink-0 mt-1" />
              <span>
                <strong>¿Eres paciente?</strong> Tu consultorio te enviará un enlace personalizado de acceso.
                No necesitas registrarte aquí.
              </span>
            </div>

            <AppAlert type="danger" message={error} onClose={() => setError('')} />

            <form onSubmit={submit} noValidate>

              {/* ── Datos comunes ── */}
              <FormField
                label="Nombre completo"
                name="name"
                required
                errors={errors}
                value={form.name}
                onChange={handle}
                autoComplete="name"
              />
              <FormField
                label="Correo electrónico"
                name="email"
                type="email"
                required
                errors={errors}
                value={form.email}
                onChange={handle}
                autoComplete="email"
              />
              <PasswordField
                label="Contraseña"
                name="password"
                required
                errors={errors}
                value={form.password}
                onChange={handle}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirmar contraseña"
                name="password_confirmation"
                required
                errors={errors}
                value={form.password_confirmation}
                onChange={handle}
                autoComplete="new-password"
              />

              {/* ── Datos del consultorio ── */}
              {true && (
                <>
                  <hr className="my-3" />
                  <p className="text-muted small fw-semibold text-uppercase mb-3"
                    style={{ letterSpacing: '.06em', fontSize: '.7rem' }}>
                    Datos del consultorio
                  </p>

                  {/* Teléfono requerido para consultorio */}
                  <FormField
                    label="Teléfono de contacto"
                    name="telefono"
                    type="tel"
                    required
                    errors={errors}
                    value={form.telefono}
                    onChange={handle}
                    autoComplete="tel"
                  />
                  <FormField
                    label="Nombre del consultorio"
                    name="nombre"
                    required
                    errors={errors}
                    value={form.nombre}
                    onChange={handle}
                  />
                  <FormField
                    label="Dirección"
                    name="direccion"
                    required
                    errors={errors}
                    value={form.direccion}
                    onChange={handle}
                    autoComplete="street-address"
                  />
                  <FormField
                    label="Ciudad"
                    name="ciudad"
                    required
                    errors={errors}
                    value={form.ciudad}
                    onChange={handle}
                    autoComplete="address-level2"
                  />

                  {/* Verificación profesional */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Cédula profesional del titular
                      <span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      name="cedula_profesional"
                      type="text"
                      className={`form-control ${errors.cedula_profesional ? 'is-invalid' : ''}`}
                      value={form.cedula_profesional}
                      onChange={handle}
                      required
                      minLength={7}
                      maxLength={20}
                    />
                    {errors.cedula_profesional ? (
                      <div className="invalid-feedback">{errors.cedula_profesional[0]}</div>
                    ) : (
                      <div className="form-text">
                        <i className="bi bi-info-circle-fill me-1 text-primary" />
                        Número de cédula emitida por la SEP. Será verificado por el administrador antes de activar tu cuenta.
                      </div>
                    )}
                  </div>

                  {/* Aviso de activación */}
                  <div className="alert alert-info py-2 px-3 small d-flex align-items-start gap-2 mb-3">
                    <i className="bi bi-shield-check flex-shrink-0 mt-1" />
                    <span>
                      Tu cuenta quedará <strong>pendiente de verificación</strong>. El administrador revisará
                      tu cédula profesional y recibirás un correo con un enlace de acceso en un plazo de 24–48 horas.
                    </span>
                  </div>
                </>
              )}

              {/* ── Política de privacidad ── */}
              <div className="mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="checkPrivacidad"
                    checked={acepto}
                    onChange={e => setAcepto(e.target.checked)}
                    required
                  />
                  <label className="form-check-label small" htmlFor="checkPrivacidad">
                    He leído y acepto la{' '}
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 align-baseline text-primary fw-semibold"
                      data-bs-toggle="modal"
                      data-bs-target="#modalPrivacidad"
                    >
                      Política de Privacidad
                    </button>
                    {' '}de OpsDental.
                    <span className="text-danger ms-1">*</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2"
                disabled={submitting || !acepto}
                style={{ fontWeight: 600, letterSpacing: '.02em' }}
              >
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Creando cuenta…</>
                  : <><i className="bi bi-person-check-fill me-2" />Registrarse</>}
              </button>
            </form>

            <p className="text-center text-muted small mt-4 mb-0">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="fw-semibold text-primary text-decoration-none">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>

      <PrivacyPolicyModal />
    </PublicLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegisterForm />
    </Suspense>
  );
}


'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import AppAlert from '@/components/ui/AppAlert';
import PublicLayout from '@/components/layout/PublicLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { API_BASE } from '@/lib/api';

const REDIRECT = {
  paciente:    '/paciente/dashboard',
  consultorio: '/consultorio/dashboard',
  gestor:      '/admin/dashboard',
};

export default function LoginPage() {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user, loading } = useAuth();
  const router = useRouter();

  // Pre-calentar el backend en silencio mientras el usuario escribe
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_BASE}/health`, { signal: ctrl.signal }).catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace(REDIRECT[user.role] ?? '/');
  }, [user, loading, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      router.push(REDIRECT[loggedUser.role] ?? '/');
    } catch (err) {
      const msg = err.errors?.email?.[0] || err.errors?.password?.[0] || err.message || 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PublicLayout>
      <div className="auth-bg d-flex align-items-start justify-content-center p-3 pt-5">
        <div className="card auth-card w-100" style={{ maxWidth: 420 }}>
          <div className="card-body p-4 p-sm-5">

            {/* Logo + título */}
            <div className="text-center mb-4">
              <Image src="/logo.png" alt="OpsDental" width={353} height={707} style={{ height: '80px', width: 'auto' }} className="mb-3" />
              <h5 className="fw-bold mb-1">Iniciar sesión</h5>
              <p className="text-muted small mb-0">Accede a tu cuenta para continuar.</p>
            </div>

            <AppAlert type="danger" message={error} onClose={() => setError('')} />

            <form onSubmit={submit} noValidate>

              <div className="mb-3">
                <label className="form-label fw-medium">Correo electrónico</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope text-muted" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-medium mb-0">Contraseña</label>
                  <Link href="/forgot-password" className="small text-primary text-decoration-none">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock text-muted" />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                    title={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <i className={`bi bi-${showPass ? 'eye-slash' : 'eye'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2"
                disabled={submitting || !email || !password}
                style={{ fontWeight: 600, letterSpacing: '.02em' }}
              >
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Ingresando…</>
                  : <><i className="bi bi-box-arrow-in-right me-2" />Ingresar</>}
              </button>
            </form>

            <p className="text-center text-muted small mt-4 mb-0">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="fw-semibold text-primary text-decoration-none">
                Regístrate aquí
              </Link>
            </p>

          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

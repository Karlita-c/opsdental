'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppAlert from '@/components/ui/AppAlert';
import PasswordField from '@/components/ui/PasswordField';
import PublicLayout from '@/components/layout/PublicLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token  = params.get('token') ?? '';
  const email  = params.get('email') ?? '';

  const [form,       setForm]       = useState({ password: '', password_confirmation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await api.post('/reset-password', { token, email, ...form });
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      const msgs = err.errors;
      setError(msgs && Object.keys(msgs).length ? Object.values(msgs).flat()[0] : err.message ?? 'Token inválido o expirado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="alert alert-success d-flex align-items-center gap-2 mb-0">
      <i className="bi bi-check-circle-fill" />
      Contraseña actualizada. Redirigiendo al login…
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <AppAlert type="danger" message={error} onClose={() => setError('')} />
      <PasswordField label="Nueva contraseña"         name="password"              required value={form.password}              onChange={handle} />
      <PasswordField label="Confirmar nueva contraseña" name="password_confirmation" required value={form.password_confirmation} onChange={handle} />
      <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mt-1"
        disabled={submitting || !form.password || !form.password_confirmation}>
        {submitting
          ? <><span className="spinner-border spinner-border-sm me-2" />Actualizando…</>
          : <><i className="bi bi-lock-fill me-2" />Restablecer contraseña</>}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicLayout>
      <div className="auth-bg d-flex align-items-start justify-content-center p-3 pt-5">
        <div className="card auth-card w-100" style={{ maxWidth: 420 }}>
          <div className="card-body p-4 p-sm-5">

            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--bb-primary), var(--bb-primary-dark))', boxShadow: '0 4px 14px rgba(var(--bb-primary-rgb),.35)' }}>
                <i className="bi bi-lock-fill fs-4 text-white" />
              </div>
              <h5 className="fw-bold mb-1">Nueva contraseña</h5>
              <p className="text-muted small mb-0">Elige una contraseña segura de al menos 8 caracteres.</p>
            </div>

            <Suspense fallback={<LoadingSpinner />}>
              <ResetForm />
            </Suspense>

            <p className="text-center text-muted small mt-4 mb-0">
              <Link href="/login" className="fw-semibold text-primary text-decoration-none">
                <i className="bi bi-arrow-left me-1" />Volver al login
              </Link>
            </p>

          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

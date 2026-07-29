'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppAlert from '@/components/ui/AppAlert';
import PublicLayout from '@/components/layout/PublicLayout';

export default function ForgotPasswordPage() {
  const [email,      setEmail]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await api.post('/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="auth-bg d-flex align-items-start justify-content-center p-3 pt-5">
        <div className="card auth-card w-100" style={{ maxWidth: 420 }}>
          <div className="card-body p-4 p-sm-5">

            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--bb-primary), var(--bb-primary-dark))', boxShadow: '0 4px 14px rgba(var(--bb-primary-rgb),.35)' }}>
                <i className="bi bi-key fs-4 text-white" />
              </div>
              <h5 className="fw-bold mb-1">Recuperar contraseña</h5>
              <p className="text-muted small mb-0">Escribe tu correo y te enviaremos instrucciones.</p>
            </div>

            {sent ? (
              <div className="alert alert-success d-flex align-items-start gap-2 mb-0">
                <i className="bi bi-envelope-check-fill mt-1 flex-shrink-0" />
                <div>
                  <strong>Correo enviado</strong>
                  <p className="mb-0 small mt-1">
                    Si <strong>{email}</strong> está registrado, revisa tu bandeja de entrada y sigue el enlace.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <AppAlert type="danger" message={error} onClose={() => setError('')} />
                <form onSubmit={submit} noValidate>
                  <div className="mb-4">
                    <label className="form-label fw-medium">Correo electrónico</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope text-muted" /></span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={submitting || !email}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Enviando…</>
                      : <><i className="bi bi-send me-2" />Enviar instrucciones</>}
                  </button>
                </form>
              </>
            )}

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

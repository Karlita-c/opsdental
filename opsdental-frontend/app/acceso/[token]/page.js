'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';

const REDIRECT = {
  consultorio: '/consultorio/dashboard',
  paciente:    '/paciente/dashboard',
};

export default function AccesoInvitacionPage() {
  const router      = useRouter();
  const { token }   = useParams();
  const { setUser } = useAuth();

  const [estado, setEstado] = useState('cargando'); // cargando | ok | error

  useEffect(() => {
    if (!token) { setEstado('error'); return; }

    api.get(`/acceso/${token}`)
      .then(({ data }) => {
        localStorage.setItem('bb-token', data.token);
        setUser(data.user);
        setEstado('ok');
        setTimeout(() => {
          router.replace(REDIRECT[data.user.role] ?? '/');
        }, 1500);
      })
      .catch(() => setEstado('error'));
  }, [token]);

  return (
    <PublicLayout>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="text-center" style={{ maxWidth: 420 }}>

          {estado === 'cargando' && (
            <>
              <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }} role="status" />
              <h5 className="fw-bold mb-2">Verificando enlace…</h5>
              <p className="text-muted small">Un momento por favor.</p>
            </>
          )}

          {estado === 'ok' && (
            <>
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{ width: 80, height: 80, background: 'rgba(22,163,74,.12)', border: '2px solid rgba(22,163,74,.3)' }}
              >
                <i className="bi bi-patch-check-fill fs-1 text-success" />
              </div>
              <h4 className="fw-bold mb-2">Bienvenido a OpsDental</h4>
              <p className="text-muted">Acceso confirmado. Redirigiendo a tu panel…</p>
            </>
          )}

          {estado === 'error' && (
            <>
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{ width: 80, height: 80, background: 'rgba(220,38,38,.1)', border: '2px solid rgba(220,38,38,.25)' }}
              >
                <i className="bi bi-exclamation-triangle-fill fs-1 text-danger" />
              </div>
              <h4 className="fw-bold mb-2">Enlace inválido o expirado</h4>
              <p className="text-muted mb-4">
                El enlace de acceso ya fue usado o ha expirado (válido por 48 h).
                Puedes ingresar con tu correo y contraseña.
              </p>
              <a href="/login" className="btn btn-primary px-4">
                <i className="bi bi-box-arrow-in-right me-2" />Ir al inicio de sesión
              </a>
            </>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}

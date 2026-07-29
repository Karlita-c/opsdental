'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ConsultoriosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const consultorioId = user?.paciente?.consultorio_id;
    if (consultorioId) {
      router.replace(`/paciente/consultorios/${consultorioId}`);
    }
  }, [user, loading, router]);

  if (loading) return <div className="py-5"><LoadingSpinner /></div>;

  const consultorioId = user?.paciente?.consultorio_id;

  if (!consultorioId) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-building text-muted d-block mb-3" style={{ fontSize: '2.5rem' }} />
        <h5 className="fw-bold mb-2">Sin consultorio asignado</h5>
        <p className="text-muted mb-0">
          Aún no estás vinculado a ningún consultorio.<br />
          Pide a tu dentista que te comparta el enlace de acceso.
        </p>
      </div>
    );
  }

  return <div className="py-5"><LoadingSpinner /></div>;
}

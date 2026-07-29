'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PacienteLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'paciente')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return <LoadingSpinner />;

  return (
    <>
      <Navbar />
      <main className="container py-4">{children}</main>
    </>
  );
}

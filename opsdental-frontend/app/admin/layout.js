'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/layout/AdminSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'gestor')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return <LoadingSpinner />;

  return (
    <div className="admin-wrapper">
      <AdminSidebar />

      <div className="admin-content">
        {/* Barra superior móvil */}
        <div
          className="d-lg-none border-bottom sticky-top bg-body d-flex align-items-center gap-3 px-3 py-2"
          style={{ zIndex: 30, minHeight: '3.25rem' }}
        >
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
            data-bs-toggle="offcanvas"
            data-bs-target="#adminOffcanvas"
            aria-label="Abrir menú"
          >
            <i className="bi bi-list fs-5" />
          </button>
          <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none text-body">
            <Image src="/logo.png" alt="OpsDental" width={353} height={707} style={{ height: '40px', width: 'auto' }} />
            <span className="fw-bold">OpsDental</span>
            <span
              className="badge"
              style={{
                background: 'rgba(var(--bb-primary-rgb),.12)',
                color: 'var(--bb-primary)',
                fontSize: '.6rem',
                letterSpacing: '.06em',
              }}
            >
              ADMIN
            </span>
          </Link>
        </div>

        <main className="p-3 p-lg-4 p-xl-5">{children}</main>
      </div>
    </div>
  );
}


'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';


const LINKS = [
  { href: '/admin/dashboard',    label: 'Dashboard',    icon: 'bi-grid-1x2-fill' },
  { href: '/admin/consultorios', label: 'Consultorios', icon: 'bi-buildings-fill' },
];

const closeOffcanvas = () => {
  if (typeof window === 'undefined') return;
  const el = document.getElementById('adminOffcanvas');
  window.bootstrap?.Offcanvas?.getInstance(el)?.hide();
};

function NavContent({ pathname, user, onLogout }) {
  const active = (href) => pathname === href || pathname.startsWith(href + '/');
  const initial = user?.name?.[0]?.toUpperCase() ?? 'G';

  return (
    <div className="d-flex flex-column" style={{ height: '100%' }}>

      {/* ── Logo ── */}
      <div className="px-4 py-4 border-bottom">
        <Link
          href="/"
          className="d-flex align-items-center gap-2 mb-2 text-decoration-none text-body"
          title="Ir al inicio"
        >
          <Image src="/logo.png" alt="OpsDental" width={353} height={707} style={{ height: '36px', width: 'auto', flexShrink: 0 }} />
          <span className="fw-bold fs-6">OpsDental</span>
        </Link>
        <span
          className="badge"
          style={{
            background: 'rgba(var(--bb-primary-rgb),.12)',
            color: 'var(--bb-primary)',
            fontSize: '.6rem',
            letterSpacing: '.08em',
            fontWeight: 700,
          }}
        >
          PANEL DE ADMINISTRACIÓN
        </span>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-grow-1 px-3 py-4" style={{ overflowY: 'auto' }}>
        <p
          className="text-uppercase text-muted px-2 mb-2"
          style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.1em' }}
        >
          Menú
        </p>
        {LINKS.map(l => {
          const isActive = active(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={closeOffcanvas}
              className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 mb-1 text-decoration-none"
              style={{
                background:  isActive ? 'rgba(var(--bb-primary-rgb),.12)' : 'transparent',
                color:       isActive ? 'var(--bb-primary)' : 'var(--bs-secondary-color)',
                fontWeight:  isActive ? 600 : 400,
                transition:  'background .15s, color .15s',
              }}
            >
              <i
                className={`bi ${l.icon}`}
                style={{ fontSize: '1rem', width: '1.1rem', textAlign: 'center', flexShrink: 0 }}
              />
              <span style={{ fontSize: '.875rem' }}>{l.label}</span>
              {isActive && (
                <div
                  className="ms-auto rounded-pill"
                  style={{ width: 6, height: 6, background: 'var(--bb-primary)', flexShrink: 0 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Usuario + acciones ── */}
      <div className="border-top px-3 py-3">
        <div
          className="d-flex align-items-center gap-2 rounded-3 p-2 mb-3"
          style={{ background: 'rgba(var(--bb-primary-rgb),.06)' }}
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--bb-primary), var(--bb-primary-dark))',
              color: '#fff', fontSize: '.9rem',
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="fw-semibold text-truncate" style={{ fontSize: '.825rem' }}>{user?.name}</div>
            <div className="text-muted text-truncate" style={{ fontSize: '.7rem' }}>{user?.email}</div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <ThemeToggle />
          <button
            className="btn btn-outline-danger btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            onClick={onLogout}
          >
            <i className="bi bi-box-arrow-right" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname         = usePathname();
  const router           = useRouter();

  const handleLogout = async () => {
    closeOffcanvas();
    await logout();
    router.push('/login');
  };

  const props = { pathname, user, onLogout: handleLogout };

  return (
    <>
      {/* Desktop sidebar — fija, solo ≥ lg */}
      <aside className="admin-sidebar d-none d-lg-block">
        <NavContent {...props} />
      </aside>

      {/* Mobile offcanvas */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="adminOffcanvas"
        aria-labelledby="adminOffcanvasLabel"
        style={{ maxWidth: 260 }}
      >
        <div className="offcanvas-header border-bottom py-3">
          <Link href="/" className="fw-bold text-decoration-none text-body d-flex align-items-center gap-2" id="adminOffcanvasLabel">
            <Image src="/logo.png" alt="OpsDental" width={353} height={707} style={{ height: '28px', width: 'auto' }} />
            OpsDental
          </Link>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar" />
        </div>
        <div className="offcanvas-body p-0" style={{ overflowY: 'hidden' }}>
          <NavContent {...props} />
        </div>
      </div>
    </>
  );
}


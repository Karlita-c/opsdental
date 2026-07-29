'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';

const LINKS = {
  paciente: [
    { href: '/paciente/dashboard',    label: 'Inicio',       icon: 'bi-house' },
    { href: '/paciente/consultorios', label: 'Mi consultorio', icon: 'bi-building' },
    { href: '/paciente/citas',        label: 'Mis citas',    icon: 'bi-calendar3' },
    { href: '/paciente/perfil',       label: 'Perfil',       icon: 'bi-person-gear' },
  ],
  consultorio: [
    { href: '/consultorio/dashboard',    label: 'Panel',         icon: 'bi-grid' },
    { href: '/consultorio/agenda',       label: 'Agenda',        icon: 'bi-calendar-week' },
    { href: '/consultorio/pacientes',    label: 'Pacientes',     icon: 'bi-people' },
    { href: '/consultorio/estadisticas', label: 'Estadísticas',  icon: 'bi-bar-chart-line' },
    { href: '/consultorio/tratamientos', label: 'Tratamientos',  icon: 'bi-clipboard2-pulse' },
    { href: '/consultorio/horarios',     label: 'Horarios',      icon: 'bi-clock' },
    { href: '/consultorio/membrecia',    label: 'Membresía',     icon: 'bi-credit-card-fill' },
    { href: '/consultorio/perfil',       label: 'Perfil',        icon: 'bi-person-gear' },
  ],
  gestor: [
    { href: '/admin/dashboard',    label: 'Panel',        icon: 'bi-grid' },
    { href: '/admin/consultorios', label: 'Consultorios', icon: 'bi-buildings' },
  ],
};

const closeOffcanvas = () => {
  if (typeof window === 'undefined') return;
  const el = document.getElementById('navOffcanvas');
  window.bootstrap?.Offcanvas?.getInstance(el)?.hide();
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const router           = useRouter();
  const pathname         = usePathname();
  const links            = user ? (LINKS[user.role] ?? []) : [];

  const handleLogout = async () => {
    closeOffcanvas();
    await logout();
    router.push('/login');
  };

  const active = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ══════════════════════════════════════════
          NAVBAR  sticky · z-40 · fondo sólido
          Layout: [hamburguesa + logo] ── [derecha]
      ══════════════════════════════════════════ */}
      <nav
        className="navbar border-bottom sticky-top bg-body"
        style={{ zIndex: 40, minHeight: '3.5rem' }}
      >
        <div className="container-fluid px-3 px-lg-4" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>

          {/* ── IZQUIERDA: hamburguesa (< lg) + logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

            {/* ▸ Hamburguesa
                Visible:  mobile (< 576px) + tablet (576–991px)
                Oculta:   desktop (≥ 992px)                     */}
            <button
              type="button"
              className="d-lg-none"
              data-bs-toggle="offcanvas"
              data-bs-target="#navOffcanvas"
              aria-controls="navOffcanvas"
              aria-label="Abrir menú"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 8px',
                lineHeight: 1,
                borderRadius: '6px',
              }}
            >
              <i
                className="bi bi-list"
                style={{ fontSize: '1.75rem', display: 'block', color: 'var(--bs-body-color)' }}
              />
            </button>

            {/* Logo */}
            <Link className="navbar-brand fw-bold mb-0 d-flex align-items-center gap-2" href="/">
              <Image src="/logo.png" alt="OpsDental" width={353} height={707} style={{ height: '44px', width: 'auto' }} />
              OpsDental
            </Link>
          </div>

          {/* ── DERECHA: nav links (≥ lg) + tema + usuario ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>

            {/* Links de navegación — solo desktop ≥ 992px */}
            {links.length > 0 && (
              <ul className="navbar-nav flex-row gap-0 me-1 d-none d-lg-flex">
                {links.map(l => (
                  <li key={l.href} className="nav-item">
                    <Link
                      className={`nav-link px-2 rounded-2 ${active(l.href) ? 'active fw-semibold bg-primary bg-opacity-10' : ''}`}
                      style={{ fontSize: '.875rem' }}
                      href={l.href}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* ThemeToggle — siempre visible */}
            <ThemeToggle />

            {/* Acciones usuario — solo desktop ≥ 992px */}
            {user ? (
              <div className="d-none d-lg-flex align-items-center gap-1">
                <span className="text-muted small ms-1 d-none d-xl-flex align-items-center gap-1">
                  <i className="bi bi-person-circle" /> {user.name}
                </span>
                <button
                  className="btn btn-outline-secondary btn-sm ms-1 d-flex align-items-center gap-1"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right" /> Salir
                </button>
              </div>
            ) : (
              <div className="d-none d-lg-flex gap-1 ms-1">
                <Link className="btn btn-outline-primary btn-sm" href="/login">Ingresar</Link>
                <Link className="btn btn-primary btn-sm" href="/register">Registrarse</Link>
              </div>
            )}

          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          OFFCANVAS  fixed · top-0 · left-0 · z-50
          Ancho 256px · overlay automático Bootstrap
      ══════════════════════════════════════════ */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="navOffcanvas"
        aria-labelledby="navOffcanvasLabel"
        style={{ maxWidth: '256px', zIndex: 50 }}
      >
        {/* Cabecera */}
        <div className="offcanvas-header border-bottom py-3">
          <div className="d-flex align-items-center gap-2" id="navOffcanvasLabel">
            <Image src="/logo.png" alt="OpsDental" width={353} height={707} style={{ height: '40px', width: 'auto' }} />
            <span className="fw-bold">OpsDental</span>
          </div>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar"
          />
        </div>

        {/* Cuerpo */}
        <div className="offcanvas-body d-flex flex-column p-0">

          <nav className="flex-grow-1 py-2">
            {links.length > 0 ? links.map(l => (
              <Link
                key={l.href}
                className={`d-flex align-items-center gap-3 px-4 py-3 text-decoration-none nav-link ${active(l.href) ? 'active fw-semibold' : ''}`}
                href={l.href}
                onClick={closeOffcanvas}
              >
                <i
                  className={`bi ${l.icon}`}
                  style={{
                    width: '1.1rem',
                    textAlign: 'center',
                    color: active(l.href) ? 'var(--bb-primary)' : 'var(--bs-secondary-color)',
                  }}
                />
                <span>{l.label}</span>
              </Link>
            )) : (
              <p className="px-4 py-3 text-muted small mb-0">Accede o crea tu cuenta.</p>
            )}
          </nav>

          <div className="border-top p-4 d-flex flex-column gap-2">
            {user ? (
              <>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <i className="bi bi-person-circle" />
                  <span className="text-truncate">{user.name}</span>
                </div>
                <button
                  className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right" /> Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-primary btn-sm w-100" href="/login" onClick={closeOffcanvas}>
                  Ingresar
                </Link>
                <Link className="btn btn-primary btn-sm w-100" href="/register" onClick={closeOffcanvas}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


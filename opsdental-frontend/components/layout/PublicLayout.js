'use client';
import Link from 'next/link';
import Navbar from './Navbar';

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <footer className="border-top mt-5 py-4 text-center text-muted" style={{ fontSize: '.82rem' }}>
        <div className="container">
          <span className="fw-semibold text-body me-2">OpsDental</span>
          &copy; {new Date().getFullYear()}
          <span className="mx-2">·</span>
          <Link href="/privacidad" className="text-muted text-decoration-none hover-underline">
            Aviso de Privacidad
          </Link>
          <span className="mx-2">·</span>
          <span>Plataforma de citas dentales</span>
        </div>
      </footer>
    </>
  );
}

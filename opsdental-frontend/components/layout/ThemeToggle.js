'use client';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      aria-label="Cambiar tema"
    >
      <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} />
    </button>
  );
}

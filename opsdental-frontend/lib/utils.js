export const fmtISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const soloFecha = (f) => f ? String(f).slice(0, 10) : null;

export const fmtFecha = (f) => {
  const d = soloFecha(f);
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const fmtFechaCorta = (f) => {
  const d = soloFecha(f);
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const getSaludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
};

export const diasHastaVencer = (fecha) =>
  fecha ? Math.ceil((new Date(fecha) - new Date()) / 864e5) : null;

export const fmtFechaLarga = (f) => {
  const d = soloFecha(f);
  if (!d) return '—';
  const s = new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

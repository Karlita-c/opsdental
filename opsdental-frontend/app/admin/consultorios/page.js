'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import AppModal from '@/components/ui/AppModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const hoy = new Date();

function esVencido(c) {
  return c.activo && c.membrecia?.fecha_vencimiento && new Date(c.membrecia.fecha_vencimiento) < hoy;
}

const FILTROS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'activos',    label: 'Activos' },
  { key: 'vencidos',   label: 'Vencidos' },
];

function ConsultoriosContent() {
  const params = useSearchParams();

  const [lista,        setLista]   = useState([]);
  const [busqueda,     setBusqueda]= useState('');
  const [filtro,       setFiltro]  = useState(params.get('filtro') ?? 'todos');
  const [seleccionado, setSelec]   = useState(null);
  const [editando,     setEditando]= useState(null);   // consultorio cuya membresía se edita
  const [editForm,     setEditForm]= useState({ plan: 'basico', fecha_inicio: '', fecha_vencimiento: '' });
  const [editando_,    setGuardando]= useState(false);
  const [msg,          setMsg]     = useState({ text: '', type: 'success' });
  const [loading,      setLoading] = useState(true);

  const cargar = () =>
    api.get('/admin/consultorios')
      .then(r => setLista(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const conteos = useMemo(() => ({
    todos:      lista.length,
    pendientes: lista.filter(c => !c.activo).length,
    activos:    lista.filter(c => c.activo && !esVencido(c)).length,
    vencidos:   lista.filter(c => esVencido(c)).length,
  }), [lista]);

  const filtrados = useMemo(() => {
    let base = lista;
    if (filtro === 'pendientes') base = base.filter(c => !c.activo);
    if (filtro === 'activos')    base = base.filter(c => c.activo && !esVencido(c));
    if (filtro === 'vencidos')   base = base.filter(c => esVencido(c));

    const q = busqueda.toLowerCase().trim();
    if (!q) return base;
    return base.filter(c =>
      c.nombre?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.cedula_profesional?.toLowerCase().includes(q)
    );
  }, [lista, filtro, busqueda]);

  const activar = async (id) => {
    try {
      await api.patch(`/admin/consultorios/${id}/activar`);
      setMsg({ text: 'Consultorio activado correctamente.', type: 'success' });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const bloquear = async (id) => {
    if (!confirm('¿Bloquear este consultorio? Dejará de aparecer en la plataforma.')) return;
    try {
      await api.patch(`/admin/consultorios/${id}/bloquear`);
      setMsg({ text: 'Consultorio bloqueado.', type: 'warning' });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const toDateStr = (v) => (v ? String(v).slice(0, 10) : '');

  const abrirEditar = (c) => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const un_año = new Date(); un_año.setFullYear(un_año.getFullYear() + 1);
    setEditForm({
      plan:              c.membrecia?.plan                           ?? 'basico',
      fecha_inicio:      toDateStr(c.membrecia?.fecha_inicio)        || hoyStr,
      fecha_vencimiento: toDateStr(c.membrecia?.fecha_vencimiento)   || un_año.toISOString().slice(0, 10),
    });
    setEditando(c);
  };

  const guardarMembrecia = async () => {
    setGuardando(true);
    try {
      await api.patch(`/admin/consultorios/${editando.id}/membrecia`, editForm);
      setMsg({ text: `Membresía de "${editando.nombre}" actualizada.`, type: 'success' });
      setEditando(null);
      cargar();
    } catch (err) {
      setMsg({ text: err.message ?? 'Error al guardar.', type: 'danger' });
    } finally {
      setGuardando(false);
    }
  };

  const LIMITES = { gratuito: '10 citas/mes', basico: '20 citas/mes', premium: '50 citas/mes', pro: 'Ilimitadas' };

  return (
    <>
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Consultorios</h3>
          <p className="text-muted mb-0 small">
            Gestiona los consultorios registrados en la plataforma.
          </p>
        </div>
        <span className="badge text-bg-secondary fs-6 fw-normal px-3 py-2">
          {lista.length} total
        </span>
      </div>

      <AppAlert
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ text: '', type: 'success' })}
      />

      {/* Filtros + búsqueda */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3 px-4">
          <div className="d-flex flex-wrap align-items-center gap-3">

            {/* Tabs de filtro */}
            <div className="d-flex flex-wrap gap-2 flex-grow-1">
              {FILTROS.map(f => (
                <button
                  key={f.key}
                  className={`btn btn-sm rounded-pill ${filtro === f.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFiltro(f.key)}
                >
                  {f.label}
                  <span
                    className={`ms-2 badge rounded-pill ${filtro === f.key ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary-emphasis'}`}
                    style={{ fontSize: '.65rem' }}
                  >
                    {conteos[f.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="input-group" style={{ maxWidth: 260 }}>
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-search text-muted" style={{ fontSize: '.8rem' }} />
              </span>
              <input
                type="search"
                className="form-control form-control-sm border-start-0 ps-0"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, ciudad…"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? <LoadingSpinner /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bs-border-color)' }}>
                  <th className="px-4 py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Consultorio</th>
                  <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cédula profesional</th>
                  <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Ciudad</th>
                  <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Plan</th>
                  <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Vence</th>
                  <th className="py-3 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Estado</th>
                  <th className="py-3 pe-4 fw-semibold" style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      <i className="bi bi-inbox fs-2 d-block mb-2 opacity-50" />
                      {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay consultorios en esta categoría.'}
                    </td>
                  </tr>
                ) : filtrados.map(c => {
                  const vencido = esVencido(c);
                  let estadoText  = 'activo';
                  let estadoVar   = 'success';
                  if (!c.activo)   { estadoText = 'pendiente'; estadoVar = 'warning'; }
                  if (vencido)     { estadoText = 'vencido';   estadoVar = 'danger'; }

                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 fw-bold flex-shrink-0"
                            style={{
                              width: 38, height: 38,
                              background: 'rgba(var(--bb-primary-rgb),.1)',
                              color: 'var(--bb-primary)',
                              fontSize: '.9rem',
                            }}
                          >
                            {c.nombre?.[0]?.toUpperCase() ?? 'C'}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '.875rem' }}>{c.nombre}</div>
                            <div className="text-muted" style={{ fontSize: '.75rem' }}>{c.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {c.cedula_profesional ? (
                          <span className="badge bg-secondary-subtle text-secondary-emphasis font-monospace">
                            {c.cedula_profesional}
                          </span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td className="small">{c.ciudad ?? '—'}</td>
                      <td>
                        <AppBadge text={c.membrecia?.plan ?? 'sin plan'} />
                      </td>
                      <td>
                        {c.membrecia?.fecha_vencimiento ? (
                          <span className={`small ${vencido ? 'text-danger fw-semibold' : 'text-muted'}`}>
                            {vencido && <i className="bi bi-exclamation-triangle-fill me-1" />}
                            {new Date(c.membrecia.fecha_vencimiento).toLocaleDateString('es-MX', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>
                        <AppBadge text={estadoText} variant={estadoVar} />
                      </td>
                      <td className="pe-4">
                        <div className="d-flex gap-2 flex-wrap">
                          {!c.activo ? (
                            <button
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              onClick={() => activar(c.id)}
                              title="Verifica la cédula y activa el consultorio."
                            >
                              <i className="bi bi-patch-check-fill" /> Validar
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                              onClick={() => bloquear(c.id)}
                            >
                              <i className="bi bi-slash-circle me-1" />Bloquear
                            </button>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                            onClick={() => abrirEditar(c)}
                            title="Cambiar plan y fechas de membresía"
                          >
                            <i className="bi bi-credit-card" /> Membresía
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtrados.length > 0 && (
            <div className="card-footer bg-transparent text-muted small px-4 py-2">
              Mostrando {filtrados.length} de {lista.length} consultorios
            </div>
          )}
        </div>
      )}

      {/* Modal — Editar membresía */}
      {editando && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom-0 pb-1">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-credit-card-fill me-2 text-primary" />
                  Membresía — {editando.nombre}
                </h5>
                <button className="btn-close" onClick={() => setEditando(null)} />
              </div>
              <div className="modal-body pt-2">

                {/* Plan */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Plan</label>
                  <div className="row g-2">
                    {[
                      { key: 'gratuito', label: 'Gratuito',  color: 'secondary' },
                      { key: 'basico',   label: 'Básico',    color: 'primary'   },
                      { key: 'premium',  label: 'Premium',   color: 'warning'   },
                      { key: 'pro',      label: 'Pro',       color: 'success'   },
                    ].map(p => (
                      <div key={p.key} className="col-6">
                        <button
                          type="button"
                          className={`btn btn-sm w-100 ${editForm.plan === p.key ? `btn-${p.color}` : `btn-outline-${p.color}`}`}
                          onClick={() => setEditForm(f => ({ ...f, plan: p.key }))}
                        >
                          {p.label}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-muted small mt-2">
                    <i className="bi bi-info-circle me-1" />
                    {LIMITES[editForm.plan]}
                  </div>
                </div>

                {/* Fechas */}
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Fecha inicio</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editForm.fecha_inicio}
                      onChange={e => setEditForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Fecha vencimiento</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editForm.fecha_vencimiento}
                      min={editForm.fecha_inicio}
                      onChange={e => setEditForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Atajos de duración */}
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  <span className="text-muted small me-1 align-self-center">Duración rápida:</span>
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-0"
                      style={{ fontSize: '.75rem' }}
                      onClick={() => {
                        const inicio = editForm.fecha_inicio || new Date().toISOString().slice(0, 10);
                        const fin = new Date(inicio);
                        fin.setMonth(fin.getMonth() + m);
                        setEditForm(f => ({ ...f, fecha_inicio: inicio, fecha_vencimiento: fin.toISOString().slice(0, 10) }));
                      }}
                    >
                      {m === 1 ? '1 mes' : m === 12 ? '1 año' : `${m} meses`}
                    </button>
                  ))}
                </div>

              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                  onClick={guardarMembrecia}
                  disabled={editando_}
                >
                  {editando_ && <span className="spinner-border spinner-border-sm" />}
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminConsultoriosPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ConsultoriosContent />
    </Suspense>
  );
}

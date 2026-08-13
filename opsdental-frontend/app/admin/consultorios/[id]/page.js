'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const LIMITES = { gratuito: '10 citas/mes', basico: '20 citas/mes', premium: '50 citas/mes', pro: 'Ilimitadas' };

function fmtDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function AdminConsultorioDetallePage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [consultorio, setConsultorio] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [accion,      setAccion]      = useState('');
  const [msg,         setMsg]         = useState({ text: '', type: 'success' });

  // Estado edición membresía
  const [editMem, setEditMem] = useState(false);
  const [editForm, setEditForm] = useState({ plan: 'basico', fecha_inicio: '', fecha_vencimiento: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setLoading(true);
    api.get(`/admin/consultorios/${id}`)
      .then(r => {
        const c = r.data?.consultorio ?? r.data;
        setConsultorio(c);
        setEditForm({
          plan:              c.membrecia?.plan              ?? 'basico',
          fecha_inicio:      (c.membrecia?.fecha_inicio     ?? '').slice(0, 10),
          fecha_vencimiento: (c.membrecia?.fecha_vencimiento ?? '').slice(0, 10),
        });
      })
      .catch(() => setMsg({ text: 'No se pudo cargar el consultorio.', type: 'danger' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) cargar(); }, [id]);

  const activar = async () => {
    setAccion('activar');
    try {
      await api.patch(`/admin/consultorios/${id}/activar`);
      setMsg({ text: 'Consultorio activado correctamente.', type: 'success' });
      cargar();
    } catch (e) {
      setMsg({ text: e.message || 'Error al activar.', type: 'danger' });
    } finally { setAccion(''); }
  };

  const bloquear = async () => {
    if (!confirm('¿Bloquear este consultorio? Dejará de aparecer en la plataforma.')) return;
    setAccion('bloquear');
    try {
      await api.patch(`/admin/consultorios/${id}/bloquear`);
      setMsg({ text: 'Consultorio bloqueado.', type: 'warning' });
      cargar();
    } catch (e) {
      setMsg({ text: e.message || 'Error al bloquear.', type: 'danger' });
    } finally { setAccion(''); }
  };

  const guardarMembrecia = async () => {
    setGuardando(true);
    try {
      await api.patch(`/admin/consultorios/${id}/membrecia`, editForm);
      setMsg({ text: 'Membresía actualizada correctamente.', type: 'success' });
      setEditMem(false);
      cargar();
    } catch (e) {
      setMsg({ text: e.message || 'Error al guardar.', type: 'danger' });
    } finally { setGuardando(false); }
  };

  if (loading) return <LoadingSpinner />;

  if (!consultorio) return (
    <div className="alert alert-danger">No se encontró el consultorio.</div>
  );

  const c       = consultorio;
  const vencido = c.activo && c.membrecia?.fecha_vencimiento && new Date(c.membrecia.fecha_vencimiento) < new Date();

  return (
    <>
      {/* Navegación */}
      <button
        className="btn btn-link btn-sm text-muted d-inline-flex align-items-center gap-1 mb-3 p-0"
        onClick={() => router.push('/admin/consultorios')}
      >
        <i className="bi bi-arrow-left" /> Volver a consultorios
      </button>

      <AppAlert
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ text: '', type: 'success' })}
      />

      <div className="row g-4">
        {/* Columna principal */}
        <div className="col-12 col-lg-7">

          {/* Encabezado */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0 bg-primary bg-opacity-10 text-primary"
                  style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                  {c.nombre?.[0]?.toUpperCase() ?? 'C'}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h4 className="fw-bold mb-0">{c.nombre}</h4>
                    <AppBadge
                      text={!c.activo ? 'pendiente' : vencido ? 'vencido' : 'activo'}
                      variant={!c.activo ? 'warning' : vencido ? 'danger' : 'success'}
                    />
                  </div>
                  <p className="text-muted small mb-0 mt-1">{c.user?.email}</p>
                  {c.cedula_profesional && (
                    <p className="small mb-0 mt-1">
                      Cédula: <span className="font-monospace fw-semibold">{c.cedula_profesional}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Datos del consultorio */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent border-bottom py-3 px-4">
              <h6 className="fw-semibold mb-0">
                <i className="bi bi-info-circle me-2 text-primary" />Datos del consultorio
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                {[
                  { label: 'Teléfono',    value: c.telefono   ?? '—' },
                  { label: 'Ciudad',      value: c.ciudad     ?? '—' },
                  { label: 'Dirección',   value: c.direccion  ?? '—' },
                  { label: 'Descripción', value: c.descripcion ?? '—' },
                  { label: 'Registro',    value: fmtDate(c.created_at) },
                ].map(f => (
                  <div key={f.label} className="col-12 col-sm-6">
                    <div className="text-muted small mb-1">{f.label}</div>
                    <div className="fw-medium small">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-3 px-4">
              <h6 className="fw-semibold mb-0">
                <i className="bi bi-shield-check me-2 text-primary" />Acciones
              </h6>
            </div>
            <div className="card-body p-4 d-flex flex-wrap gap-2">
              {!c.activo ? (
                <button
                  className="btn btn-success d-flex align-items-center gap-2"
                  onClick={activar}
                  disabled={accion === 'activar'}
                >
                  {accion === 'activar'
                    ? <span className="spinner-border spinner-border-sm" />
                    : <i className="bi bi-patch-check-fill" />}
                  Activar consultorio
                </button>
              ) : (
                <button
                  className="btn btn-outline-danger d-flex align-items-center gap-2"
                  onClick={bloquear}
                  disabled={accion === 'bloquear'}
                >
                  {accion === 'bloquear'
                    ? <span className="spinner-border spinner-border-sm" />
                    : <i className="bi bi-slash-circle" />}
                  Bloquear consultorio
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Columna membresía */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <h6 className="fw-semibold mb-0">
                <i className="bi bi-credit-card me-2 text-primary" />Membresía
              </h6>
              <button
                className="btn btn-link btn-sm text-primary p-0"
                onClick={() => setEditMem(v => !v)}
              >
                {editMem ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            <div className="card-body p-4">
              {!editMem ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">Plan</span>
                    <AppBadge text={c.membrecia?.plan ?? 'sin plan'} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">Límite</span>
                    <span className="small fw-semibold">{LIMITES[c.membrecia?.plan] ?? '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">Inicio</span>
                    <span className="small">{fmtDate(c.membrecia?.fecha_inicio)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Vencimiento</span>
                    <span className={`small ${vencido ? 'text-danger fw-semibold' : ''}`}>
                      {vencido && <i className="bi bi-exclamation-triangle-fill me-1" />}
                      {fmtDate(c.membrecia?.fecha_vencimiento)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Plan</label>
                    <div className="row g-2">
                      {[
                        { key: 'gratuito', color: 'secondary' },
                        { key: 'basico',   color: 'primary'   },
                        { key: 'premium',  color: 'warning'   },
                        { key: 'pro',      color: 'success'   },
                      ].map(p => (
                        <div key={p.key} className="col-6">
                          <button
                            type="button"
                            className={`btn btn-sm w-100 text-capitalize ${editForm.plan === p.key ? `btn-${p.color}` : `btn-outline-${p.color}`}`}
                            onClick={() => setEditForm(f => ({ ...f, plan: p.key }))}
                          >
                            {p.key}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-muted small mt-2 mb-0">
                      <i className="bi bi-info-circle me-1" />{LIMITES[editForm.plan]}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Fecha inicio</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editForm.fecha_inicio}
                      onChange={e => setEditForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Fecha vencimiento</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editForm.fecha_vencimiento}
                      min={editForm.fecha_inicio}
                      onChange={e => setEditForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    <span className="text-muted small align-self-center">Rápido:</span>
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
                        {m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={guardarMembrecia}
                    disabled={guardando}
                  >
                    {guardando && <span className="spinner-border spinner-border-sm" />}
                    Guardar membresía
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

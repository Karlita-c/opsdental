'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AppModal from '@/components/ui/AppModal';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const BLANK = { nombre: '', duracion_minutos: 30, precio: '', descripcion: '', activo: true };

export default function TratamientosPage() {
  const [lista,   setLista]   = useState([]);
  const [form,    setForm]    = useState(BLANK);
  const [editId,  setEditId]  = useState(null);
  const [msg,     setMsg]     = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(true);

  const cargar    = () => api.get('/tratamientos').then(r => setLista(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { cargar(); }, []);

  const handle     = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const resetForm  = () => { setForm(BLANK); setEditId(null); };
  const abrirEditar = t  => { setForm(t); setEditId(t.id); };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      editId
        ? await api.put(`/tratamientos/${editId}`, form)
        : await api.post('/tratamientos', form);
      setMsg({ text: editId ? 'Tratamiento actualizado.' : 'Tratamiento creado.', type: 'success' });
      resetForm();
      cargar();
      document.getElementById('modalTratamiento')?.querySelector('[data-bs-dismiss]')?.click();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const toggleActivo = async (t) => {
    try {
      await api.put(`/tratamientos/${t.id}`, { activo: !t.activo });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este tratamiento? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/tratamientos/${id}`);
      setMsg({ text: 'Tratamiento eliminado.', type: 'success' });
      cargar();
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    }
  };

  const activos   = lista.filter(t => t.activo);
  const inactivos = lista.filter(t => !t.activo);

  const TarjetaTratamiento = ({ t }) => (
    <div className={`card border-0 shadow-sm h-100 ${!t.activo ? 'opacity-60' : ''}`}>
      <div className="card-body p-4">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
            style={{ width: 40, height: 40, background: 'rgba(var(--bb-primary-rgb),.1)' }}
          >
            <i className="bi bi-clipboard2-pulse text-primary" />
          </div>
          <div className="form-check form-switch mb-0 flex-shrink-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id={`switch-${t.id}`}
              checked={t.activo}
              onChange={() => toggleActivo(t)}
              title={t.activo ? 'Desactivar' : 'Activar'}
            />
          </div>
        </div>

        <h6 className="fw-bold mb-1">{t.nombre}</h6>
        {t.descripcion && (
          <p className="text-muted small mb-3" style={{
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {t.descripcion}
          </p>
        )}

        <div className="d-flex align-items-center gap-3 mb-4">
          <span className="d-flex align-items-center gap-1 text-muted small">
            <i className="bi bi-clock" />
            {t.duracion_minutos} min
          </span>
          <span className="fw-bold text-primary">
            ${parseFloat(t.precio).toFixed(2)}
          </span>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm flex-grow-1"
            data-bs-toggle="modal"
            data-bs-target="#modalTratamiento"
            onClick={() => abrirEditar(t)}
          >
            <i className="bi bi-pencil me-1" />Editar
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => eliminar(t.id)}
            title="Eliminar"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Tratamientos</h3>
          <p className="text-muted mb-0 small">
            {activos.length} activo{activos.length !== 1 ? 's' : ''} · {inactivos.length} inactivo{inactivos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          data-bs-toggle="modal"
          data-bs-target="#modalTratamiento"
          onClick={resetForm}
        >
          <i className="bi bi-plus-lg" /> Nuevo tratamiento
        </button>
      </div>

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

      {loading ? <LoadingSpinner /> : lista.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 mx-auto mb-4"
              style={{ width: 64, height: 64, background: 'rgba(var(--bb-primary-rgb),.1)' }}
            >
              <i className="bi bi-clipboard2-plus" style={{ fontSize: '1.75rem', color: 'var(--bb-primary)' }} />
            </div>
            <h5 className="fw-semibold mb-2">Sin tratamientos aún</h5>
            <p className="text-muted mb-4">
              Agrega los servicios que ofreces para que los pacientes puedan agendar citas.
            </p>
            <button
              className="btn btn-primary px-4"
              data-bs-toggle="modal"
              data-bs-target="#modalTratamiento"
              onClick={resetForm}
            >
              <i className="bi bi-plus-lg me-2" />Agregar primer tratamiento
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Activos */}
          {activos.length > 0 && (
            <div className="mb-4">
              <p className="text-muted small fw-semibold text-uppercase mb-3" style={{ letterSpacing: '.06em', fontSize: '.7rem' }}>
                Activos — visibles para pacientes
              </p>
              <div className="row g-3">
                {activos.map(t => (
                  <div key={t.id} className="col-md-6 col-xl-4">
                    <TarjetaTratamiento t={t} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div>
              <p className="text-muted small fw-semibold text-uppercase mb-3" style={{ letterSpacing: '.06em', fontSize: '.7rem' }}>
                Inactivos — ocultos para pacientes
              </p>
              <div className="row g-3">
                {inactivos.map(t => (
                  <div key={t.id} className="col-md-6 col-xl-4">
                    <TarjetaTratamiento t={t} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AppModal
        id="modalTratamiento"
        title={editId ? 'Editar tratamiento' : 'Nuevo tratamiento'}
        footer={
          <>
            <button className="btn btn-secondary" data-bs-dismiss="modal" onClick={resetForm}>Cancelar</button>
            <button form="formTratamiento" type="submit" className="btn btn-primary">
              <i className="bi bi-check2 me-1" />Guardar
            </button>
          </>
        }
      >
        <form id="formTratamiento" onSubmit={guardar}>
          <div className="mb-3">
            <label className="form-label fw-medium">Nombre <span className="text-danger">*</span></label>
            <input name="nombre" className="form-control" value={form.nombre} onChange={handle} required />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label fw-medium">Duración (min) <span className="text-danger">*</span></label>
              <input name="duracion_minutos" type="number" min="10" max="480" step="5" className="form-control" value={form.duracion_minutos} onChange={handle} required />
            </div>
            <div className="col-6">
              <label className="form-label fw-medium">Precio ($) <span className="text-danger">*</span></label>
              <input name="precio" type="number" step="0.01" min="0" className="form-control" value={form.precio} onChange={handle} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-medium">Descripción</label>
            <textarea name="descripcion" className="form-control" rows={2} value={form.descripcion || ''} onChange={handle} />
          </div>

          {editId && (
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="activoSwitch"
                checked={!!form.activo}
                onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="activoSwitch">
                Visible para pacientes
              </label>
            </div>
          )}
        </form>
      </AppModal>
    </>
  );
}

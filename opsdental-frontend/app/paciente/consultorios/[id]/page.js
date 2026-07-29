'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppBadge from '@/components/ui/AppBadge';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { fmtISO } from '@/lib/utils';
import { DIAS_SHORT as DIAS_ES, DIAS_ORDEN } from '@/lib/constants';

const HOY = new Date().toISOString().split('T')[0];
// Mapeo del índice de getDay() (0=Dom) al nombre en BD
const IDX_A_DIA = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

// ── Modal de pago simulado ────────────────────────────────────────────────────
function PagoModal({ cita, onConfirmar, onCancelar, loading }) {
  const [form, setForm] = useState({ titular:'', numero:'', expiry:'', cvv:'', metodo:'tarjeta' });
  const [err,  setErr]  = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const fmtNum = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  const validar = () => {
    if (form.metodo === 'tarjeta') {
      if (!form.titular.trim()) return 'Ingresa el nombre del titular.';
      if (form.numero.replace(/\s/g,'').length < 16) return 'El número de tarjeta debe tener 16 dígitos.';
      if (!form.expiry.match(/^\d{2}\/\d{2}$/)) return 'Fecha de vencimiento inválida (MM/AA).';
      const [mm,yy] = form.expiry.split('/').map(Number);
      if (mm < 1 || mm > 12 || new Date(2000+yy, mm-1, 1) < new Date()) return 'La tarjeta está vencida.';
      if (form.cvv.replace(/\D/g,'').length < 3) return 'CVV inválido.';
    }
    return '';
  };

  const pagar = () => { const e = validar(); if (e) { setErr(e); return; } setErr(''); onConfirmar(); };

  return (
    <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,.55)', zIndex:1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold mb-1"><i className="bi bi-lock-fill text-success me-2" />Pago seguro (simulado)</h5>
              <p className="text-muted small mb-0">Simulación educativa — no se realizan cobros reales.</p>
            </div>
            <button className="btn-close" onClick={onCancelar} disabled={loading} />
          </div>
          <div className="modal-body pt-3">
            {err && <div className="alert alert-danger py-2 small mb-3">{err}</div>}

            {/* Resumen */}
            <div className="p-3 rounded-3 mb-3" style={{ background:'rgba(var(--bb-p-rgb),.06)', border:'1px solid rgba(var(--bb-p-rgb),.15)' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold small">{cita.tratamiento}</div>
                  <div className="text-muted" style={{ fontSize:'.78rem' }}>{cita.fecha} · {cita.hora_inicio} – {cita.hora_fin}</div>
                  <div className="text-muted" style={{ fontSize:'.78rem' }}><i className="bi bi-clock me-1" />Duración estimada: {cita.duracion} min</div>
                </div>
                <div className="fw-bold fs-5 text-primary">${parseFloat(cita.precio).toFixed(2)}</div>
              </div>
            </div>

            <div className="alert alert-warning py-2 px-3 mb-3 d-flex align-items-start gap-2" style={{ fontSize:'.78rem' }}>
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" />
              <span>La duración es <strong>estimada</strong>. El tiempo real puede variar según tu caso clínico. El consultorio te confirmará los detalles al llegar.</span>
            </div>

            {/* Método */}
            <div className="mb-3">
              <label className="form-label fw-medium small">Método de pago</label>
              <div className="d-flex gap-2">
                {[{ v:'tarjeta', icon:'bi-credit-card', label:'Tarjeta' },{ v:'oxxo', icon:'bi-shop', label:'OXXO Pay' }].map(m => (
                  <button key={m.v} type="button"
                    className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 ${form.metodo===m.v?'btn-primary':'btn-outline-secondary'}`}
                    onClick={() => setForm(f=>({...f,metodo:m.v}))}>
                    <i className={`bi ${m.icon}`}/>{m.label}
                  </button>
                ))}
              </div>
            </div>

            {form.metodo === 'tarjeta' ? (
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label fw-medium small">Número de tarjeta</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-credit-card"/></span>
                    <input className="form-control font-monospace" placeholder="1234 5678 9012 3456"
                      value={form.numero} onChange={e=>setForm(f=>({...f,numero:fmtNum(e.target.value)}))} maxLength={19}/>
                  </div>
                </div>
                <div>
                  <label className="form-label fw-medium small">Titular</label>
                  <input className="form-control" name="titular" placeholder="Nombre como aparece en la tarjeta" value={form.titular} onChange={handle}/>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-medium small">Vencimiento</label>
                    <input className="form-control font-monospace" placeholder="MM/AA"
                      value={form.expiry} onChange={e=>setForm(f=>({...f,expiry:fmtExp(e.target.value)}))} maxLength={5}/>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-medium small">CVV</label>
                    <input className="form-control font-monospace" name="cvv" placeholder="123"
                      value={form.cvv} onChange={e=>setForm(f=>({...f,cvv:e.target.value.replace(/\D/g,'').slice(0,4)}))} maxLength={4}/>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <div className="mb-2" style={{ width:72,height:72,borderRadius:12,margin:'0 auto',background:'rgba(var(--bb-p-rgb),.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <i className="bi bi-upc-scan" style={{ fontSize:'2rem',color:'var(--bb-p)' }}/>
                </div>
                <p className="text-muted small mb-0">Se generará una referencia OXXO.<br/>Tienes 72 horas para pagar en cualquier tienda OXXO.</p>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-outline-secondary" onClick={onCancelar} disabled={loading}>Cancelar</button>
            <button className="btn btn-success fw-semibold px-4 d-flex align-items-center gap-2" onClick={pagar} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm"/>Procesando…</> : <><i className="bi bi-shield-check"/>Pagar ${parseFloat(cita.precio).toFixed(2)}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Calendario semanal ────────────────────────────────────────────────────────
function CalendarioSemanal({ diasActivos, fechaSeleccionada, onSeleccionar, deshabilitado }) {
  const [semanaBase, setSemanaBase] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    const dia = hoy.getDay();
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    lunes.setHours(0,0,0,0);
    return lunes;
  });

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(semanaBase);
      d.setDate(semanaBase.getDate() + i);
      return d;
    });
  }, [semanaBase]);

  const irSemana = (delta) => {
    setSemanaBase(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  };

  const mesLabel = dias[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className={deshabilitado ? 'opacity-50 pe-none' : ''}>
      {/* Nav de semana */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => irSemana(-1)}>
          <i className="bi bi-chevron-left"/>
        </button>
        <span className="small fw-semibold text-capitalize">{mesLabel}</span>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => irSemana(1)}>
          <i className="bi bi-chevron-right"/>
        </button>
      </div>

      {/* Días */}
      <div className="d-flex gap-2">
        {dias.map((d, i) => {
          const iso       = fmtISO(d);
          const diaNombre = IDX_A_DIA[d.getDay()];
          const activo    = diasActivos.includes(diaNombre);
          const pasado    = iso < HOY;
          const selec     = iso === fechaSeleccionada;
          const disabled  = !activo || pasado;

          return (
            <button key={iso} type="button"
              disabled={disabled}
              onClick={() => onSeleccionar(iso)}
              className={`flex-fill rounded-3 border py-2 d-flex flex-column align-items-center gap-1 ${
                selec    ? 'btn-primary border-primary' :
                disabled ? 'border-secondary-subtle bg-transparent text-muted opacity-40' :
                           'border-secondary-subtle bg-transparent'
              }`}
              style={{ cursor: disabled ? 'default' : 'pointer', minWidth:0, transition:'all .15s' }}>
              <span style={{ fontSize:'.65rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', opacity: selec ? 1 : .7 }}>
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]}
              </span>
              <span style={{ fontSize:'1rem', fontWeight: selec ? 700 : 500, lineHeight:1 }}>
                {d.getDate()}
              </span>
              {!disabled && (
                <span style={{ width:5, height:5, borderRadius:'50%', background: selec ? 'rgba(255,255,255,.7)' : 'var(--bb-p)', flexShrink:0 }}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Timeline de slots ─────────────────────────────────────────────────────────
function TimelineSlots({ slots, slotSeleccionado, onSeleccionar, loading }) {
  if (loading) return <div className="py-3"><LoadingSpinner /></div>;
  if (!slots.length) return (
    <div className="text-center py-4">
      <i className="bi bi-calendar-x text-muted d-block mb-2" style={{ fontSize:'1.5rem' }}/>
      <p className="text-muted small mb-0">No hay horarios disponibles para este día.</p>
    </div>
  );

  const disponibles = slots.filter(s => s.disponible).length;
  const ocupados    = slots.filter(s => !s.disponible).length;

  return (
    <>
      {/* Leyenda + contador */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex gap-3" style={{ fontSize:'.75rem' }}>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width:10,height:10,borderRadius:3,background:'rgba(22,163,74,.25)',display:'inline-block' }}/>
            Disponible ({disponibles})
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width:10,height:10,borderRadius:3,background:'rgba(220,38,38,.18)',display:'inline-block' }}/>
            Ocupado ({ocupados})
          </span>
        </div>
      </div>

      {/* Grid de slots */}
      <div className="d-flex flex-wrap gap-2">
        {slots.map(s => {
          const selec = slotSeleccionado?.hora_inicio === s.hora_inicio;
          return (
            <button key={s.hora_inicio} type="button"
              disabled={!s.disponible}
              onClick={() => onSeleccionar(s)}
              className="rounded-3 border d-flex flex-column align-items-center gap-1"
              style={{
                width: 76, padding:'8px 4px',
                cursor: s.disponible ? 'pointer' : 'not-allowed',
                background: selec
                  ? 'var(--bb-p)'
                  : s.disponible
                  ? 'rgba(22,163,74,.1)'
                  : 'rgba(220,38,38,.07)',
                border: selec
                  ? '2px solid var(--bb-p)'
                  : s.disponible
                  ? '1.5px solid rgba(22,163,74,.4)'
                  : '1.5px solid rgba(220,38,38,.2)',
                transition: 'all .15s',
                opacity: s.disponible ? 1 : .65,
              }}>
              <span style={{
                fontSize:'.82rem', fontWeight: selec ? 700 : 600, lineHeight:1,
                color: selec ? '#fff' : s.disponible ? '#15803d' : '#dc2626',
                textDecoration: !s.disponible ? 'line-through' : 'none',
              }}>
                {s.hora_inicio}
              </span>
              <span style={{ fontSize:'.64rem', color: selec ? 'rgba(255,255,255,.8)' : s.disponible ? '#16a34a' : '#dc2626' }}>
                {s.disponible ? s.hora_fin : 'Ocupado'}
              </span>
              {selec && <i className="bi bi-check-circle-fill" style={{ color:'rgba(255,255,255,.9)', fontSize:'.7rem' }}/>}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
function waLink(telefono, nombre, consultorioNombre) {
  const num = (telefono ?? '').replace(/\D/g, '').replace(/^0/, '');
  const tel = num.startsWith('52') ? num : `52${num}`;
  const msg = encodeURIComponent(
    `Hola, soy ${nombre} y quisiera hacer una consulta sobre mis citas en ${consultorioNombre}.`
  );
  return `https://wa.me/${tel}?text=${msg}`;
}

export default function DetalleConsultorioPage() {
  const { id }    = useParams();
  const { user }  = useAuth();

  const [consultorio,  setConsultorio]  = useState(null);
  const [horariosDias, setHorariosDias] = useState([]);
  const [tratamiento,  setTratamiento]  = useState(null);
  const [fecha,        setFecha]        = useState('');
  const [slots,        setSlots]        = useState([]);
  const [slot,         setSlot]         = useState(null);
  const [notas,        setNotas]        = useState('');
  const [loadingPage,  setLoadingPage]  = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCita,  setLoadingCita]  = useState(false);
  const [citaCreada,   setCitaCreada]   = useState(null);
  const [error,        setError]        = useState('');
  const [showPago,     setShowPago]     = useState(false);

  const diasActivos = horariosDias.map(h => h.dia_semana);

  useEffect(() => {
    Promise.all([
      api.get(`/consultorios/${id}`),
      api.get(`/disponibilidad/dias?consultorio_id=${id}`),
    ])
      .then(([rc, rd]) => { setConsultorio(rc.data); setHorariosDias(rd.data.dias ?? []); })
      .catch(() => setError('No se pudo cargar el consultorio.'))
      .finally(() => setLoadingPage(false));
  }, [id]);

  useEffect(() => {
    if (!tratamiento || !fecha) { setSlots([]); setSlot(null); return; }
    setLoadingSlots(true); setSlot(null);
    api.get(`/disponibilidad?consultorio_id=${id}&tratamiento_id=${tratamiento.id}&fecha=${fecha}`)
      .then(r => setSlots(r.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [tratamiento, fecha, id]);

  const seleccionarTratamiento = (t) => { setTratamiento(t); setFecha(''); setSlots([]); setSlot(null); setError(''); };
  const seleccionarFecha = (f) => { setFecha(f); setSlot(null); };

  const confirmarCita = async () => {
    setLoadingCita(true);
    try {
      const { data } = await api.post('/citas', {
        consultorio_id: parseInt(id),
        tratamiento_id: tratamiento.id,
        fecha,
        hora_inicio: slot.hora_inicio,
        notas: notas.trim() || null,
      });
      setShowPago(false);
      setCitaCreada(data);
    } catch (err) {
      setShowPago(false);
      setError(err.message || 'No se pudo agendar la cita.');
    } finally {
      setLoadingCita(false);
    }
  };

  if (loadingPage) return <div className="py-5"><LoadingSpinner /></div>;
  if (!consultorio) return <AppAlert type="danger" message={error || 'Consultorio no encontrado.'} />;

  // Pantalla de éxito
  if (citaCreada) {
    return (
      <div className="text-center py-5">
        <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
          style={{ width:88, height:88, background:'rgba(22,163,74,.1)' }}>
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize:'2.8rem' }}/>
        </div>
        <h4 className="fw-bold mb-1">¡Cita confirmada!</h4>
        <p className="text-muted mb-1">{citaCreada.tratamiento?.nombre} en {consultorio.nombre}</p>
        <p className="text-muted mb-4 small">
          <i className="bi bi-calendar3 me-1"/>{new Date(citaCreada.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          <span className="mx-2">·</span>
          <i className="bi bi-clock me-1"/>{citaCreada.hora_inicio} – {citaCreada.hora_fin}
        </p>
        <div className="alert alert-info d-inline-flex align-items-center gap-2 mb-4 text-start px-4">
          <i className="bi bi-bell-fill flex-shrink-0"/>
          <span className="small">Recibirás un recordatorio 24 horas antes de tu cita.</span>
        </div>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link className="btn btn-primary px-4" href="/paciente/citas"><i className="bi bi-calendar3 me-2"/>Ver mis citas</Link>
          <Link className="btn btn-outline-secondary" href="/paciente/dashboard"><i className="bi bi-arrow-left me-2"/>Volver al panel</Link>
        </div>
      </div>
    );
  }

  const tratamientosActivos = consultorio.tratamientos?.filter(t => t.activo) ?? [];

  const calificacionProm = (() => {
    const cits = consultorio.citas?.filter(c => c.calificacion) ?? [];
    if (!cits.length) return null;
    return (cits.reduce((a,c) => a + c.calificacion, 0) / cits.length).toFixed(1);
  })();

  return (
    <>
      {showPago && slot && (
        <PagoModal
          cita={{ tratamiento:tratamiento.nombre, duracion:tratamiento.duracion_minutos, fecha, hora_inicio:slot.hora_inicio, hora_fin:slot.hora_fin, precio:tratamiento.precio }}
          onConfirmar={confirmarCita} onCancelar={() => setShowPago(false)} loading={loadingCita}
        />
      )}

      {/* Encabezado */}
      <div className="mb-4">
        <Link className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 mb-3" href="/paciente/dashboard">
          <i className="bi bi-arrow-left"/> Mi panel
        </Link>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-sm-row align-items-start gap-4">
              <div className="rounded-3 flex-shrink-0 overflow-hidden d-flex align-items-center justify-content-center"
                style={{ width:64,height:64,background:'rgba(var(--bb-p-rgb),.12)',fontSize:'1.6rem',color:'var(--bb-p)' }}>
                {consultorio.foto
                  ? <img src={consultorio.foto} alt={consultorio.nombre} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : <i className="bi bi-building"/>}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <h3 className="fw-bold mb-0">{consultorio.nombre}</h3>
                  <span className="badge text-bg-success d-flex align-items-center gap-1" style={{ fontSize:'.7rem' }}>
                    <i className="bi bi-patch-check-fill"/>Verificado
                  </span>
                  <AppBadge text={consultorio.membrecia?.plan ?? 'gratuito'}/>
                </div>
                <p className="text-muted small mb-1"><i className="bi bi-geo-alt me-1"/>{consultorio.direccion}, {consultorio.ciudad}</p>
                {consultorio.telefono && <p className="text-muted small mb-1"><i className="bi bi-telephone me-1"/>{consultorio.telefono}</p>}
                {consultorio.descripcion && <p className="text-muted small mb-2">{consultorio.descripcion}</p>}
                <div className="d-flex align-items-center gap-3 flex-wrap mt-1">
                  {calificacionProm && <span className="small fw-semibold"><i className="bi bi-star-fill text-warning me-1"/>{calificacionProm} / 5</span>}
                  <span className="small text-muted"><i className="bi bi-tooth me-1 text-primary"/>{tratamientosActivos.length} tratamientos</span>
                </div>
                {consultorio.telefono && (
                  <div className="mt-3">
                    <a
                      href={waLink(consultorio.telefono, user?.name, consultorio.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm d-inline-flex align-items-center gap-2"
                    >
                      <i className="bi bi-whatsapp" />
                      Contactar por WhatsApp
                    </a>
                    <span className="text-muted ms-3 small">Dudas, disponibilidad o cualquier consulta</span>
                  </div>
                )}
              </div>
            </div>

            {/* Horario de atención */}
            {horariosDias.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <p className="text-muted small fw-medium mb-2">Horario de atención:</p>
                <div className="d-flex flex-wrap gap-2">
                  {DIAS_ORDEN.map(dia => {
                    const h = horariosDias.find(hd => hd.dia_semana === dia);
                    return h ? (
                      <span key={dia} className="badge bg-body-secondary text-body border" style={{ fontSize:'.75rem' }}>
                        <span className="fw-semibold">{DIAS_ES[dia]}</span>
                        <span className="text-muted ms-1">{h.hora_inicio}–{h.hora_fin}</span>
                      </span>
                    ) : (
                      <span key={dia} className="badge bg-body-tertiary text-muted border" style={{ fontSize:'.75rem', opacity:.35 }}>{DIAS_ES[dia]}</span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AppAlert type="danger" message={error} onClose={() => setError('')}/>

      <div className="row g-4">
        {/* Columna izquierda */}
        <div className="col-lg-7">

          {/* Paso 1 — Tratamiento */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent border-bottom py-3">
              <span className="fw-semibold d-flex align-items-center gap-2">
                <span className="step-number">1</span>Selecciona un tratamiento
              </span>
            </div>
            <div className="card-body p-3">
              {tratamientosActivos.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0 small">Este consultorio aún no tiene tratamientos registrados.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {tratamientosActivos.map(t => {
                    const sel = tratamiento?.id === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => seleccionarTratamiento(t)}
                        className={`w-100 text-start rounded-3 p-3 border d-flex justify-content-between align-items-center ${sel ? 'border-primary' : 'border-secondary-subtle'}`}
                        style={{ background: sel ? 'rgba(var(--bb-p-rgb),.07)' : 'transparent', cursor:'pointer', transition:'all .15s' }}>
                        <div>
                          <div className="fw-semibold small">{t.nombre}</div>
                          <div className="text-muted" style={{ fontSize:'.78rem' }}><i className="bi bi-clock me-1"/>{t.duracion_minutos} min</div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-primary">${parseFloat(t.precio).toFixed(2)}</span>
                          {sel && <i className="bi bi-check-circle-fill text-primary"/>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Paso 2 — Calendario semanal */}
          <div className={`card border-0 shadow-sm mb-4 ${!tratamiento ? 'opacity-50' : ''}`}>
            <div className="card-header bg-transparent border-bottom py-3">
              <span className="fw-semibold d-flex align-items-center gap-2">
                <span className="step-number">2</span>Elige una fecha
              </span>
            </div>
            <div className="card-body p-3">
              <CalendarioSemanal
                diasActivos={diasActivos}
                fechaSeleccionada={fecha}
                onSeleccionar={seleccionarFecha}
                deshabilitado={!tratamiento}
              />
              {tratamiento && fecha && (
                <p className="text-muted small mt-3 mb-0">
                  {new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' })}
                </p>
              )}
            </div>
          </div>

          {/* Paso 3 — Timeline de slots */}
          <div className={`card border-0 shadow-sm ${(!tratamiento || !fecha) ? 'opacity-50' : ''}`}>
            <div className="card-header bg-transparent border-bottom py-3">
              <span className="fw-semibold d-flex align-items-center gap-2">
                <span className="step-number">3</span>Selecciona un horario
              </span>
            </div>
            <div className="card-body p-3">
              {!tratamiento || !fecha ? (
                <p className="text-muted text-center py-2 mb-0 small">Completa los pasos anteriores primero.</p>
              ) : (
                <TimelineSlots
                  slots={slots}
                  slotSeleccionado={slot}
                  onSeleccionar={setSlot}
                  loading={loadingSlots}
                />
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha — resumen */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm position-sticky" style={{ top:'1.5rem' }}>
            <div className="card-header bg-transparent border-bottom py-3">
              <span className="fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-clipboard2-check"/>Resumen de la cita
              </span>
            </div>
            <div className="card-body p-3">
              <ul className="list-unstyled mb-0">
                {[
                  { label:'Consultorio', value:consultorio.nombre },
                  { label:'Tratamiento', value:tratamiento?.nombre ?? '—' },
                  { label:'Fecha',       value:fecha ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX',{weekday:'short',day:'2-digit',month:'short'}) : '—' },
                  { label:'Hora',        value:slot ? `${slot.hora_inicio} – ${slot.hora_fin}` : '—' },
                ].map(r => (
                  <li key={r.label} className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">{r.label}</span>
                    <span className="fw-semibold small text-end">{r.value}</span>
                  </li>
                ))}
                <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                  <span className="text-muted small">Duración</span>
                  <div className="text-end">
                    <span className="fw-semibold small">{tratamiento ? `${tratamiento.duracion_minutos} min` : '—'}</span>
                    {tratamiento && <span className="d-block text-muted" style={{ fontSize:'.68rem' }}>estimada</span>}
                  </div>
                </li>
                <li className="d-flex justify-content-between py-2">
                  <span className="text-muted small">Total a pagar</span>
                  <span className="fw-bold text-primary">{tratamiento ? `$${parseFloat(tratamiento.precio).toFixed(2)}` : '—'}</span>
                </li>
              </ul>

              {tratamiento && (
                <div className="mt-3 d-flex align-items-start gap-2 p-2 rounded-2"
                  style={{ background:'rgba(217,119,6,.07)', border:'1px solid rgba(217,119,6,.2)', fontSize:'.73rem' }}>
                  <i className="bi bi-info-circle-fill flex-shrink-0 mt-1" style={{ color:'#d97706' }}/>
                  <span className="text-muted">La duración es <strong className="text-body">estimada</strong>. El tiempo real puede variar según tu caso. El consultorio te confirmará los detalles al llegar.</span>
                </div>
              )}

              <div className="mb-3 mt-3">
                <label className="form-label small">Notas <span className="text-muted">(opcional)</span></label>
                <textarea className="form-control form-control-sm" rows="2" maxLength={500}
                  placeholder="Ej. soy alérgico a la penicilina…" value={notas} onChange={e=>setNotas(e.target.value)}/>
              </div>

              <button type="button"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                disabled={!tratamiento || !fecha || !slot}
                onClick={() => setShowPago(true)}>
                <i className="bi bi-credit-card"/>Continuar al pago
              </button>

              {(!tratamiento || !fecha || !slot) && (
                <p className="text-muted text-center small mt-2 mb-0">Completa los 3 pasos para continuar.</p>
              )}

              <div className="mt-3 d-flex align-items-center gap-2 text-muted" style={{ fontSize:'.73rem' }}>
                <i className="bi bi-shield-check text-success flex-shrink-0"/>
                <span>Pago 100% seguro (simulado). Tus datos están protegidos.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

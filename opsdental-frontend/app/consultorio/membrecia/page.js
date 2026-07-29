'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppAlert from '@/components/ui/AppAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { diasHastaVencer } from '@/lib/utils';

const PLANES_INFO = [
  {
    key: 'basico',
    label: 'Básico',
    precio: 'Gratis',
    color: '#64748b',
    bg: 'rgba(100,116,139,.08)',
    border: '#64748b',
    icon: 'bi-gift-fill',
    funciones: [
      'Hasta 20 citas por mes',
      'Gestión de horarios',
      'Hasta 5 tratamientos',
      'Notificaciones por correo al paciente',
    ],
    limitadas: [
      'Sin estadísticas avanzadas',
      'Sin notificaciones WhatsApp',
    ],
  },
  {
    key: 'premium',
    label: 'Premium',
    precio: '$299 / mes',
    color: 'var(--bb-primary)',
    bg: 'rgba(var(--bb-primary-rgb),.06)',
    border: 'var(--bb-primary)',
    icon: 'bi-star-fill',
    recomendado: true,
    funciones: [
      'Hasta 100 citas por mes',
      'Gestión de horarios',
      'Hasta 20 tratamientos',
      'Estadísticas de citas y pacientes',
      'Notificaciones por correo al paciente',
    ],
    limitadas: [
      'Sin notificaciones WhatsApp',
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    precio: '$599 / mes',
    color: '#d97706',
    bg: 'rgba(217,119,6,.06)',
    border: '#d97706',
    icon: 'bi-lightning-charge-fill',
    funciones: [
      'Citas ilimitadas',
      'Gestión de horarios',
      'Tratamientos ilimitados',
      'Estadísticas avanzadas',
      'Notificaciones por correo al paciente',
      'Notificaciones por WhatsApp',
    ],
    limitadas: [],
  },
];

export default function MembreciaPage() {
  const { user, setUser } = useAuth();
  const [membrecia,  setMembrecia]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [guardando,  setGuardando]  = useState(null);
  const [msg,        setMsg]        = useState({ text: '', type: 'success' });

  const cargar = () => {
    setLoading(true);
    api.get('/consultorio/membrecia')
      .then(r => setMembrecia(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const seleccionarPlan = async (plan) => {
    if (membrecia?.plan === plan) return;
    setGuardando(plan);
    try {
      const r = await api.put('/consultorio/membrecia/plan', { plan });
      setMembrecia(r.data);
      // Actualiza el contexto del usuario para que el badge del navbar se actualice
      setUser(u => ({
        ...u,
        consultorio: { ...u.consultorio, membrecia: r.data },
      }));
      setMsg({ text: `Plan ${plan} activado correctamente.`, type: 'success' });
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    } finally {
      setGuardando(null);
    }
  };

  const diasRestantes = diasHastaVencer(membrecia?.fecha_vencimiento);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Encabezado */}
      <div className="mb-5">
        <h3 className="fw-bold mb-1">Membresía</h3>
        <p className="text-muted small mb-0">
          Elige el plan que mejor se adapte a tu consultorio. El cambio se aplica de inmediato.
        </p>
      </div>

      <AppAlert type={msg.type} message={msg.text} onClose={() => setMsg({ text: '', type: 'success' })} />

      {/* Plan actual */}
      {membrecia && (
        <div className="card border-0 shadow-sm mb-5">
          <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 48, height: 48, background: 'rgba(var(--bb-primary-rgb),.1)' }}>
                <i className="bi bi-credit-card-fill text-primary fs-4" />
              </div>
              <div>
                <div className="text-muted small mb-1">Plan actual</div>
                <div className="fw-bold fs-5">{PLANES_INFO.find(p => p.key === membrecia.plan)?.label ?? membrecia.plan}</div>
                <div className="text-muted small">
                  {membrecia.limite_citas_mes >= 9999 ? 'Citas ilimitadas' : `${membrecia.limite_citas_mes} citas / mes`}
                </div>
              </div>
            </div>
            <div className="text-end">
              {diasRestantes !== null && (
                <div className={`small ${diasRestantes <= 7 ? 'text-danger fw-semibold' : 'text-muted'}`}>
                  {diasRestantes <= 0
                    ? <><i className="bi bi-exclamation-triangle-fill me-1" />Membresía vencida</>
                    : <>Vence en <strong>{diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</strong></>}
                </div>
              )}
              {membrecia.fecha_vencimiento && (
                <div className="text-muted" style={{ fontSize: '.75rem' }}>
                  {new Date(membrecia.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de planes */}
      <div className="row g-4">
        {PLANES_INFO.map(p => {
          const esActual  = membrecia?.plan === p.key;
          const cargando  = guardando === p.key;

          return (
            <div key={p.key} className="col-12 col-md-4">
              <div
                className="card h-100 border-2"
                style={{
                  borderColor: esActual ? p.border : 'var(--bs-border-color)',
                  background:  esActual ? p.bg : 'transparent',
                  transition: 'border-color .2s, background .2s',
                }}
              >
                {p.recomendado && (
                  <div
                    className="text-center py-1 fw-semibold"
                    style={{ background: p.border, color: '#fff', fontSize: '.75rem', letterSpacing: '.06em' }}
                  >
                    RECOMENDADO
                  </div>
                )}
                <div className="card-body p-4 d-flex flex-column">

                  {/* Nombre + icono */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className={`bi ${p.icon} fs-5`} style={{ color: p.color }} />
                    <span className="fw-bold fs-5">{p.label}</span>
                  </div>

                  {/* Precio */}
                  <div className="mb-4">
                    <span className="fw-bold" style={{ fontSize: '1.6rem', color: p.color }}>{p.precio}</span>
                  </div>

                  {/* Funciones incluidas */}
                  <ul className="list-unstyled flex-grow-1 mb-4">
                    {p.funciones.map(f => (
                      <li key={f} className="d-flex align-items-start gap-2 mb-2 small">
                        <i className="bi bi-check-circle-fill mt-1 flex-shrink-0" style={{ color: '#16a34a' }} />
                        {f}
                      </li>
                    ))}
                    {p.limitadas.map(f => (
                      <li key={f} className="d-flex align-items-start gap-2 mb-2 small text-muted">
                        <i className="bi bi-dash-circle mt-1 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Botón */}
                  {esActual ? (
                    <button className="btn btn-outline-secondary w-100" disabled>
                      <i className="bi bi-check2 me-1" />Plan actual
                    </button>
                  ) : (
                    <button
                      className="btn w-100"
                      style={{
                        background: p.color,
                        color: '#fff',
                        fontWeight: 600,
                        opacity: cargando ? .7 : 1,
                      }}
                      onClick={() => seleccionarPlan(p.key)}
                      disabled={!!guardando}
                    >
                      {cargando
                        ? <><span className="spinner-border spinner-border-sm me-2" />Activando…</>
                        : p.key === 'basico' ? 'Cambiar a Básico' : `Activar ${p.label}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-muted small mt-4">
        <i className="bi bi-shield-lock-fill me-1 text-primary" />
        Los cambios de plan son inmediatos. Puedes cambiar de plan en cualquier momento.
      </p>
    </>
  );
}

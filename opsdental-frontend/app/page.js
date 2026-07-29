import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';

const PASOS = [
  { num:'01', icon:'bi-search',       title:'Encuentra tu consultorio', text:'Busca por ciudad, consulta tratamientos y compara precios sin compromiso.' },
  { num:'02', icon:'bi-calendar3',    title:'Elige fecha y horario',    text:'Consulta disponibilidad en tiempo real y elige el horario que más te convenga.' },
  { num:'03', icon:'bi-check2-circle',title:'Confirma tu cita',        text:'Recibe confirmación inmediata. Sin llamadas, sin esperas.' },
];

const BENEFICIOS = [
  { icon:'bi-shield-check',    title:'Sin conflictos de horario',    text:'El sistema verifica la disponibilidad automáticamente para evitar duplicados.' },
  { icon:'bi-bell',            title:'Notificaciones automáticas',   text:'Confirmación al agendar y recordatorio 24 horas antes de tu cita.' },
  { icon:'bi-bar-chart-line',  title:'Panel para consultorios',      text:'Gestiona agenda, tratamientos, horarios y membrecías en un solo lugar.' },
];

const DELAYS = ['bb-fade-up-d1','bb-fade-up-d2','bb-fade-up-d3'];

const iconBox = { width:48, height:48, borderRadius:10, flexShrink:0,
  display:'flex', alignItems:'center', justifyContent:'center',
  background:'rgba(var(--bb-p-rgb),.09)' };


export default function HomePage() {
  return (
    <PublicLayout>
      <main>

        {/* HERO */}
        <section className="hero-section text-white py-5" aria-label="Inicio">
          <div className="container py-4 py-lg-5">
            <div className="row align-items-center g-5">

              <div className="col-lg-7">
                <div className="d-flex align-items-center gap-3 mb-4 bb-fade-up">
                  <div aria-hidden="true" style={{ height:1, width:24, background:'rgba(255,255,255,.45)', flexShrink:0 }} />
                  <p className="small fw-semibold text-uppercase mb-0" style={{ letterSpacing:'.18em', fontSize:'.7rem', opacity:.85 }}>
                    Plataforma de citas dentales
                  </p>
                </div>

                <h1 className="display-4 fw-bold lh-sm mb-4 bb-fade-up bb-fade-up-d1">
                  Agenda tu cita dental<br className="d-none d-md-block" /> en segundos
                </h1>

                <p className="fs-5 mb-5 bb-fade-up bb-fade-up-d2" style={{ opacity:.82, maxWidth:460, lineHeight:1.65 }}>
                  Consulta disponibilidad en tiempo real, elige tu tratamiento y confirma sin llamadas ni esperas.
                </p>

                <div className="d-flex flex-column flex-sm-row gap-3 bb-fade-up bb-fade-up-d3">
                  <Link className="btn btn-light btn-lg fw-semibold px-5" href="/register?rol=paciente">
                    <i className="bi bi-person me-2" aria-hidden="true" />Soy paciente
                  </Link>
                  <Link className="btn btn-outline-light btn-lg px-4" href="/register?rol=consultorio">
                    <i className="bi bi-building me-2" aria-hidden="true" />Tengo un consultorio
                  </Link>
                </div>
              </div>

              <div className="col-lg-5 bb-fade-up bb-fade-up-d3">
                <div className="ms-lg-4">
                  {[
                    { val:'3',    label:'pasos para agendar tu cita' },
                    { val:'24/7', label:'disponibilidad en línea' },
                    { val:'100%', label:'sin llamadas telefónicas' },
                  ].map((s, i) => (
                    <div key={s.label}
                         className={`d-flex align-items-center gap-4 py-4 ${i > 0 ? 'border-top' : ''}`}
                         style={{ borderColor:'rgba(255,255,255,.12)' }}>
                      <div className="display-5 fw-bold lh-1 text-nowrap" style={{ minWidth:'5rem' }}>{s.val}</div>
                      <div style={{ opacity:.82, lineHeight:1.4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="py-5 py-lg-6" aria-labelledby="h-como">
          <div className="container">
            <div className="text-center mb-5 bb-fade-up">
              <h2 id="h-como" className="fw-bold mb-3 bb-heading-line">Cómo funciona</h2>
              <p className="text-muted" style={{ maxWidth:420, margin:'12px auto 0' }}>Tres pasos para tener tu cita agendada.</p>
            </div>
            <div className="row g-4">
              {PASOS.map((p, i) => (
                <div key={p.num} className={`col-md-4 bb-fade-up ${DELAYS[i]}`}>
                  <div className="card border-0 p-4 h-100" style={{ position:'relative', overflow:'hidden' }}>
                    <div aria-hidden="true" className="card-bg-num">{p.num}</div>
                    <div style={iconBox} className="mb-3" aria-hidden="true">
                      <i className={`bi ${p.icon} text-primary`} style={{ fontSize:'1.25rem' }} />
                    </div>
                    <h3 className="h6 fw-bold mb-2">{p.title}</h3>
                    <p className="text-muted small mb-0" style={{ lineHeight:1.65 }}>{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="py-5 bg-body-secondary" aria-labelledby="h-por-que">
          <div className="container">
            <div className="text-center mb-5 bb-fade-up">
              <h2 id="h-por-que" className="fw-bold mb-3 bb-heading-line">¿Por qué OpsDental?</h2>
              <p className="text-muted" style={{ maxWidth:420, margin:'12px auto 0' }}>Diseñado para pacientes y consultorios dentales.</p>
            </div>
            <div className="row g-4">
              {BENEFICIOS.map((b, i) => (
                <div key={b.title} className={`col-md-4 bb-fade-up ${DELAYS[i]}`}>
                  <div className="card h-100 border-0 p-4">
                    <div style={iconBox} className="mb-3" aria-hidden="true">
                      <i className={`bi ${b.icon} text-primary`} style={{ fontSize:'1.25rem' }} />
                    </div>
                    <h3 className="h6 fw-bold mb-2">{b.title}</h3>
                    <p className="text-muted small mb-0" style={{ lineHeight:1.65 }}>{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

    </PublicLayout>
  );
}


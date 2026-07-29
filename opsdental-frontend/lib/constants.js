export const DIAS_ORDEN = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];

// Abreviaturas de 1 letra — para tarjetas del listado de consultorios
export const DIAS_ABBR = { lunes:'L', martes:'M', miercoles:'X', jueves:'J', viernes:'V', sabado:'S', domingo:'D' };

// Abreviaturas de 3 letras — para el calendario semanal
export const DIAS_SHORT = { lunes:'Lun', martes:'Mar', miercoles:'Mié', jueves:'Jue', viernes:'Vie', sabado:'Sáb', domingo:'Dom' };

// Array con label para selects/formularios (horarios)
export const DIAS = [
  { key: 'lunes',     label: 'Lunes'   },
  { key: 'martes',    label: 'Martes'  },
  { key: 'miercoles', label: 'Miér.'  },
  { key: 'jueves',    label: 'Jueves'  },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado'  },
  { key: 'domingo',   label: 'Domingo' },
];

export const ESTADO_COLOR = {
  pendiente:  { text: '#d97706', bg: 'rgba(217,119,6,.1)',   icon: 'bi-hourglass-split' },
  confirmada: { text: '#16a34a', bg: 'rgba(22,163,74,.1)',   icon: 'bi-check2-circle'  },
  completada: { text: '#64748b', bg: 'rgba(100,116,139,.1)', icon: 'bi-check2-all'     },
  cancelada:  { text: '#dc2626', bg: 'rgba(220,38,38,.1)',   icon: 'bi-x-circle'       },
};

// Variantes Bootstrap para badges (AppBadge)
export const BADGE_VARIANT = {
  pendiente:  'warning',
  confirmada: 'success',
  cancelada:  'danger',
  completada: 'secondary',
  activa:     'success',
  vencida:    'danger',
  gratuito:   'secondary',
  basico:     'secondary',
  premium:    'primary',
  pro:        'warning',
};

// Etiquetas legibles para planes (con acento)
export const PLAN_LABEL = {
  gratuito: 'Gratuito',
  basico:   'Básico',
  premium:  'Premium',
  pro:      'Pro',
};

// Colores de acento para cada plan (gráficas / barras de progreso)
export const PLAN_COLOR = {
  gratuito: '#64748b',
  basico:   'var(--bb-primary)',
  premium:  '#d97706',
  pro:      '#16a34a',
};

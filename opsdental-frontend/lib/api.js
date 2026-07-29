// En el navegador: proxy de Vercel (evita CORS, funciona con cualquier alias de URL)
// En SSR/servidor: Railway directo
export const API_BASE = typeof window !== 'undefined'
  ? '/api/proxy'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');

const TIMEOUT_MS  = 15_000;  // 15s por intento
const RETRY_DELAY = 4_000;
const MAX_RETRIES = 2;        // 3 intentos en total → máximo ~45s

async function request(method, endpoint, body = null, attempt = 0) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bb-token') : null;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body !== null ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY));
      return request(method, endpoint, body, attempt + 1);
    }
    const err = new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
    err.status = 0;
    throw err;
  }
  clearTimeout(timer);

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bb-token');
      window.dispatchEvent(new CustomEvent('bb:session-expired'));
    }
    const err = new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
    err.status = 401;
    throw err;
  }

  let data = null;
  if (res.status !== 204) {
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  }

  if (!res.ok) {
    const err = new Error(data?.message || 'Error en la solicitud.');
    err.errors = data?.errors ?? {};
    err.status  = res.status;
    throw err;
  }

  return { data, status: res.status };
}

export const api = {
  get:    (url)       => request('GET',    url),
  post:   (url, body) => request('POST',   url, body),
  put:    (url, body) => request('PUT',    url, body),
  patch:  (url, body) => request('PATCH',  url, body),
  delete: (url)       => request('DELETE', url),
};

// Proxy transparente: browser → Vercel (mismo origen) → Railway (sin CORS)
const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function handler(req, { params }) {
  const segments = (await params).path;
  const path     = segments.join('/');
  const search   = req.nextUrl.search ?? '';
  const url      = `${BACKEND}/${path}${search}`;

  const headers = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    'Accept':       'application/json',
  };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

  const res  = await fetch(url, { method: req.method, headers, body });
  const text = res.status !== 204 ? await res.text() : '';

  return new Response(text, {
    status:  res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;

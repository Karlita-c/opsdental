/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // El service worker debe poder actualizarse sin quedar atrapado en caché
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // El manifest debe ser accesible sin restricciones
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        // Páginas HTML: nunca cachear en el navegador
        // Los chunks JS (_next/static) se excluyen — ya tienen hash único por build
        source: '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Páginas HTML: nunca cachear en el navegador
        // Los chunks JS (_next/static) se excluyen — ya tienen hash único por build
        source: '/((?!_next/static|_next/image|favicon\\.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

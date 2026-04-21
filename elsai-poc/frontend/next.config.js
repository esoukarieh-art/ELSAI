/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Force l'inclusion du guide admin dans l'output standalone (lu via fs à
  // l'exécution par app/admin/help/page.tsx — Next ne trace pas les chemins
  // dynamiques, donc on l'explicite ici).
  outputFileTracingIncludes: {
    "/admin/help": ["./content/admin-guide.md"],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/cas-usage",
        destination: "/exemples-concrets",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

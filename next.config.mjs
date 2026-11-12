/** @type {import('next').NextConfig} */

/* ---------------------------------------------------------
   Domain / API settings (all optional, set in .env or in the
   Vercel project settings):

   NEXT_PUBLIC_API_BASE_URL  where the browser calls the API
   API_PROXY_TARGET          when set, Next.js forwards /api/v1/* to
                             this backend origin (server side), so the
                             browser only talks to YOUR domain:
                               NEXT_PUBLIC_API_BASE_URL=/api/v1
                               API_PROXY_TARGET=https://api.yourdomain.com
                             No CORS setup needed in that mode.
--------------------------------------------------------- */

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";
const proxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, "");

const apiHost = (() => {
  try {
    return apiBase.startsWith("http") ? new URL(apiBase) : null;
  } catch {
    return null;
  }
})();

const nextConfig = {
  images: {
    /* Food photos come from the FoodMart backend (local uploads or Cloudinary). */
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
      ...(apiHost ? [{ protocol: apiHost.protocol.replace(":", ""), hostname: apiHost.hostname, ...(apiHost.port ? { port: apiHost.port } : {}) }] : []),
    ],
  },
  async rewrites() {
    if (!proxyTarget) return [];
    return [
      { source: "/api/v1/:path*", destination: `${proxyTarget}/api/v1/:path*` },
      { source: "/uploads/:path*", destination: `${proxyTarget}/uploads/:path*` },
    ];
  },
};

export default nextConfig;

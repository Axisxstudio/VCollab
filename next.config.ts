import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|assets|logo.png|.*\\.).*)",
        destination: "/index.html",
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the Vite SPA for all non-API, non-Next routes
  async rewrites() {
    return {
      fallback: [
        {
          source: "/:path*",
          destination: "/index.html",
        },
      ],
    };
  },
};

export default nextConfig;

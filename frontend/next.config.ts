import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    // Local development only. Docker's public Nginx gateway handles these routes.
    const backend = process.env.API_ORIGIN;
    return backend
      ? ["api", "books", "users"].map((path) => ({
          source: `/${path}/:path*`,
          destination: `${backend}/${path}/:path*`,
        }))
      : [];
  },
};
export default nextConfig;

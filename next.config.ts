import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs before filesystem routes, so "/" serves the mirrored
      // marketing landing page (public/site/index.html) instead of any app route.
      beforeFiles: [{ source: "/", destination: "/site/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

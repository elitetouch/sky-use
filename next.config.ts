import type { NextConfig } from "next";

/**
 * Security headers sent with every response. Chosen to harden the app without
 * restricting the scripts/styles/images it legitimately loads (the marketing
 * page's inline + ad scripts, uploaded images from the API, the live NIN
 * camera), so nothing breaks:
 *
 * - CSP (minimal): no framing (clickjacking), no <base> hijacking, no plugins,
 *   forms may only submit to this site.
 * - HSTS: browsers always use HTTPS for two years (incl. subdomains).
 * - nosniff / frame / referrer / permissions / opener isolation.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Camera is needed for the live NIN selfie; everything else is off.
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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

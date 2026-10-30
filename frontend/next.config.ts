import type { NextConfig } from "next";

/**
 * Browser hardening for every page. The CSP limits framing, plugins, <base>
 * and form targets only: scripts are left to Next.js, whose inline runtime
 * would need per-request nonces to lock down further.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  // Browsers ignore it over plain HTTP, so it is harmless in development.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/**
 * The app is normally reached at localhost, but Herd resolves `.test`
 * hostnames too. Next's dev server blocks cross-origin
 * `/_next/*` requests by default, which breaks hydration on any host other
 * than the one it booted on. Development only — ignored in production builds.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.test", "*.localhost"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

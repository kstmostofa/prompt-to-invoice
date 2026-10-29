import type { NextConfig } from "next";

/**
 * The app is normally reached at localhost, but Herd resolves `.test`
 * hostnames too. Next's dev server blocks cross-origin
 * `/_next/*` requests by default, which breaks hydration on any host other
 * than the one it booted on. Development only — ignored in production builds.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.test", "*.localhost"],
};

export default nextConfig;

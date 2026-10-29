import { headers } from "next/headers";

/**
 * Tells the API who the visitor is.
 *
 * Every API call leaves this server, so without it the API sees the server's
 * own IP on every audit log row, rate limit and fraud check. nginx puts the
 * browser's address in X-Real-IP (from the TCP connection, so a browser
 * cannot forge it — unlike the X-Forwarded-For it sends us); we pass it on
 * as X-Forwarded-For, which the API believes only from its trusted proxies
 * (api/config/trustedproxy.php). No X-Real-IP (local dev without nginx)
 * sends nothing, and the API falls back to the connection's address.
 */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  let ip: string | null;
  try {
    ip = (await headers()).get("x-real-ip");
  } catch {
    // Outside a request (build, static generation) there is no visitor.
    return {};
  }
  return ip?.trim() ? { "X-Forwarded-For": ip.trim() } : {};
}

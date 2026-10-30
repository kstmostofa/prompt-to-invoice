import "server-only";
import { Plan } from "@/types/api";
import { PUBLIC_PLANS_URL } from "./api-urls";

/**
 * The active plans for the pricing section. Cached for five minutes; if the
 * API is down the landing page still renders, just without prices.
 */
export async function getPublicPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(PUBLIC_PLANS_URL, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const body = await res.json();
    return body.data as Plan[];
  } catch {
    return [];
  }
}

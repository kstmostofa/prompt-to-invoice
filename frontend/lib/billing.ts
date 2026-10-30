"use server";

import { Billing } from "@/types/api";
import { ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import { BILLING_CHECKOUT, BILLING_PORTAL, GET_BILLING } from "./api-urls";

/** A Stripe-hosted page to send the owner to, or why not. */
export type BillingRedirect = { data: { url: string } } | ValidationError | { error: string };

export const getBilling = async (): Promise<{ data: Billing }> => {
  return FetchApi.get(GET_BILLING);
};

// Thrown errors lose their message on the way back from a server action, so
// the API's message (e.g. "Online billing is not set up yet.") is returned.
const redirectTo = async (request: () => Promise<{ data: { url: string } } | ValidationError>): Promise<BillingRedirect> => {
  try {
    return await request();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong. Please try again." };
  }
};

export const startCheckout = async (plan: string): Promise<BillingRedirect> => {
  return redirectTo(() => FetchApi.post(BILLING_CHECKOUT, { plan }));
};

export const openBillingPortal = async (): Promise<BillingRedirect> => {
  return redirectTo(() => FetchApi.post(BILLING_PORTAL, {}));
};

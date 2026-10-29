import "server-only";
import { Invoice } from "@/types/api";
import { PUBLIC_INVOICE_URL } from "./api-urls";

/** The client's view of a sent invoice, by its token. No session involved. */
export async function getPublicInvoice(token: string): Promise<Invoice | null> {
  const res = await fetch(PUBLIC_INVOICE_URL(token), { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.json();
  return body.data as Invoice;
}

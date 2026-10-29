"use server";

import { ClientOption, EmailInvoicePayload, Invoice, InvoiceDefaults, InvoiceDraft, InvoicePayload } from "@/types/api";
import { PaginatedData, SearchParams, ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import {
  CREATE_INVOICE,
  DELETE_INVOICE,
  DUPLICATE_INVOICE,
  EMAIL_INVOICE,
  GENERATE_INVOICE,
  GET_CLIENT_OPTIONS,
  GET_INVOICE,
  GET_INVOICE_DEFAULTS,
  GET_INVOICES,
  MARK_INVOICE_PAID,
  MARK_INVOICE_UNPAID,
  SEND_INVOICE,
  UPDATE_INVOICE,
  VOID_INVOICE,
} from "./api-urls";
import { parseQueryParam } from "./helper";

type Saved = { data: Invoice } | ValidationError;

export const getInvoices = async (searchParams: SearchParams): Promise<PaginatedData<Invoice>> => {
  const query = parseQueryParam(searchParams);
  return FetchApi.get(query ? `${GET_INVOICES}${query}` : GET_INVOICES);
};

export const getInvoice = async (id: number): Promise<{ data: Invoice }> => {
  return FetchApi.get(GET_INVOICE(id));
};

export const getInvoiceDefaults = async (): Promise<{ data: InvoiceDefaults }> => {
  return FetchApi.get(GET_INVOICE_DEFAULTS);
};

export const getClientOptions = async (): Promise<{ data: ClientOption[] }> => {
  return FetchApi.get(GET_CLIENT_OPTIONS);
};

export const createInvoice = async (data: InvoicePayload): Promise<Saved> => {
  return FetchApi.post(CREATE_INVOICE, data);
};

export const updateInvoice = async (id: number, data: InvoicePayload): Promise<Saved> => {
  return FetchApi.put(UPDATE_INVOICE(id), data);
};

export const deleteInvoice = async (id: number): Promise<null | ValidationError> => {
  return FetchApi.delete(DELETE_INVOICE(id));
};

export const markInvoiceSent = async (id: number): Promise<Saved> => {
  return FetchApi.post(SEND_INVOICE(id));
};

export const markInvoicePaid = async (id: number, paidAt?: string): Promise<Saved> => {
  return FetchApi.post(MARK_INVOICE_PAID(id), paidAt ? { paid_at: paidAt } : {});
};

export const markInvoiceUnpaid = async (id: number): Promise<Saved> => {
  return FetchApi.post(MARK_INVOICE_UNPAID(id));
};

export const voidInvoice = async (id: number): Promise<Saved> => {
  return FetchApi.post(VOID_INVOICE(id));
};

export const duplicateInvoice = async (id: number): Promise<Saved> => {
  return FetchApi.post(DUPLICATE_INVOICE(id));
};

export type DraftResult = { success: true; data: InvoiceDraft } | { success: false; message: string };

/**
 * An AI draft from a description of the work. Never throws: server action
 * errors are masked in production, so failures come back as a message.
 */
export const generateInvoiceDraft = async (prompt: string): Promise<DraftResult> => {
  try {
    const response = await FetchApi.post<{ data: InvoiceDraft } | ValidationError>(GENERATE_INVOICE, { prompt });
    if ("errors" in response) {
      return { success: false, message: Object.values(response.errors).flat()[0] ?? response.message };
    }
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error && error.message ? error.message : "AI generation is not available right now.",
    };
  }
};

export const emailInvoice = async (id: number, data: EmailInvoicePayload): Promise<Saved> => {
  return FetchApi.post(EMAIL_INVOICE(id), data);
};

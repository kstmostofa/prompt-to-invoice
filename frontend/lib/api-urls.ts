export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://prompt-to-invoice-api.test/v1";

// PUBLIC ROUTES (absolute, unauthenticated)
export const PUBLIC_PLANS_URL = `${BASE_API_URL}/plans`;
export const PUBLIC_INVOICE_URL = (token: string) => `${BASE_API_URL}/public/invoices/${encodeURIComponent(token)}`;
export const PUBLIC_INVOICE_PDF_URL = (token: string) => `${BASE_API_URL}/public/invoices/${encodeURIComponent(token)}/pdf`;
export const VERIFY_EMAIL_URL = (id: string, hash: string) =>
  `${BASE_API_URL}/auth/verify-email/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`;

// AUTH ROUTES (absolute — used outside the FetchApi client too)
export const LOGIN_URL = `${BASE_API_URL}/auth/login`;
export const REGISTER_URL = `${BASE_API_URL}/auth/register`;
export const LOGOUT_URL = `${BASE_API_URL}/auth/logout`;
export const PROFILE_URL = "/auth/user";
export const UPDATE_PROFILE = "/auth/user";
export const FORGOT_PASSWORD = "/auth/forgot-password";
export const RESET_PASSWORD = "/auth/reset-password";
export const CHANGE_PASSWORD = "/auth/user/password";
export const RESEND_VERIFICATION = "/auth/email/verification-notification";

// WORKSPACE (scoped to the signed-in user's current workspace)
export const GET_DASHBOARD = "/dashboard";
export const GET_WORKSPACE = "/workspace";
export const UPDATE_WORKSPACE = "/workspace";
export const SWITCH_WORKSPACE = (id: number) => `/workspaces/${id}/switch`;

export const GET_BUSINESS_PROFILE = "/business-profile";
export const UPDATE_BUSINESS_PROFILE = "/business-profile";
export const BUSINESS_PROFILE_LOGO = "/business-profile/logo";

export const GET_CLIENTS = "/clients";
export const GET_CLIENT_OPTIONS = "/clients/options";
export const CREATE_CLIENT = "/clients";
export const GET_CLIENT = (id: number) => `/clients/${id}`;
export const UPDATE_CLIENT = (id: number) => `/clients/${id}`;
export const DELETE_CLIENT = (id: number) => `/clients/${id}`;

export const GET_INVOICES = "/invoices";
export const GET_INVOICE_DEFAULTS = "/invoices/defaults";
export const GENERATE_INVOICE = "/invoices/generate";
export const EMAIL_INVOICE = (id: number) => `/invoices/${id}/email`;
export const CREATE_INVOICE = "/invoices";
export const GET_INVOICE = (id: number) => `/invoices/${id}`;
export const UPDATE_INVOICE = (id: number) => `/invoices/${id}`;
export const DELETE_INVOICE = (id: number) => `/invoices/${id}`;
export const SEND_INVOICE = (id: number) => `/invoices/${id}/send`;
export const MARK_INVOICE_PAID = (id: number) => `/invoices/${id}/mark-paid`;
export const MARK_INVOICE_UNPAID = (id: number) => `/invoices/${id}/mark-unpaid`;
export const VOID_INVOICE = (id: number) => `/invoices/${id}/void`;
export const DUPLICATE_INVOICE = (id: number) => `/invoices/${id}/duplicate`;
export const GET_INVOICE_PDF = (id: number) => `/invoices/${id}/pdf`;

// PLATFORM ADMIN
export const GET_ADMIN_DASHBOARD = "/admin/dashboard";

export const GET_ADMIN_WORKSPACES = "/admin/workspaces";
export const GET_ADMIN_WORKSPACE = (id: number) => `/admin/workspaces/${id}`;
export const SUSPEND_WORKSPACE = (id: number) => `/admin/workspaces/${id}/suspend`;
export const ACTIVATE_WORKSPACE = (id: number) => `/admin/workspaces/${id}/activate`;
export const CHANGE_WORKSPACE_PLAN = (id: number) => `/admin/workspaces/${id}/plan`;

export const GET_ADMIN_USERS = "/admin/users";
export const ACTIVATE_USER = (id: number) => `/admin/users/${id}/activate`;
export const DEACTIVATE_USER = (id: number) => `/admin/users/${id}/deactivate`;

export const GET_PLANS = "/admin/plans";
export const CREATE_PLAN = "/admin/plans";
export const UPDATE_PLAN = (id: number) => `/admin/plans/${id}`;
export const DELETE_PLAN = (id: number) => `/admin/plans/${id}`;

export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceStatus = "active" | "suspended";
export type Currency = "USD" | "EUR";

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  /** Null: custom pricing. */
  monthly_price: string | null;
  currency: string;
  monthly_invoice_limit: number | null;
  business_profile_limit: number | null;
  seat_limit: number | null;
  has_ai_generation: boolean;
  features: string[];
  is_active: boolean;
  sort_order: number;
  workspaces_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PlanPayload {
  name: string;
  slug: string;
  description?: string | null;
  monthly_price?: number | null;
  monthly_invoice_limit?: number | null;
  business_profile_limit?: number | null;
  seat_limit?: number | null;
  has_ai_generation: boolean;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  suspended_at: string | null;
  role?: WorkspaceRole;
  plan?: Plan | null;
  owner?: { id: number; name: string; email: string };
  members_count?: number;
  clients_count?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  current_workspace_id: number | null;
  workspaces?: Workspace[];
  workspaces_count?: number;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember extends User {
  role: WorkspaceRole;
}

export interface BusinessProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  logo_url: string | null;
  currency: Currency;
  default_tax_rate: string;
  payment_terms_days: number;
  invoice_prefix: string;
  next_invoice_number: number;
  invoice_footer: string | null;
  is_default: boolean;
  updated_at: string;
}

export type BusinessProfilePayload = Omit<BusinessProfile, "id" | "logo_url" | "is_default" | "updated_at" | "default_tax_rate"> & {
  default_tax_rate: number;
};

export interface AdminWorkspaceDetail extends Workspace {
  members: WorkspaceMember[];
  business_profile: BusinessProfile | null;
}

export interface Client {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  currency: Currency | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientPayload = Omit<Client, "id" | "created_at" | "updated_at">;

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type InvoiceDisplayStatus = InvoiceStatus | "overdue";
export type DiscountType = "percent" | "amount";

export interface InvoiceParty {
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_id?: string | null;
  logo_url?: string | null;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: string;
  unit: string | null;
  unit_price: string;
  amount: string;
}

export interface Invoice {
  id: number;
  number: string;
  status: InvoiceStatus;
  display_status: InvoiceDisplayStatus;
  issue_date: string;
  due_date: string;
  currency: Currency;
  subtotal: string;
  discount_type: DiscountType | null;
  discount_value: string;
  discount_total: string;
  tax_rate: string;
  tax_total: string;
  total: string;
  reverse_charge: boolean;
  client_id: number | null;
  client?: { id: number; name: string; company: string | null; email: string | null } | null;
  from: InvoiceParty;
  to: InvoiceParty;
  items?: InvoiceItem[];
  notes: string | null;
  footer: string | null;
  source_prompt: string | null;
  sent_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoicePayload {
  client_id: number;
  issue_date: string;
  due_date: string;
  currency: Currency;
  discount_type: DiscountType | null;
  discount_value: number;
  tax_rate: number;
  reverse_charge: boolean;
  notes: string | null;
  footer: string | null;
  source_prompt?: string | null;
  items: { description: string; quantity: number; unit: string | null; unit_price: number }[];
}

export interface InvoiceUsage {
  used: number;
  limit: number | null;
}

export interface InvoiceDefaults {
  currency: Currency;
  tax_rate: string;
  payment_terms_days: number;
  issue_date: string;
  due_date: string;
  next_number: string;
  footer: string | null;
  usage: InvoiceUsage;
}

export interface ClientOption {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  currency: Currency | null;
}

export interface WorkspaceDashboard {
  currency: Currency;
  invoiced_this_month: string;
  paid_this_month: string;
  outstanding: string;
  overdue: string;
  overdue_count: number;
  draft_count: number;
  monthly: { month: string; invoiced: number; paid: number }[];
  usage: InvoiceUsage;
  clients_count: number;
  clients_this_month: number;
  plan: { name: string; slug: string; monthly_invoice_limit: number | null } | null;
  recent_invoices: Invoice[];
  recent_clients: Client[];
}

export interface AdminDashboard {
  workspaces: number;
  active_workspaces: number;
  suspended_workspaces: number;
  users: number;
  signups: { date: string; count: number }[];
  plans: { name: string; slug: string; count: number }[];
}

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

export interface WorkspaceDashboard {
  clients_count: number;
  clients_this_month: number;
  plan: { name: string; slug: string; monthly_invoice_limit: number | null } | null;
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

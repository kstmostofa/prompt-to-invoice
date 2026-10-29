import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Access helpers. The backend is the authority; these only keep people away
// from pages that would 403.
// ---------------------------------------------------------------------------

export interface AccessUser {
  isAdmin?: boolean;
  role?: string;
}

/** Platform staff: the admin portal. */
export function isPlatformAdmin(user?: AccessUser | null): boolean {
  return user?.isAdmin === true;
}

/** Workspace owners and admins: settings and team. */
export function canManageWorkspace(user?: AccessUser | null): boolean {
  return user?.role === "owner" || user?.role === "admin";
}

/** Where a signed-in person lands: staff on the admin portal, everyone else in their workspace. */
export function homeFor(user?: AccessUser | null): string {
  return isPlatformAdmin(user) ? "/admin/dashboard" : "/dashboard";
}

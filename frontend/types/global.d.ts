import type { IconSvgElement } from "@hugeicons/react";

export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: IconSvgElement | null;
  isActive?: boolean;
  show?: boolean;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  url: string;
  show?: boolean;
  icon?: IconSvgElement | null;
  isActive?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Laravel API resource pagination: `{ data: [...], links, meta }`.
 * (The tenant-portal admin used a flattened `pagination` key; the central API
 * returns stock resource collections, so this mirrors `meta` instead.)
 */
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  path?: string;
}

export interface PaginatedData<TData> {
  data: TData[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginationMeta;
}

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export interface ValidationError {
  success?: false;
  message: string;
  errors: Record<string, string[]>;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  /**
   * Extra terms the option matches when searching, without showing them in the
   * label — e.g. a country matching its ISO code, so typing "AE" finds "United
   * Arab Emirates" without every row carrying a code nobody reads.
   */
  keywords?: string[];
}

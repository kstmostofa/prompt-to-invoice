import "server-only";
import { auth } from "../auth";
import { redirect } from "next/navigation";
import { BASE_API_URL } from "./api-urls";
import { clientIpHeaders } from "./client-ip";

/**
 * Server-only fetch client for the Laravel API.
 *
 * The API resolves the workspace from the signed-in user, so no workspace
 * header is sent: switching workspace is a call to the API, not client state.
 *
 * 422 validation responses are RETURNED (not thrown) so callers can map field
 * errors back onto forms; every other non-2xx status throws.
 */
class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BASE_API_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const session = await auth();
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(await clientIpHeaders()),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      // The token is no longer valid: sign out rather than show a broken page.
      if (response.status === 401) redirect("/session-expired");
      if (response.status === 403) {
        const body = await response.clone().json().catch(() => ({}));
        throw new Error(body?.message || "Forbidden");
      }
      if (response.status === 404) throw new Error("Not Found");
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        return errorData;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "An error occurred while fetching data.");
    }

    // 204 No Content and empty bodies parse to null.
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const FetchApi = new ApiClient();

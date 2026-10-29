"use server";

import { signIn, signOut } from "@/auth";
import { FetchApi } from "@/lib/api";
import { LOGOUT_URL, REGISTER_URL } from "@/lib/api-urls";
import { clientIpHeaders } from "@/lib/client-ip";
import { ValidationError } from "@/types/global";
import { AuthError } from "next-auth";

export async function login(data: { email: string; password: string }) {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          const code = (error as AuthError & { code?: string }).code;
          if (code === "throttled") {
            return { success: false, message: "Too many attempts. Wait a minute and try again." };
          }
          return {
            success: false,
            message:
              code === "deactivated"
                ? "This account has been deactivated. Contact support to restore it."
                : "Invalid credentials",
          };
        }
        default:
          return { success: false, message: "An unexpected error occurred." };
      }
    }
    // Re-throw if it's a redirect error (though redirect: false should prevent it)
    throw error;
  }
}

/**
 * Create the account and its workspace, then sign in with the same
 * credentials so the session is built the one way it always is.
 */
export async function register(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  workspace_name: string;
  currency: string;
}): Promise<{ success: true } | { success: false; message: string; errors?: ValidationError["errors"] }> {
  const res = await fetch(REGISTER_URL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(await clientIpHeaders()),
    },
  });

  if (res.status === 429) {
    return { success: false, message: "Too many attempts. Wait a minute and try again." };
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: body.message || "Could not create your account.", errors: body.errors };
  }

  const result = await login({ email: data.email, password: data.password });
  return result.success ? { success: true } : { success: false, message: result.message ?? "Could not sign in." };
}

export async function logout() {
  // Revoke the API token first, then clear the session cookie.
  try {
    await FetchApi.post(LOGOUT_URL);
  } catch {
    // Token may already be invalid; still clear the local session.
  }
  await signOut({ redirect: false });
}

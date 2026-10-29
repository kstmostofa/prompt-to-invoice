"use server";

import { auth, unstable_update } from "@/auth";
import { User } from "@/types/api";
import { ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import { PROFILE_URL, RESEND_VERIFICATION, SWITCH_WORKSPACE, UPDATE_PROFILE, VERIFY_EMAIL_URL } from "./api-urls";

export const getProfile = async (): Promise<{ data: User }> => {
  return FetchApi.get(PROFILE_URL);
};

export const updateProfile = async (data: { name: string; email: string }): Promise<{ data: User } | ValidationError> => {
  const response = await FetchApi.put<{ data: User } | ValidationError>(UPDATE_PROFILE, data);
  if ("data" in response) {
    await unstable_update({ user: { name: response.data.name, email: response.data.email } });
  }
  return response;
};

/** Make another of your workspaces the current one, and carry it into the session. */
export const switchWorkspace = async (id: number): Promise<void> => {
  await FetchApi.post(SWITCH_WORKSPACE(id));
  const { data } = await getProfile();
  const current = data.workspaces?.find((workspace) => workspace.id === id);
  const session = await auth();
  if (session && current) {
    await unstable_update({
      user: { workspaceId: current.id, workspaceName: current.name, role: current.role ?? "" },
    });
  }
};

export const resendVerification = async (): Promise<{ success: boolean; message: string }> => {
  try {
    return await FetchApi.post(RESEND_VERIFICATION);
  } catch {
    return { success: false, message: "Could not send the link. Try again in a minute." };
  }
};

/**
 * Open the signed link from the verification email. Works signed in or not;
 * a signed-in session learns the address is verified.
 */
export const verifyEmail = async (params: {
  id: string;
  hash: string;
  expires: string;
  signature: string;
}): Promise<{ success: boolean; message: string }> => {
  const query = new URLSearchParams({ expires: params.expires, signature: params.signature });
  const res = await fetch(`${VERIFY_EMAIL_URL(params.id, params.hash)}?${query}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      message: res.status === 403 ? "This link has expired or is not valid. Ask for a new one." : body.message || "Could not verify your email.",
    };
  }

  const session = await auth();
  if (session?.user?.id === params.id) {
    await unstable_update({ user: { isVerified: true } });
  }
  return { success: true, message: "Your email address is verified." };
};

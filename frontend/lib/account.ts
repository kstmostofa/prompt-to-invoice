"use server";

import { auth, unstable_update } from "@/auth";
import { User } from "@/types/api";
import { ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import { PROFILE_URL, SWITCH_WORKSPACE, UPDATE_PROFILE } from "./api-urls";

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

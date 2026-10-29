"use server";

import { AdminDashboard, AdminWorkspaceDetail, AiProvider, AiSettings, AiTestResult, User, Workspace } from "@/types/api";
import { PaginatedData, SearchParams, ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import {
  ACTIVATE_USER,
  ACTIVATE_WORKSPACE,
  CHANGE_WORKSPACE_PLAN,
  DEACTIVATE_USER,
  GET_AI_SETTINGS,
  TEST_AI_PROVIDER,
  UPDATE_AI_SETTINGS,
  GET_ADMIN_DASHBOARD,
  GET_ADMIN_USERS,
  GET_ADMIN_WORKSPACE,
  GET_ADMIN_WORKSPACES,
  SUSPEND_WORKSPACE,
} from "./api-urls";
import { parseQueryParam } from "./helper";

export const getAdminDashboard = async (): Promise<{ data: AdminDashboard }> => {
  return FetchApi.get(GET_ADMIN_DASHBOARD);
};

export const getAdminWorkspaces = async (searchParams: SearchParams): Promise<PaginatedData<Workspace>> => {
  const query = parseQueryParam(searchParams);
  return FetchApi.get(query ? `${GET_ADMIN_WORKSPACES}${query}` : GET_ADMIN_WORKSPACES);
};

export const getAdminWorkspace = async (id: number): Promise<{ data: AdminWorkspaceDetail }> => {
  return FetchApi.get(GET_ADMIN_WORKSPACE(id));
};

export const suspendWorkspace = async (id: number): Promise<{ data: Workspace }> => {
  return FetchApi.post(SUSPEND_WORKSPACE(id));
};

export const activateWorkspace = async (id: number): Promise<{ data: Workspace }> => {
  return FetchApi.post(ACTIVATE_WORKSPACE(id));
};

export const changeWorkspacePlan = async (id: number, planId: number): Promise<{ data: Workspace }> => {
  return FetchApi.put(CHANGE_WORKSPACE_PLAN(id), { plan_id: planId });
};

export const getAdminUsers = async (searchParams: SearchParams): Promise<PaginatedData<User>> => {
  const query = parseQueryParam(searchParams);
  return FetchApi.get(query ? `${GET_ADMIN_USERS}${query}` : GET_ADMIN_USERS);
};

export const activateUser = async (id: number): Promise<{ data: User }> => {
  return FetchApi.post(ACTIVATE_USER(id));
};

export const deactivateUser = async (id: number): Promise<{ data: User }> => {
  return FetchApi.post(DEACTIVATE_USER(id));
};

export const getAiSettings = async (): Promise<{ data: { settings: AiSettings; providers: AiProvider[] } }> => {
  return FetchApi.get(GET_AI_SETTINGS);
};

export const saveAiSettings = async (data: AiSettings): Promise<{ data: AiSettings } | ValidationError> => {
  return FetchApi.put(UPDATE_AI_SETTINGS, data);
};

/** Never throws: a provider that fails comes back as a message. */
export const testAiProvider = async (provider: string, model?: string | null, prompt?: string): Promise<AiTestResult> => {
  try {
    return await FetchApi.post<AiTestResult>(TEST_AI_PROVIDER, { provider, model: model || null, prompt: prompt || null });
  } catch (error) {
    return { success: false, message: error instanceof Error && error.message ? error.message : "The test could not run." };
  }
};

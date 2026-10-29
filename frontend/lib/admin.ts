"use server";

import { AdminDashboard, AdminWorkspaceDetail, User, Workspace } from "@/types/api";
import { PaginatedData, SearchParams } from "@/types/global";
import { FetchApi } from "./api";
import {
  ACTIVATE_USER,
  ACTIVATE_WORKSPACE,
  CHANGE_WORKSPACE_PLAN,
  DEACTIVATE_USER,
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

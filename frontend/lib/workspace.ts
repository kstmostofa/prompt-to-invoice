"use server";

import { unstable_update } from "@/auth";
import { BusinessProfile, BusinessProfilePayload, Workspace, WorkspaceDashboard } from "@/types/api";
import { ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import {
  BUSINESS_PROFILE_LOGO,
  GET_BUSINESS_PROFILE,
  GET_DASHBOARD,
  GET_WORKSPACE,
  UPDATE_BUSINESS_PROFILE,
  UPDATE_WORKSPACE,
} from "./api-urls";

export const getDashboard = async (): Promise<{ data: WorkspaceDashboard }> => {
  return FetchApi.get(GET_DASHBOARD);
};

export const getWorkspace = async (): Promise<{ data: Workspace }> => {
  return FetchApi.get(GET_WORKSPACE);
};

export const updateWorkspace = async (data: { name: string }): Promise<{ data: Workspace } | ValidationError> => {
  const response = await FetchApi.put<{ data: Workspace } | ValidationError>(UPDATE_WORKSPACE, data);
  if ("data" in response) {
    await unstable_update({ user: { workspaceName: response.data.name } });
  }
  return response;
};

export const getBusinessProfile = async (): Promise<{ data: BusinessProfile }> => {
  return FetchApi.get(GET_BUSINESS_PROFILE);
};

export const updateBusinessProfile = async (
  data: BusinessProfilePayload
): Promise<{ data: BusinessProfile } | ValidationError> => {
  return FetchApi.put(UPDATE_BUSINESS_PROFILE, data);
};

export const uploadLogo = async (formData: FormData): Promise<{ data: BusinessProfile } | ValidationError> => {
  return FetchApi.post(BUSINESS_PROFILE_LOGO, formData);
};

export const deleteLogo = async (): Promise<{ data: BusinessProfile }> => {
  return FetchApi.delete(BUSINESS_PROFILE_LOGO);
};

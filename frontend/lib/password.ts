"use server";

import { ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import { CHANGE_PASSWORD, FORGOT_PASSWORD, RESET_PASSWORD } from "./api-urls";

type Result = { success: boolean; message: string };

/** Always answers the same, known address or not: the API makes sure of it. */
export const requestPasswordReset = async (email: string): Promise<Result | ValidationError> => {
  return FetchApi.post(FORGOT_PASSWORD, { email });
};

/** Also how an invitation is accepted: the link carries the same kind of token. */
export const resetPassword = async (data: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<Result | ValidationError> => {
  return FetchApi.post(RESET_PASSWORD, data);
};

export const changePassword = async (data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<Result | ValidationError> => {
  return FetchApi.put(CHANGE_PASSWORD, data);
};

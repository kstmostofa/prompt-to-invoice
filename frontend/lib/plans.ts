"use server";

import { Plan, PlanPayload } from "@/types/api";
import { PaginatedData, SearchParams, ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import { CREATE_PLAN, DELETE_PLAN, GET_PLANS, UPDATE_PLAN } from "./api-urls";
import { parseQueryParam } from "./helper";

export const getPlans = async (searchParams: SearchParams): Promise<PaginatedData<Plan>> => {
  const query = parseQueryParam(searchParams);
  return FetchApi.get(query ? `${GET_PLANS}${query}` : GET_PLANS);
};

export const createPlan = async (data: PlanPayload): Promise<{ data: Plan } | ValidationError> => {
  return FetchApi.post(CREATE_PLAN, data);
};

export const updatePlan = async (id: number, data: PlanPayload): Promise<{ data: Plan } | ValidationError> => {
  return FetchApi.put(UPDATE_PLAN(id), data);
};

export const deletePlan = async (id: number): Promise<null | ValidationError> => {
  return FetchApi.delete(DELETE_PLAN(id));
};

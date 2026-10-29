"use server";

import { Client, ClientPayload } from "@/types/api";
import { PaginatedData, SearchParams, ValidationError } from "@/types/global";
import { FetchApi } from "./api";
import { CREATE_CLIENT, DELETE_CLIENT, GET_CLIENT, GET_CLIENTS, UPDATE_CLIENT } from "./api-urls";
import { parseQueryParam } from "./helper";

export const getClients = async (searchParams: SearchParams): Promise<PaginatedData<Client>> => {
  const query = parseQueryParam(searchParams);
  return FetchApi.get(query ? `${GET_CLIENTS}${query}` : GET_CLIENTS);
};

export const getClient = async (id: number): Promise<{ data: Client }> => {
  return FetchApi.get(GET_CLIENT(id));
};

export const createClient = async (data: ClientPayload): Promise<{ data: Client } | ValidationError> => {
  return FetchApi.post(CREATE_CLIENT, data);
};

export const updateClient = async (id: number, data: ClientPayload): Promise<{ data: Client } | ValidationError> => {
  return FetchApi.put(UPDATE_CLIENT(id), data);
};

export const deleteClient = async (id: number): Promise<null | ValidationError> => {
  return FetchApi.delete(DELETE_CLIENT(id));
};

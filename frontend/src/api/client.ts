import axios from "axios";
import type { Document, ReviewSubmit } from "../types";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000" });

export const uploadDocuments = async (files: File[]): Promise<Document[]> => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const { data } = await api.post<Document[]>("/upload/", form);
  return data;
};

export const listDocuments = async (status?: string): Promise<Document[]> => {
  const { data } = await api.get<Document[]>("/documents/", {
    params: status ? { status } : {},
  });
  return data;
};

export const getDocument = async (id: number): Promise<Document> => {
  const { data } = await api.get<Document>(`/documents/${id}`);
  return data;
};

export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

export const getReviewQueue = async (): Promise<Document[]> => {
  const { data } = await api.get<Document[]>("/review/queue");
  return data;
};

export const submitReview = async (payload: ReviewSubmit): Promise<Document> => {
  const { data } = await api.post<Document>("/review/submit", payload);
  return data;
};

export const exportExcel = async (status?: string): Promise<void> => {
  const response = await api.get("/export/excel", {
    params: status ? { status } : {},
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = "extractions.xlsx";
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getSites = async (): Promise<string[]> => {
  const { data } = await api.get<string[]>("/sites/");
  return data;
};

export const updateSites = async (sites: string[]): Promise<void> => {
  await api.post("/sites/", { sites });
};

export const checkHealth = async () => {
  const { data } = await api.get("/health/");
  return data;
};

export const getConfig = async (): Promise<Record<string, string>> => {
  const { data } = await api.get<Record<string, string>>("/config/");
  return data;
};

export const updateConfig = async (key: string, value: string): Promise<void> => {
  await api.post("/config/", { key, value });
};

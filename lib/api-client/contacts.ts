"use client";
import { useQuery } from "@tanstack/react-query";
import type { Contact } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useContacts(params: { q?: string; isCompany?: boolean } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return useQuery<Contact[]>({
    queryKey: ["contacts", params],
    queryFn: () => api<Contact[]>(`/api/contacts${qs ? `?${qs}` : ""}`),
  });
}

export function useContact(id: string) {
  return useQuery<Contact>({
    queryKey: ["contact", id],
    queryFn: () => api<Contact>(`/api/contacts/${id}`),
    enabled: !!id,
  });
}

"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Opportunity } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useOpportunities(params: { stage?: string; q?: string; salespersonId?: string; tag?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString();
  return useQuery<Opportunity[]>({
    queryKey: ["opportunities", params],
    queryFn: () => api<Opportunity[]>(`/api/opportunities${qs ? `?${qs}` : ""}`),
  });
}

export function useOpportunity(id: string) {
  return useQuery<Opportunity>({
    queryKey: ["opportunity", id],
    queryFn: () => api<Opportunity>(`/api/opportunities/${id}`),
    enabled: !!id,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Opportunity, "id" | "createdAt">) =>
      api<Opportunity>(`/api/opportunities`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<Omit<Opportunity, "id" | "createdAt">> }) =>
      api<Opportunity>(`/api/opportunities/${args.id}`, { method: "PATCH", body: JSON.stringify(args.patch) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["opportunity", v.id] });
    },
  });
}

export function useChangeStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; stageId: string }) =>
      api<Opportunity>(`/api/opportunities/${args.id}/stage`, { method: "PATCH", body: JSON.stringify({ stageId: args.stageId }) }),
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: ["opportunities"] });
      const prev = qc.getQueriesData<Opportunity[]>({ queryKey: ["opportunities"] });
      for (const [key, data] of prev) {
        if (!data) continue;
        qc.setQueryData(key, data.map(o => o.id === args.id ? { ...o, stageId: args.stageId } : o));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.prev) qc.setQueryData(key, data);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}

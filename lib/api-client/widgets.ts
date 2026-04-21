"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WidgetSpec, WidgetState, GeneratedWidget } from "@/lib/schemas/widgets";
import { api } from "./fetch";

export function useWidgets(params: { state?: WidgetState } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return useQuery<WidgetSpec[]>({
    queryKey: ["widgets", params],
    queryFn: () => api<WidgetSpec[]>(`/api/widgets${qs ? `?${qs}` : ""}`),
  });
}

export function useWidget(id: string) {
  return useQuery<WidgetSpec>({
    queryKey: ["widget", id],
    queryFn: () => api<WidgetSpec>(`/api/widgets/${id}`),
    enabled: !!id,
  });
}

export function useGenerateWidget() {
  return useMutation<{ spec: GeneratedWidget; prompt: string }, Error, string>({
    mutationFn: (prompt: string) =>
      api(`/api/widgets/generate`, { method: "POST", body: JSON.stringify({ prompt }) }),
  });
}

export function useCreateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (spec: unknown) =>
      api<WidgetSpec>(`/api/widgets`, { method: "POST", body: JSON.stringify(spec) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["widgets"] }),
  });
}

export function useUpdateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<WidgetSpec> }) =>
      api<WidgetSpec>(`/api/widgets/${args.id}`, { method: "PATCH", body: JSON.stringify(args.patch) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["widgets"] });
      qc.invalidateQueries({ queryKey: ["widget", v.id] });
    },
  });
}

export function useTransitionWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; next: WidgetState }) =>
      api<WidgetSpec>(`/api/widgets/${args.id}/transition`, { method: "PATCH", body: JSON.stringify({ next: args.next }) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["widgets"] });
      qc.invalidateQueries({ queryKey: ["widget", v.id] });
    },
  });
}

export function useDeleteWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<null>(`/api/widgets/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["widgets"] }),
  });
}

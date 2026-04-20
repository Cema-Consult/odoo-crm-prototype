"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Activity } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useActivities(params: { opportunityId?: string; done?: boolean } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return useQuery<Activity[]>({
    queryKey: ["activities", params],
    queryFn: () => api<Activity[]>(`/api/activities${qs ? `?${qs}` : ""}`),
  });
}

export function useToggleActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; done: boolean }) =>
      api<Activity>(`/api/activities/${args.id}`, { method: "PATCH", body: JSON.stringify({ done: args.done }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}

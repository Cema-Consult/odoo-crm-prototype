"use client";
import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary } from "@/lib/data-source/types";
import { api } from "./fetch";

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({ queryKey: ["dashboard"], queryFn: () => api("/api/dashboard/summary") });
}

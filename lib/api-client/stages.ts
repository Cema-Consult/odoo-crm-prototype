"use client";
import { useQuery } from "@tanstack/react-query";
import type { Stage } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useStages() {
  return useQuery<Stage[]>({ queryKey: ["stages"], queryFn: () => api("/api/stages") });
}

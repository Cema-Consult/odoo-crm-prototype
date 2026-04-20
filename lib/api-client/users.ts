"use client";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useUsers() {
  return useQuery<User[]>({ queryKey: ["users"], queryFn: () => api("/api/users") });
}

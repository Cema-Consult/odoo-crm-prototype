"use client";
import type { Stage, User } from "@/lib/schemas/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function KanbanFilters({
  stages, users, stage, salesperson, onChange,
}: {
  stages: Stage[]; users: User[];
  stage?: string; salesperson?: string;
  onChange: (patch: { stage?: string; salesperson?: string }) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select value={stage ?? "all"} onValueChange={v => onChange({ stage: !v || v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={salesperson ?? "all"} onValueChange={v => onChange({ salesperson: !v || v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

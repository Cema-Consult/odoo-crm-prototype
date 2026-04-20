"use client";
import type { Stage, User } from "@/lib/schemas/core";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OppFilters({ stages, users, value, onChange }: {
  stages: Stage[]; users: User[];
  value: { stage?: string; salespersonId?: string; q?: string };
  onChange: (patch: Partial<{ stage?: string; salespersonId?: string; q?: string }>) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Input placeholder="Search…" value={value.q ?? ""} onChange={e => onChange({ q: e.target.value || undefined })} className="w-[240px]" />
      <Select value={value.stage ?? "all"} onValueChange={v => onChange({ stage: !v || v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.salespersonId ?? "all"} onValueChange={v => onChange({ salespersonId: !v || v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

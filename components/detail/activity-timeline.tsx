"use client";
import type { Activity, User } from "@/lib/schemas/core";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export function ActivityTimeline({ activities, usersById, onToggle }: {
  activities: Activity[];
  usersById: Map<string, User>;
  onToggle: (id: string, done: boolean) => void;
}) {
  const sorted = [...activities].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  return (
    <ul className="space-y-3">
      {sorted.map(a => {
        const Icon = ICON[a.type];
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span className="mt-0.5 h-7 w-7 rounded-full bg-surface-muted grid place-items-center"><Icon className="h-3.5 w-3.5 text-accent" /></span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className={a.done ? "line-through text-text-muted" : ""}>{a.summary}</span>
                <span className="text-xs text-text-muted">· {format(new Date(a.scheduledAt), "MMM d")}</span>
                <span className="text-xs text-text-muted">· {usersById.get(a.assignedTo)?.name ?? "—"}</span>
              </div>
            </div>
            <Checkbox checked={a.done} onCheckedChange={v => onToggle(a.id, !!v)} />
          </li>
        );
      })}
      {sorted.length === 0 && <li className="text-sm text-text-muted">No activities.</li>}
    </ul>
  );
}

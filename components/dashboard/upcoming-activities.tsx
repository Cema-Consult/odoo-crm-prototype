import type { Activity } from "@/lib/schemas/core";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export function UpcomingActivities({ items }: { items: Activity[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-sm font-medium mb-3">Your next activities</div>
      <ul className="space-y-2">
        {items.map(a => {
          const Icon = ICON[a.type];
          return (
            <li key={a.id} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-accent" />
              <div className="flex-1">{a.summary}</div>
              <div className="text-xs text-text-muted">{format(new Date(a.scheduledAt), "MMM d, HH:mm")}</div>
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-text-muted">Nothing upcoming.</li>}
      </ul>
    </div>
  );
}

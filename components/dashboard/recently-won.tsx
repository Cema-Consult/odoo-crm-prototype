import type { Opportunity } from "@/lib/schemas/core";

export function RecentlyWon({ items }: { items: Opportunity[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-sm font-medium mb-3">Recently won</div>
      <ul className="space-y-2">
        {items.map(o => (
          <li key={o.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1 truncate">{o.name}</span>
            <span className="text-success">{o.currency} {o.expectedRevenue.toLocaleString()}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-text-muted">No wins yet.</li>}
      </ul>
    </div>
  );
}

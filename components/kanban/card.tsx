"use client";
import type { Opportunity, Contact } from "@/lib/schemas/core";
import { Star } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

export function KanbanCard({ opp, contact, dragging }: { opp: Opportunity; contact?: Contact; dragging?: boolean }) {
  const initial = contact?.name?.[0] ?? "?";
  return (
    <div className={clsx(
      "bg-surface border border-border rounded-md p-3 space-y-2 text-sm",
      "border-l-[3px]",
      dragging && "opacity-50"
    )} style={{ borderLeftColor: "var(--accent)" }}>
      <Link href={`/opportunities/${opp.id}`} className="font-medium block hover:underline">{opp.name}</Link>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="h-5 w-5 rounded-full bg-surface-muted grid place-items-center text-[10px]">{initial}</span>
        <span className="truncate">{contact?.name ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span>{opp.currency} {opp.expectedRevenue.toLocaleString()}</span>
        <div className="flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star key={i} className={clsx("h-3 w-3", i < opp.priority ? "text-warning fill-warning" : "text-text-muted")} />
          ))}
        </div>
      </div>
    </div>
  );
}

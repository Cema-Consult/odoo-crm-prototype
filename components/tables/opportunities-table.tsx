"use client";
import Link from "next/link";
import type { Opportunity, Contact, Stage, User } from "@/lib/schemas/core";
import { Badge } from "@/components/ui/badge";

export function OpportunitiesTable({ rows, contactsById, stagesById, usersById }: {
  rows: Opportunity[];
  contactsById: Map<string, Contact>;
  stagesById: Map<string, Stage>;
  usersById: Map<string, User>;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted/40 text-text-muted">
          <tr>
            <Th>Opportunity</Th><Th>Contact</Th><Th>Stage</Th>
            <Th className="text-right">Expected</Th><Th>Prob.</Th><Th>Salesperson</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(o => (
            <tr key={o.id} className="border-t border-border hover:bg-surface-muted/30">
              <td className="px-4 py-2"><Link href={`/opportunities/${o.id}`} className="hover:underline">{o.name}</Link></td>
              <td className="px-4 py-2">{contactsById.get(o.partnerId)?.name ?? "—"}</td>
              <td className="px-4 py-2"><Badge variant="secondary">{stagesById.get(o.stageId)?.name}</Badge></td>
              <td className="px-4 py-2 text-right">{o.currency} {o.expectedRevenue.toLocaleString()}</td>
              <td className="px-4 py-2">{o.probability}%</td>
              <td className="px-4 py-2">{usersById.get(o.salespersonId)?.name}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No results.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left text-xs font-medium uppercase tracking-wide px-4 py-2 ${className}`}>{children}</th>;
}

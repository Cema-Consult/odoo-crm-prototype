"use client";
import type { Contact, Opportunity, Activity } from "@/lib/schemas/core";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function ContactDetail({ contact, opportunities, activities }: {
  contact: Contact;
  opportunities: Opportunity[];
  activities: Activity[];
}) {
  return (
    <div className="flex-1 p-6 overflow-auto space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{contact.name}</h2>
        <div className="text-sm text-text-muted mt-0.5">
          {contact.title ? `${contact.title} · ` : ""}{contact.city}, {contact.country}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Field label="Email" value={contact.email} />
        <Field label="Phone" value={contact.phone} />
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Linked opportunities</div>
        <ul className="space-y-1">
          {opportunities.map(o => (
            <li key={o.id} className="text-sm">
              <Link href={`/opportunities/${o.id}`} className="hover:underline">{o.name}</Link>
              <span className="text-text-muted"> · {o.currency} {o.expectedRevenue.toLocaleString()}</span>
            </li>
          ))}
          {opportunities.length === 0 && <li className="text-sm text-text-muted">None yet.</li>}
        </ul>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Recent activity</div>
        <ul className="space-y-1 text-sm">
          {activities.slice(0, 5).map(a => <li key={a.id}>{a.summary} <span className="text-text-muted">· {a.type}</span></li>)}
          {activities.length === 0 && <li className="text-text-muted">No activities.</li>}
        </ul>
      </div>

      <div className="flex gap-1 flex-wrap">
        {contact.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs uppercase text-text-muted">{label}</div><div className="text-sm">{value}</div></div>;
}

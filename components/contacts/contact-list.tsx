"use client";
import type { Contact } from "@/lib/schemas/core";
import clsx from "clsx";
import { Building2, User } from "lucide-react";

export function ContactList({ contacts, selectedId, onSelect, query, onQuery }: {
  contacts: Contact[]; selectedId?: string;
  onSelect: (id: string) => void;
  query: string; onQuery: (q: string) => void;
}) {
  const companies = contacts.filter(c => c.isCompany);
  const people = contacts.filter(c => !c.isCompany);
  const byParent = new Map<string, Contact[]>();
  for (const p of people) {
    if (!p.parentId) continue;
    byParent.set(p.parentId, [...(byParent.get(p.parentId) ?? []), p]);
  }
  return (
    <div className="w-[320px] shrink-0 border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search contacts…"
          className="w-full bg-surface-muted rounded-md px-3 py-1.5 text-sm outline-none"
        />
      </div>
      <div className="flex-1 overflow-auto">
        {companies.map(c => (
          <div key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={clsx("w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-muted/50",
                selectedId === c.id && "bg-surface-muted")}
            >
              <Building2 className="h-4 w-4 text-accent" /><span className="truncate">{c.name}</span>
            </button>
            {(byParent.get(c.id) ?? []).map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)}
                className={clsx("w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs text-left text-text-muted hover:text-text hover:bg-surface-muted/50",
                  selectedId === p.id && "bg-surface-muted text-text")}>
                <User className="h-3 w-3" /><span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

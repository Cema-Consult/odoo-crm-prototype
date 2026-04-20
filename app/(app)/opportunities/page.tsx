"use client";
import { useState } from "react";
import { OpportunitiesTable } from "@/components/tables/opportunities-table";
import { OppFilters } from "@/components/tables/opp-filters";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContacts } from "@/lib/api-client/contacts";

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<{ stage?: string; salespersonId?: string; q?: string }>({});
  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const contacts = useContacts().data ?? [];
  const rows = useOpportunities(filters).data ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Opportunities</h1>
        <OppFilters stages={stages} users={users} value={filters} onChange={p => setFilters(f => ({ ...f, ...p }))} />
      </div>
      <OpportunitiesTable
        rows={rows}
        contactsById={new Map(contacts.map(c => [c.id, c]))}
        stagesById={new Map(stages.map(s => [s.id, s]))}
        usersById={new Map(users.map(u => [u.id, u]))}
      />
    </div>
  );
}

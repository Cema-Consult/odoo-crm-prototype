"use client";
import { useMemo, useState } from "react";
import { useContacts } from "@/lib/api-client/contacts";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useActivities } from "@/lib/api-client/activities";
import { ContactList } from "@/components/contacts/contact-list";
import { ContactDetail } from "@/components/contacts/contact-detail";

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const contacts = useContacts({ q: query || undefined }).data ?? [];
  const [selectedId, setSelectedId] = useState<string>();
  const selected = contacts.find(c => c.id === (selectedId ?? contacts[0]?.id));

  const oppsAll = useOpportunities().data ?? [];
  const actsAll = useActivities().data ?? [];
  const opps = useMemo(() => selected ? oppsAll.filter(o => o.partnerId === selected.id) : [], [oppsAll, selected]);
  const acts = useMemo(() => selected ? actsAll.filter(a => opps.some(o => o.id === a.opportunityId)) : [], [actsAll, opps, selected]);

  return (
    <div className="h-full flex">
      <ContactList contacts={contacts} selectedId={selected?.id} onSelect={setSelectedId} query={query} onQuery={setQuery} />
      {selected
        ? <ContactDetail contact={selected} opportunities={opps} activities={acts} />
        : <div className="flex-1 grid place-items-center text-text-muted">Pick a contact</div>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { KanbanBoard } from "@/components/kanban/board";
import { KanbanFilters } from "@/components/kanban/filters";
import { CreateOpportunitySheet } from "@/components/kanban/create-sheet";
import { Button } from "@/components/ui/button";
import { useOpportunities, useChangeStage } from "@/lib/api-client/opportunities";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContacts } from "@/lib/api-client/contacts";
import { Plus } from "lucide-react";

export default function PipelinePage() {
  const [stage, setStage] = useState<string>();
  const [salesperson, setSalesperson] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const opps = useOpportunities({ stage, salespersonId: salesperson }).data ?? [];
  const contacts = useContacts().data ?? [];
  const changeStage = useChangeStage();

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <div className="flex items-center gap-2">
          <KanbanFilters stages={stages} users={users} stage={stage} salesperson={salesperson}
            onChange={p => { if (p.stage !== undefined) setStage(p.stage); if (p.salesperson !== undefined) setSalesperson(p.salesperson); }} />
          <Button onClick={() => setSheetOpen(true)}><Plus className="h-4 w-4 mr-1" />New</Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanBoard
          stages={stages}
          opportunities={opps}
          contacts={contacts}
          onDrop={(id, stageId) => changeStage.mutate({ id, stageId })}
        />
      </div>
      <CreateOpportunitySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

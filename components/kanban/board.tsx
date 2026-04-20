"use client";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Opportunity, Stage, Contact } from "@/lib/schemas/core";
import { KanbanColumn } from "./column";

export function KanbanBoard({ stages, opportunities, contacts, onDrop }: {
  stages: Stage[]; opportunities: Opportunity[]; contacts: Contact[];
  onDrop: (opportunityId: string, stageId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const contactsById = new Map(contacts.map(c => [c.id, c]));

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const stageId = String(e.over.id);
    const opp = opportunities.find(o => o.id === e.active.id);
    if (!opp || opp.stageId === stageId) return;
    onDrop(opp.id, stageId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto p-1">
        {stages.filter(s => !s.fold).map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            opps={opportunities.filter(o => o.stageId === stage.id)}
            contactsById={contactsById}
          />
        ))}
      </div>
    </DndContext>
  );
}

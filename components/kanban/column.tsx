"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Opportunity, Stage, Contact } from "@/lib/schemas/core";
import { KanbanCard } from "./card";

function DraggableCard({ opp, contact }: { opp: Opportunity; contact?: Contact }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opp.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard opp={opp} contact={contact} dragging={isDragging} />
    </div>
  );
}

export function KanbanColumn({ stage, opps, contactsById }: { stage: Stage; opps: Opportunity[]; contactsById: Map<string, Contact> }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = opps.reduce((s, o) => s + o.expectedRevenue, 0);
  return (
    <div ref={setNodeRef} className={`min-w-[280px] bg-surface-muted/40 border border-border rounded-lg p-3 flex flex-col gap-2 ${isOver ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase tracking-wide text-text-muted">{stage.name}</div>
        <div className="text-xs text-text-muted">{opps.length} · {total.toLocaleString()} €</div>
      </div>
      <SortableContext items={opps.map(o => o.id)} strategy={verticalListSortingStrategy}>
        {opps.map(o => <DraggableCard key={o.id} opp={o} contact={contactsById.get(o.partnerId)} />)}
      </SortableContext>
    </div>
  );
}

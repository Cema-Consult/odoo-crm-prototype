"use client";
import type { Stage } from "@/lib/schemas/core";
import clsx from "clsx";

export function StagePills({ stages, currentId, onChange }: {
  stages: Stage[]; currentId: string; onChange: (id: string) => void;
}) {
  const open = stages.filter(s => !s.fold);
  const currentIdx = open.findIndex(s => s.id === currentId);
  return (
    <div className="flex gap-1">
      {open.map((s, i) => {
        const active = i <= currentIdx;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-md border",
              active ? "bg-accent text-[color:var(--bg)] border-accent" : "bg-surface border-border text-text-muted hover:text-text"
            )}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

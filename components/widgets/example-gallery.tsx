"use client";
import { EXAMPLE_PROMPTS } from "@/lib/widgets/example-prompts";

export function ExampleGallery({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {EXAMPLE_PROMPTS.map(p => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.prompt)}
          className="text-left text-sm bg-surface border border-border rounded-md px-3 py-2 hover:bg-surface-muted/40"
        >
          <span className="block font-medium">{p.label}</span>
          <span className="block text-xs text-text-muted mt-0.5 line-clamp-2">{p.prompt}</span>
        </button>
      ))}
    </div>
  );
}

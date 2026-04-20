"use client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";

export function LogActivityMenu({ onPick }: { onPick: (t: "call" | "meeting" | "email" | "todo") => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-muted text-sm">
        <Plus className="h-4 w-4 mr-1" />Log activity
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(["call", "meeting", "email", "todo"] as const).map(t => (
          <DropdownMenuItem key={t} onClick={() => onPick(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { UserMenu } from "./user-menu";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center px-4 gap-3">
      <button
        onClick={onOpenPalette}
        className="flex items-center gap-2 text-sm text-text-muted bg-surface-muted hover:bg-surface-muted/70 rounded-md px-3 py-1.5 w-[360px]"
      >
        <Search className="h-4 w-4" />
        Search…
        <kbd className="ml-auto text-[10px] border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
        <ThemeSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}

"use client";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "@/components/command-palette/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

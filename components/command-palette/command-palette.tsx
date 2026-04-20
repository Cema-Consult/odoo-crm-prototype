"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="p-4">
        <div className="text-sm text-text-muted">Search palette (to be implemented).</div>
      </DialogContent>
    </Dialog>
  );
}

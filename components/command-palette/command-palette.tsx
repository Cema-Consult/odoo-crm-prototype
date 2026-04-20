"use client";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useContacts } from "@/lib/api-client/contacts";
import { useCmdK } from "./use-global-shortcut";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const opps = useOpportunities().data ?? [];
  const contacts = useContacts().data ?? [];
  useCmdK(() => onOpenChange(true));

  const go = (path: string) => { onOpenChange(false); router.push(path); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[560px]">
        <Command className="bg-surface">
          <CommandInput placeholder="Jump to…" className="w-full px-4 py-3 bg-transparent outline-none border-b border-border text-sm" />
          <CommandList className="max-h-[380px] overflow-auto p-2">
            <CommandEmpty className="px-3 py-6 text-sm text-text-muted text-center">No matches.</CommandEmpty>
            <CommandGroup heading="Opportunities">
              {opps.slice(0, 8).map(o => (
                <CommandItem key={o.id} onSelect={() => go(`/opportunities/${o.id}`)}
                  className="px-3 py-2 rounded-md text-sm data-[selected=true]:bg-surface-muted cursor-pointer">
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Contacts">
              {contacts.slice(0, 8).map(c => (
                <CommandItem key={c.id} onSelect={() => go(`/contacts`)}
                  className="px-3 py-2 rounded-md text-sm data-[selected=true]:bg-surface-muted cursor-pointer">
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

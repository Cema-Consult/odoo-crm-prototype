"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContacts } from "@/lib/api-client/contacts";
import { useCreateOpportunity } from "@/lib/api-client/opportunities";
import { toast } from "sonner";

export function CreateOpportunitySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const contacts = useContacts({ isCompany: true }).data ?? [];
  const create = useCreateOpportunity();

  const [form, setForm] = useState({
    name: "", partnerId: "", salespersonId: "", stageId: "",
    expectedRevenue: 0, probability: 10, currency: "EUR" as "EUR" | "USD" | "DKK",
    tags: [] as string[], priority: 1 as 0 | 1 | 2 | 3,
    expectedClose: null as string | null, description: "",
  });

  const submit = async () => {
    try {
      await create.mutateAsync(form);
      toast.success("Opportunity created");
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[460px]">
        <SheetHeader><SheetTitle>New opportunity</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Contact</Label>
            <Select value={form.partnerId} onValueChange={v => setForm({ ...form, partnerId: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Pick a company" /></SelectTrigger>
              <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Salesperson</Label>
            <Select value={form.salespersonId} onValueChange={v => setForm({ ...form, salespersonId: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Stage</Label>
            <Select value={form.stageId} onValueChange={v => setForm({ ...form, stageId: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Pick a stage" /></SelectTrigger>
              <SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Expected revenue</Label><Input type="number" value={form.expectedRevenue} onChange={e => setForm({ ...form, expectedRevenue: Number(e.target.value) })} /></div>
          <Button onClick={submit} disabled={create.isPending} className="w-full">{create.isPending ? "Saving…" : "Create"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

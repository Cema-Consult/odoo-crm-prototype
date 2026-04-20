"use client";
import { use } from "react";
import Link from "next/link";
import { useOpportunity, useUpdateOpportunity, useChangeStage } from "@/lib/api-client/opportunities";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContact } from "@/lib/api-client/contacts";
import { useActivities, useToggleActivity } from "@/lib/api-client/activities";
import { StagePills } from "@/components/detail/stage-pills";
import { ActivityTimeline } from "@/components/detail/activity-timeline";
import { LogActivityMenu } from "@/components/detail/log-activity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client/fetch";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const opp = useOpportunity(id).data;
  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const contact = useContact(opp?.partnerId ?? "").data;
  const activities = useActivities({ opportunityId: id }).data ?? [];
  const update = useUpdateOpportunity();
  const changeStage = useChangeStage();
  const toggleActivity = useToggleActivity();

  if (!opp) return <div className="p-6 text-text-muted">Loading…</div>;

  const salesperson = users.find(u => u.id === opp.salespersonId);

  const logActivity = async (type: "call" | "meeting" | "email" | "todo") => {
    await api("/api/activities", {
      method: "POST",
      body: JSON.stringify({
        opportunityId: id,
        type,
        summary: `New ${type}`,
        scheduledAt: new Date().toISOString(),
        done: false,
        assignedTo: opp.salespersonId,
      }),
    });
    await qc.invalidateQueries({ queryKey: ["activities"] });
    toast.success(`${type} logged`);
  };

  const markWon = () => changeStage.mutate({ id, stageId: "s_won" });
  const markLost = () => changeStage.mutate({ id, stageId: "s_lost" });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/opportunities" className="hover:text-text">Opportunities</Link><span>/</span><span className="text-text">{opp.name}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{opp.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <Link href={contact ? `/contacts?focus=${contact.id}` : "#"} className="hover:text-text">{contact?.name ?? "—"}</Link>
            <span>·</span><span>{opp.currency} {opp.expectedRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markWon}>Mark won</Button>
          <Button variant="outline" onClick={markLost}>Mark lost</Button>
        </div>
      </div>

      <StagePills stages={stages} currentId={opp.stageId} onChange={stageId => changeStage.mutate({ id, stageId })} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-surface border border-border rounded-lg p-5">
            <div className="text-sm font-medium mb-2">Description</div>
            <p className="text-sm whitespace-pre-line">{opp.description || <span className="text-text-muted">No description.</span>}</p>
          </section>
          <section className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Activities</div>
              <LogActivityMenu onPick={logActivity} />
            </div>
            <ActivityTimeline
              activities={activities}
              usersById={new Map(users.map(u => [u.id, u]))}
              onToggle={(aid, done) => toggleActivity.mutate({ id: aid, done })}
            />
          </section>
        </div>
        <aside className="space-y-4">
          <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
            <Row label="Expected revenue" value={`${opp.currency} ${opp.expectedRevenue.toLocaleString()}`} />
            <Row label="Probability" value={`${opp.probability}%`} />
            <Row label="Salesperson" value={salesperson?.name ?? "—"} />
            <Row label="Expected close" value={opp.expectedClose ?? "—"} />
            <Row label="Tags" value={<div className="flex gap-1 flex-wrap">{opp.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between text-sm gap-4">
      <span className="text-text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

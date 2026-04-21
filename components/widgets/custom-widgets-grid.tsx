"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useWidgets, useTransitionWidget } from "@/lib/api-client/widgets";
import { WidgetRenderer } from "@/lib/widgets/renderer";
import { ExampleGallery } from "./example-gallery";
import { useRouter } from "next/navigation";

export function CustomWidgetsGrid() {
  const router = useRouter();
  const widgets = useWidgets({ state: "published" }).data ?? [];
  const transition = useTransitionWidget();

  if (widgets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-lg p-6 text-center space-y-3">
          <Sparkles className="h-6 w-6 text-accent mx-auto" />
          <div className="text-sm font-medium">No custom widgets yet</div>
          <div className="text-xs text-text-muted">Describe a chart and we'll generate it.</div>
          <Link href="/dashboard/studio"><Button size="sm">Open Widget Studio</Button></Link>
        </div>
        <div>
          <div className="text-xs uppercase text-text-muted mb-2">Try one of these</div>
          <ExampleGallery onPick={p => router.push(`/dashboard/studio?prompt=${encodeURIComponent(p)}`)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-text-muted">{widgets.length} published</div>
        <Link href="/dashboard/studio"><Button size="sm" variant="outline"><Sparkles className="h-4 w-4 mr-1" />New widget</Button></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map(w => (
          <div key={w.id} className="relative group">
            <WidgetRenderer spec={w} />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
              <Link href={`/dashboard/studio?id=${w.id}`} className="text-xs bg-surface border border-border rounded px-2 py-1 hover:bg-surface-muted">Edit</Link>
              <button
                onClick={() => transition.mutate({ id: w.id, next: "archived" })}
                className="text-xs bg-surface border border-border rounded px-2 py-1 hover:bg-surface-muted"
              >Archive</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

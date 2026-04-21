"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { WidgetSpec } from "@/lib/schemas/widgets";
import { useGenerateWidget, useCreateWidget, useUpdateWidget, useTransitionWidget, useWidget } from "@/lib/api-client/widgets";
import { WidgetRenderer } from "@/lib/widgets/renderer";
import { StudioEditor } from "@/components/widgets/studio-editor";
import { ExampleGallery } from "@/components/widgets/example-gallery";
import { AutocompleteTextarea } from "@/components/widgets/autocomplete-textarea";
import { FieldsReference } from "@/components/widgets/fields-reference";
import { getAutocompleteOptions } from "@/lib/widgets/field-catalog";

function WidgetStudio() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const initialPrompt = params.get("prompt") ?? "";

  const existing = useWidget(id ?? "");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [spec, setSpec] = useState<Partial<WidgetSpec>>({});

  useEffect(() => {
    if (!existing.data) return;
    setSpec(existing.data);
    if (existing.data.prompt) setPrompt(existing.data.prompt);
  }, [existing.data]);

  const gen = useGenerateWidget();
  const create = useCreateWidget();
  const update = useUpdateWidget();
  const transition = useTransitionWidget();

  const generate = async (p: string) => {
    try {
      const res = await gen.mutateAsync(p);
      setSpec({ ...res.spec, prompt: p });
      toast.success("Generated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const save = async (nextState?: "draft" | "pending_review" | "published") => {
    try {
      if (id) {
        await update.mutateAsync({ id, patch: spec });
        if (nextState) await transition.mutateAsync({ id, next: nextState });
      } else {
        const created = await create.mutateAsync(spec);
        if (nextState) await transition.mutateAsync({ id: created.id, next: nextState });
        if (nextState !== "published") {
          router.replace(`/dashboard/studio?id=${created.id}`);
        }
      }
      if (nextState === "published") {
        toast.success("Published — taking you to the dashboard");
        router.push("/dashboard?tab=custom");
      } else {
        toast.success(nextState ? `Moved to ${nextState}` : "Saved");
      }
    } catch (e) { toast.error((e as Error).message); }
  };

  const copyReviewLink = () => {
    if (!id) return toast.error("Save first to get a review link");
    const url = `${window.location.origin}/dashboard/widget/${id}?ro=1`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied");
  };

  const canRender = spec.type && (spec as any).dataSource;
  const autocompleteOptions = useMemo(() => getAutocompleteOptions(), []);

  return (
    <div className="p-6 h-full">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link href="/dashboard" className="hover:text-text">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard?tab=custom" className="hover:text-text">Custom widgets</Link>
        <span>/</span><span className="text-text">Studio</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-3rem)]">
        {/* Left: prompt + editor */}
        <div className="space-y-4 overflow-auto pr-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <label className="text-sm font-medium">Ask AI to build a widget</label>
            </div>
            <AutocompleteTextarea
              rows={3}
              value={prompt}
              onChange={setPrompt}
              options={autocompleteOptions}
              placeholder="e.g. Bar chart of won deals by salesperson last 6 months — type // for field autocomplete"
            />
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={() => generate(prompt)} disabled={gen.isPending || prompt.length < 3}>
                <Sparkles className="h-4 w-4 mr-1" />{gen.isPending ? "Generating…" : "Generate"}
              </Button>
              <div className="text-xs text-text-muted">
                Tip: type <code className="bg-surface-muted px-1 py-0.5 rounded">//</code> to pick a field or value.
              </div>
            </div>
          </div>

          {!spec.type && (
            <div>
              <div className="text-xs uppercase text-text-muted mb-2">Try one of these</div>
              <ExampleGallery onPick={setPrompt} />
            </div>
          )}

          {spec.type && <StudioEditor spec={spec} onChange={patch => setSpec(prev => ({ ...prev, ...patch } as Partial<WidgetSpec>))} />}
        </div>

        {/* Right: preview */}
        <div className="space-y-3 overflow-auto pr-2">
          <div className="text-xs uppercase text-text-muted">Preview</div>
          {canRender
            ? <WidgetRenderer spec={spec as WidgetSpec} />
            : <div className="bg-surface border border-border rounded-lg p-6 text-sm text-text-muted text-center">Preview appears after you pick a type + data source.</div>}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => save()}>Save draft</Button>
            <Button variant="outline" size="sm" onClick={() => save("pending_review")}>Submit for review</Button>
            <Button size="sm" onClick={() => save("published")}>Approve & publish</Button>
            <Button variant="ghost" size="sm" onClick={copyReviewLink}><Copy className="h-4 w-4 mr-1" />Copy review link</Button>
          </div>

          <FieldsReference />
        </div>
      </div>
    </div>
  );
}

export default function WidgetStudioPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-text-muted">Loading…</div>}>
      <WidgetStudio />
    </Suspense>
  );
}

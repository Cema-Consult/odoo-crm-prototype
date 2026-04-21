"use client";
import { use } from "react";
import Link from "next/link";
import { useWidget } from "@/lib/api-client/widgets";
import { WidgetRenderer } from "@/lib/widgets/renderer";
import { Badge } from "@/components/ui/badge";

export default function WidgetReviewPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ro?: string }>;
}) {
  const { id } = use(params);
  const sp = use(searchParams);
  const { data: widget } = useWidget(id);
  if (!widget) return <div className="p-6 text-text-muted">Loading…</div>;
  return (
    <div className="p-6 space-y-3 max-w-[720px]">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/dashboard" className="hover:text-text">Dashboard</Link>
        <span>/</span><span className="text-text">Review</span>
      </div>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{widget.title}</h1>
        <Badge variant="outline">{widget.state}</Badge>
        {sp.ro && <Badge variant="secondary">read-only</Badge>}
      </div>
      <WidgetRenderer spec={widget} />
    </div>
  );
}

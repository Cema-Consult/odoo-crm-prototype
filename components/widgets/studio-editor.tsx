"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetSpec } from "@/lib/schemas/widgets";

export function StudioEditor({ spec, onChange }: { spec: Partial<WidgetSpec>; onChange: (patch: Partial<WidgetSpec>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Title</Label>
        <Input value={spec.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
      </div>
      <div>
        <Label>Widget type</Label>
        <Select value={(spec.type as string) ?? ""} onValueChange={v => v && onChange({ type: v as any })}>
          <SelectTrigger><SelectValue placeholder="Pick a type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="stat_tile">Stat tile</SelectItem>
            <SelectItem value="bar_chart">Bar chart</SelectItem>
            <SelectItem value="line_chart">Line chart</SelectItem>
            <SelectItem value="pie_chart">Pie chart</SelectItem>
            <SelectItem value="record_table">Record table</SelectItem>
            <SelectItem value="activity_feed">Activity feed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Data source</Label>
        <Select value={(spec as any).dataSource ?? ""} onValueChange={v => v && onChange({ dataSource: v as any } as any)}>
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="opportunities">Opportunities</SelectItem>
            <SelectItem value="contacts">Contacts</SelectItem>
            <SelectItem value="activities">Activities</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Raw JSON</Label>
        <textarea
          className="w-full bg-surface-muted rounded-md p-2 text-xs font-mono min-h-[200px]"
          value={JSON.stringify(spec, null, 2)}
          onChange={e => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* ignore invalid intermediate input */ }
          }}
        />
      </div>
    </div>
  );
}

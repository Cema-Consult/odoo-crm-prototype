"use client";
import { FIELD_CATALOG, VALUES_CATALOG } from "@/lib/widgets/field-catalog";

export function FieldsReference() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 text-xs space-y-4">
      <div>
        <div className="text-sm font-medium mb-1">Available fields</div>
        <div className="text-text-muted mb-3">
          Type <code className="bg-surface-muted rounded px-1 py-0.5 font-mono">//</code> in the prompt to autocomplete any of these.
        </div>
      </div>

      {Object.entries(FIELD_CATALOG).map(([ds, fields]) => (
        <div key={ds}>
          <div className="text-text-muted uppercase tracking-wide mb-1.5 text-[10px]">{ds}</div>
          <div className="flex flex-wrap gap-1">
            {fields.map(f => (
              <code key={f} className="bg-surface-muted rounded px-1.5 py-0.5 text-[10px] font-mono">{f}</code>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-border pt-4 space-y-3">
        <div className="text-sm font-medium">Common values</div>
        {Object.entries(VALUES_CATALOG).map(([cat, values]) => (
          <div key={cat}>
            <div className="text-text-muted uppercase tracking-wide mb-1.5 text-[10px]">{cat}</div>
            <div className="flex flex-wrap gap-1">
              {values.map(v => (
                <code key={v} className="bg-surface-muted rounded px-1.5 py-0.5 text-[10px] font-mono">{v}</code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

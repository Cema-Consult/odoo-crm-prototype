"use client";
import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import clsx from "clsx";
import type { AutocompleteOption } from "@/lib/widgets/field-catalog";

export type AutocompleteTextareaProps = {
  value: string;
  onChange: (v: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  rows?: number;
  className?: string;
  triggerChars?: string;   // default "//"
  maxOptions?: number;     // default 8
};

export const AutocompleteTextarea = forwardRef<HTMLTextAreaElement, AutocompleteTextareaProps>(
  function AutocompleteTextarea(
    { value, onChange, options, placeholder, rows = 3, className, triggerChars = "//", maxOptions = 8 },
    externalRef
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(externalRef, () => innerRef.current!);

    const [triggerStart, setTriggerStart] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);

    const filtered = triggerStart === null
      ? []
      : options
          .filter(o => o.value.toLowerCase().includes(query.toLowerCase()))
          // prefer starts-with matches at the top
          .sort((a, b) => {
            const aStarts = a.value.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
            const bStarts = b.value.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
            return aStarts - bStarts;
          })
          .slice(0, maxOptions);

    const detectTrigger = useCallback((text: string, cursor: number) => {
      const before = text.slice(0, cursor);
      // Look back for the trigger chars — active while we're still typing a word right after them
      const escTrigger = triggerChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escTrigger + "([\\w-]*)$");
      const match = before.match(re);
      if (match) {
        setTriggerStart(cursor - match[0].length);
        setQuery(match[1]);
        setActiveIdx(0);
      } else {
        setTriggerStart(null);
      }
    }, [triggerChars]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      onChange(v);
      detectTrigger(v, e.target.selectionStart ?? v.length);
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Also re-detect on arrow keys (cursor moves without input change)
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
        const el = e.currentTarget;
        detectTrigger(el.value, el.selectionStart ?? el.value.length);
      }
    };

    const pick = (opt: AutocompleteOption) => {
      const el = innerRef.current;
      if (!el || triggerStart === null) return;
      const cursor = el.selectionStart ?? value.length;
      const before = value.slice(0, triggerStart);
      const after = value.slice(cursor);
      const next = before + opt.value + after;
      onChange(next);
      setTriggerStart(null);
      requestAnimationFrame(() => {
        const e2 = innerRef.current;
        if (!e2) return;
        const pos = triggerStart + opt.value.length;
        e2.selectionStart = e2.selectionEnd = pos;
        e2.focus();
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (triggerStart === null || filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        pick(filtered[activeIdx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setTriggerStart(null);
      }
    };

    return (
      <div className="relative">
        <textarea
          ref={innerRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          rows={rows}
          className={clsx(
            "w-full bg-surface-muted/60 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent resize-y",
            className
          )}
        />
        {triggerStart !== null && filtered.length > 0 && (
          <div
            role="listbox"
            className="absolute z-20 top-full left-0 right-0 mt-1 max-h-64 overflow-auto bg-surface border border-border rounded-md shadow-lg py-1"
          >
            <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-text-muted border-b border-border">
              {filtered.length} match{filtered.length === 1 ? "" : "es"} — Tab to insert
            </div>
            {filtered.map((opt, i) => (
              <button
                key={opt.group + ":" + opt.value}
                type="button"
                onMouseDown={e => { e.preventDefault(); pick(opt); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer",
                  i === activeIdx ? "bg-surface-muted" : "hover:bg-surface-muted/60"
                )}
              >
                <span className="font-mono text-text">{opt.value}</span>
                <span className="text-text-muted ml-auto text-[10px] uppercase">{opt.group}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

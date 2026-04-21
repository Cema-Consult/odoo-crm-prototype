export const FIELD_CATALOG: Record<string, string[]> = {
  opportunities: [
    "id", "name", "partnerId", "salespersonId", "stageId",
    "expectedRevenue", "probability", "currency", "tags", "priority",
    "createdAt", "expectedClose", "description",
  ],
  contacts: [
    "id", "name", "isCompany", "parentId", "email", "phone",
    "title", "city", "country", "tags",
  ],
  activities: [
    "id", "opportunityId", "type", "summary", "scheduledAt", "done", "assignedTo",
  ],
  stages: ["id", "name", "sequence", "fold"],
  users: ["id", "name", "email", "avatar", "role"],
};

export const VALUES_CATALOG: Record<string, string[]> = {
  "widget types": ["stat_tile", "bar_chart", "line_chart", "pie_chart", "record_table", "activity_feed"],
  "aggregations": ["count", "sum", "avg", "min", "max"],
  "buckets": ["day", "week", "month", "stage", "salesperson", "tag", "priority", "type", "isCompany", "country"],
  "stage ids": ["s_new", "s_qualified", "s_proposition", "s_won", "s_lost"],
  "user ids": ["u_anna", "u_mikael", "u_sara", "u_jonas", "u_lena"],
  "activity types": ["call", "meeting", "email", "todo"],
  "currencies": ["EUR", "USD", "DKK"],
  "time tokens": ["now-7d", "now-30d", "now-3mo", "now-6mo", "now-1y"],
};

export type AutocompleteOption = { value: string; group: string };

export function getAutocompleteOptions(): AutocompleteOption[] {
  const out: AutocompleteOption[] = [];
  const seen = new Set<string>();
  const add = (value: string, group: string) => {
    const k = `${value}:${group}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ value, group });
  };
  for (const [ds, fields] of Object.entries(FIELD_CATALOG)) {
    for (const f of fields) add(f, ds);
  }
  for (const [cat, values] of Object.entries(VALUES_CATALOG)) {
    for (const v of values) add(v, cat);
  }
  return out;
}

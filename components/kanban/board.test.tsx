import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanBoard } from "./board";
import type { Opportunity, Stage, Contact } from "@/lib/schemas/core";

const stages: Stage[] = [
  { id: "s_new", name: "New", sequence: 1, fold: false },
  { id: "s_won", name: "Won", sequence: 2, fold: false },
];
const contacts: Contact[] = [{ id: "c1", name: "Acme", isCompany: true, parentId: null, email: "", phone: "", title: null, city: "", country: "", tags: [] }];
const opps: Opportunity[] = [
  { id: "o1", name: "Acme — Website", partnerId: "c1", salespersonId: "u1", stageId: "s_new",
    expectedRevenue: 1000, probability: 10, currency: "EUR", tags: [], priority: 1,
    createdAt: "2026-04-01T00:00:00Z", expectedClose: null, description: "" },
];

describe("KanbanBoard", () => {
  it("renders stage columns and cards", () => {
    const onDrop = vi.fn();
    render(<KanbanBoard stages={stages} opportunities={opps} contacts={contacts} onDrop={onDrop} />);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
    expect(screen.getByText("Acme — Website")).toBeInTheDocument();
  });
});

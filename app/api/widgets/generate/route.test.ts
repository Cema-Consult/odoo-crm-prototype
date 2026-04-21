import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(function () {
    return { messages: { create: (...args: any[]) => createMock(...args) } };
  }),
}));

vi.mock("@/lib/auth/role", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/role")>("@/lib/auth/role");
  return { ...actual, requireAdmin: () => null };
});

process.env.ANTHROPIC_API_KEY = "test-key";

// NOTE: import POST AFTER mocks are set up
import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/widgets/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validStatTile = {
  type: "stat_tile", title: "Total deals", dataSource: "opportunities", metric: { agg: "count" },
};

function mockReply(input: unknown) {
  return { content: [{ type: "tool_use", name: "emit_widget", input }] };
}

describe("POST /api/widgets/generate", () => {
  beforeEach(() => createMock.mockReset());

  it("returns spec on first valid LLM reply", async () => {
    createMock.mockResolvedValueOnce(mockReply(validStatTile));
    const res = await POST(req({ prompt: "count my deals" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.spec.type).toBe("stat_tile");
  });

  it("retries once on invalid spec", async () => {
    createMock.mockResolvedValueOnce(mockReply({ type: "stat_tile" }));  // missing required fields
    createMock.mockResolvedValueOnce(mockReply(validStatTile));
    const res = await POST(req({ prompt: "count deals" }));
    expect(res.status).toBe(200);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("returns BAD_SPEC after two invalid specs", async () => {
    createMock.mockResolvedValueOnce(mockReply({ type: "stat_tile" }));
    createMock.mockResolvedValueOnce(mockReply({ type: "stat_tile" }));
    const res = await POST(req({ prompt: "bad" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_SPEC");
  });

  it("returns 400 on empty prompt", async () => {
    const res = await POST(req({ prompt: "" }));
    expect(res.status).toBe(400);
  });
});

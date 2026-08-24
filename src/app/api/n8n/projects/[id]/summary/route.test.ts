import { describe, it, expect, vi, beforeEach } from "vitest";

const saveProjectAiSummaryMock = vi.fn();

vi.mock("@/lib/services/n8n/project-summary", () => ({
  saveProjectAiSummary: (...args: unknown[]) => saveProjectAiSummaryMock(...args),
}));

vi.mock("@/lib/env", () => ({
  env: { N8N_WEBHOOK_SECRET: "test-secret" },
  isN8NInboundConfigured: true,
  isCronConfigured: false,
}));

const { POST } = await import("./route");

const VALID_ID = "11111111-1111-1111-1111-111111111111";

const VALID_BODY = {
  project_summary: "Steady progress on the checkout redesign.",
  status: "ACTIVE",
  progress: {
    total_tasks: 4,
    completed_tasks: 1,
    in_progress_tasks: 2,
    pending_tasks: 1,
    overdue_tasks: 0,
    completion_percentage: 25,
  },
  key_updates: ["Design approved."],
  risks: ["Not available"],
  upcoming_deadlines: ["2026-09-01: launch"],
  recommended_actions: ["Finish checkout flow."],
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/n8n/projects/${VALID_ID}/summary`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

interface SuccessBody {
  success: boolean;
  projectId: string;
  generatedAt: string;
}

beforeEach(() => {
  saveProjectAiSummaryMock.mockReset();
});

describe("POST /api/n8n/projects/:id/summary", () => {
  it("rejects a request with no credential (401)", async () => {
    const res = await POST(makeRequest(VALID_BODY), { params: { id: VALID_ID } });
    expect(res.status).toBe(401);
    expect(saveProjectAiSummaryMock).not.toHaveBeenCalled();
  });

  it("rejects a request with an invalid credential (401)", async () => {
    const res = await POST(makeRequest(VALID_BODY, { "x-n8n-secret": "wrong" }), {
      params: { id: VALID_ID },
    });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed project id (400) before touching the service", async () => {
    const res = await POST(makeRequest(VALID_BODY, { "x-n8n-secret": "test-secret" }), {
      params: { id: "not-a-uuid" },
    });
    expect(res.status).toBe(400);
    expect(saveProjectAiSummaryMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid body (400) and reports field errors", async () => {
    const invalidBody = { ...VALID_BODY, progress: { ...VALID_BODY.progress, completion_percentage: 150 } };
    const res = await POST(makeRequest(invalidBody, { "x-n8n-secret": "test-secret" }), {
      params: { id: VALID_ID },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(saveProjectAiSummaryMock).not.toHaveBeenCalled();
  });

  it("rejects a body missing a required field (400)", async () => {
    const { project_summary, ...withoutSummary } = VALID_BODY;
    void project_summary;
    const res = await POST(makeRequest(withoutSummary, { "x-n8n-secret": "test-secret" }), {
      params: { id: VALID_ID },
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the project does not exist", async () => {
    saveProjectAiSummaryMock.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY, { "x-n8n-secret": "test-secret" }), {
      params: { id: VALID_ID },
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 with the expected response shape on success", async () => {
    saveProjectAiSummaryMock.mockResolvedValue({
      id: VALID_ID,
      aiSummaryGeneratedAt: new Date("2026-08-24T09:00:00.000Z"),
    });

    const res = await POST(makeRequest(VALID_BODY, { "x-n8n-secret": "test-secret" }), {
      params: { id: VALID_ID },
    });
    expect(res.status).toBe(200);

    const json = (await res.json()) as SuccessBody;
    expect(json).toEqual({
      success: true,
      projectId: VALID_ID,
      generatedAt: "2026-08-24T09:00:00.000Z",
    });
    expect(saveProjectAiSummaryMock).toHaveBeenCalledWith(VALID_ID, VALID_BODY);
  });

  it("returns 500 with a generic message when the service throws (never leaks internals)", async () => {
    saveProjectAiSummaryMock.mockRejectedValue(new Error("connection refused at 10.0.0.5:5432"));

    const res = await POST(makeRequest(VALID_BODY, { "x-n8n-secret": "test-secret" }), {
      params: { id: VALID_ID },
    });
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(JSON.stringify(json)).not.toContain("10.0.0.5");
    expect(json.error).toBe("Something went wrong on our end.");
  });
});

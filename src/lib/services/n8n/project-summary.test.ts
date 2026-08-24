import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const logAuditEventMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEventMock(...args),
}));

import { saveProjectAiSummary } from "./project-summary";

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";

const VALID_SUMMARY = {
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

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockReset();
  logAuditEventMock.mockReset();
});

describe("saveProjectAiSummary", () => {
  it("returns null without writing anything when the project does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await saveProjectAiSummary(PROJECT_ID, VALID_SUMMARY);

    expect(result).toBeNull();
    expect(updateMock).not.toHaveBeenCalled();
    expect(logAuditEventMock).not.toHaveBeenCalled();
  });

  it("updates an existing project with the complete summary and a generated timestamp", async () => {
    findUniqueMock.mockResolvedValue({ id: PROJECT_ID });
    updateMock.mockResolvedValue({ id: PROJECT_ID, aiSummaryGeneratedAt: new Date("2026-08-24T09:00:00Z") });

    const result = await saveProjectAiSummary(PROJECT_ID, VALID_SUMMARY);

    expect(result).toEqual({ id: PROJECT_ID, aiSummaryGeneratedAt: new Date("2026-08-24T09:00:00Z") });
    expect(updateMock).toHaveBeenCalledTimes(1);

    const call = updateMock.mock.calls[0][0];
    expect(call.where).toEqual({ id: PROJECT_ID });
    expect(call.data.aiSummary).toEqual(VALID_SUMMARY);
    expect(call.data.aiSummaryGeneratedAt).toBeInstanceOf(Date);
  });

  it("never includes status, progress, priority, or deadline in the update payload", async () => {
    findUniqueMock.mockResolvedValue({ id: PROJECT_ID });
    updateMock.mockResolvedValue({ id: PROJECT_ID, aiSummaryGeneratedAt: new Date() });

    await saveProjectAiSummary(PROJECT_ID, VALID_SUMMARY);

    const dataKeys = Object.keys(updateMock.mock.calls[0][0].data);
    expect(dataKeys.sort()).toEqual(["aiSummary", "aiSummaryGeneratedAt"]);
    expect(dataKeys).not.toContain("status");
    expect(dataKeys).not.toContain("progress");
    expect(dataKeys).not.toContain("priority");
    expect(dataKeys).not.toContain("deadline");
  });

  it("records a PROJECT_AI_SUMMARY_GENERATED audit event with minimal metadata", async () => {
    findUniqueMock.mockResolvedValue({ id: PROJECT_ID });
    updateMock.mockResolvedValue({ id: PROJECT_ID, aiSummaryGeneratedAt: new Date() });

    await saveProjectAiSummary(PROJECT_ID, VALID_SUMMARY);

    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PROJECT_AI_SUMMARY_GENERATED",
        entity: "Project",
        entityId: PROJECT_ID,
        metadata: expect.objectContaining({
          status: "ACTIVE",
          completionPercentage: 25,
        }),
      })
    );
  });
});

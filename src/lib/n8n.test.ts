import { describe, it, expect, vi, beforeEach } from "vitest";

const upsertMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    automationRun: {
      upsert: (...args: unknown[]) => upsertMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

async function loadWithEnv(configured: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({
    env: configured
      ? { N8N_WEBHOOK_URL: "https://n8n.example.com/webhook/lead", N8N_WEBHOOK_SECRET: "shared-secret" }
      : { N8N_WEBHOOK_URL: "", N8N_WEBHOOK_SECRET: "" },
    isN8NConfigured: configured,
  }));
  return import("./n8n");
}

beforeEach(() => {
  vi.restoreAllMocks();
  upsertMock.mockReset();
  updateMock.mockReset();
  upsertMock.mockResolvedValue({ id: "run-1" });
  updateMock.mockResolvedValue({});
});

describe("triggerN8nWebhook", () => {
  it("never throws and records a FAILED AutomationRun when n8n is not configured", async () => {
    const { triggerN8nWebhook } = await loadWithEnv(false);

    const result = await triggerN8nWebhook({
      eventType: "LEAD_CREATED",
      entityType: "Lead",
      entityId: "lead-1",
      payload: { leadId: "lead-1" },
    });

    expect(result).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-1" },
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
  });

  it("records SUCCESS and returns the execution id when n8n responds OK", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (name: string) => (name === "x-n8n-execution-id" ? "exec-123" : null) },
    });
    vi.stubGlobal("fetch", fetchMock);

    const { triggerN8nWebhook } = await loadWithEnv(true);

    const result = await triggerN8nWebhook({
      eventType: "PROJECT_CREATED",
      entityType: "Project",
      entityId: "proj-1",
      payload: { projectId: "proj-1" },
    });

    expect(result).toBe("exec-123");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUCCESS", executionId: "exec-123" }) })
    );
  });

  it("never throws and records FAILED when the network call rejects (n8n unreachable/timeout)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    const { triggerN8nWebhook } = await loadWithEnv(true);

    await expect(
      triggerN8nWebhook({
        eventType: "TASK_CREATED",
        entityType: "Task",
        entityId: "task-1",
        payload: {},
      })
    ).resolves.toBeUndefined();

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) })
    );
  });

  it("never throws and records FAILED when n8n responds with a non-2xx status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, headers: { get: () => null } });
    vi.stubGlobal("fetch", fetchMock);

    const { triggerN8nWebhook } = await loadWithEnv(true);

    const result = await triggerN8nWebhook({
      eventType: "TASK_UPDATED",
      entityType: "Task",
      entityId: "task-1",
      payload: {},
    });

    expect(result).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) })
    );
  });

  it("upserts the SAME AutomationRun row for repeated calls with the same event+entity (idempotency)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => null } });
    vi.stubGlobal("fetch", fetchMock);

    const { triggerN8nWebhook } = await loadWithEnv(true);

    await triggerN8nWebhook({ eventType: "LEAD_CREATED", entityType: "Lead", entityId: "lead-42", payload: {} });
    await triggerN8nWebhook({ eventType: "LEAD_CREATED", entityType: "Lead", entityId: "lead-42", payload: {} });

    expect(upsertMock).toHaveBeenCalledTimes(2);
    const firstCallArg = upsertMock.mock.calls[0][0];
    const secondCallArg = upsertMock.mock.calls[1][0];
    // Same idempotencyKey both times -> Prisma's upsert targets one row,
    // never creates a second AutomationRun for the same logical event.
    expect(firstCallArg.where.idempotencyKey).toBe(secondCallArg.where.idempotencyKey);
    expect(firstCallArg.where.idempotencyKey).toBe("LEAD_CREATED-lead-42");
  });
});

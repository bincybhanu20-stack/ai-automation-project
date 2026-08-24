import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueProject = vi.fn();
const findManyTask = vi.fn();
const findManyMessage = vi.fn();
const findManyMilestone = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: (...args: unknown[]) => findUniqueProject(...args) },
    task: { findMany: (...args: unknown[]) => findManyTask(...args) },
    projectMessage: { findMany: (...args: unknown[]) => findManyMessage(...args) },
    milestone: { findMany: (...args: unknown[]) => findManyMilestone(...args) },
  },
}));

vi.mock("@/lib/env", () => ({
  env: { N8N_WEBHOOK_SECRET: "test-secret" },
  isN8NInboundConfigured: true,
  isCronConfigured: false,
}));

const { GET } = await import("./route");

const VALID_ID = "11111111-1111-1111-1111-111111111111";

interface ContextResponseBody {
  project: { id: string; title: string };
  tasks: unknown[];
  updates: Array<{ type: string; entityId: string }>;
}

function makeRequest(headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/n8n/projects/${VALID_ID}/context`, { headers });
}

beforeEach(() => {
  findUniqueProject.mockReset();
  findManyTask.mockReset();
  findManyMessage.mockReset();
  findManyMilestone.mockReset();
});

describe("GET /api/n8n/projects/:id/context", () => {
  it("rejects a request with no credential (401)", async () => {
    const res = await GET(makeRequest(), { params: { id: VALID_ID } });
    expect(res.status).toBe(401);
    expect(findUniqueProject).not.toHaveBeenCalled();
  });

  it("rejects a request with an invalid credential (401)", async () => {
    const res = await GET(makeRequest({ "x-n8n-secret": "wrong" }), { params: { id: VALID_ID } });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed project id (400) before touching the database", async () => {
    const res = await GET(makeRequest({ "x-n8n-secret": "test-secret" }), { params: { id: "not-a-uuid" } });
    expect(res.status).toBe(400);
    expect(findUniqueProject).not.toHaveBeenCalled();
  });

  it("returns 404 for a well-formed id that doesn't exist", async () => {
    findUniqueProject.mockResolvedValue(null);
    const res = await GET(makeRequest({ "x-n8n-secret": "test-secret" }), { params: { id: VALID_ID } });
    expect(res.status).toBe(404);
  });

  it("returns real project + tasks + a combined updates feed for an existing project", async () => {
    findUniqueProject.mockResolvedValue({
      id: VALID_ID,
      title: "Website Revamp",
      description: "Rebuild the marketing site",
      status: "ACTIVE",
      priority: "HIGH",
      progress: 40,
      budget: 5000,
      startDate: new Date("2026-01-01"),
      deadline: new Date("2026-03-01"),
      createdAt: new Date("2025-12-01"),
      updatedAt: new Date("2026-01-10"),
      client: { id: "c1", companyName: "Acme", industry: "Retail", email: "a@acme.com", phone: null, status: "ACTIVE" },
      manager: { id: "m1", name: "Pat Manager", email: "pat@example.com" },
    });
    findManyTask.mockResolvedValue([
      {
        id: "t1",
        title: "Build homepage",
        description: null,
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date("2026-02-01"),
        completedAt: null,
        createdAt: new Date("2026-01-02"),
        updatedAt: new Date("2026-01-15"),
        assignee: { id: "u1", name: "Sam Dev", email: "sam@example.com" },
        creator: { id: "u2", name: "Pat Manager" },
      },
    ]);
    findManyMessage.mockResolvedValue([
      {
        id: "msg1",
        body: "Loving the progress so far!",
        createdAt: new Date("2026-01-16"),
        author: { id: "cu1", name: "Client User", role: "CLIENT" },
      },
    ]);
    findManyMilestone.mockResolvedValue([
      {
        id: "ms1",
        title: "Design approved",
        description: null,
        dueDate: new Date("2026-01-10"),
        completedAt: new Date("2026-01-09"),
        order: 0,
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const res = await GET(makeRequest({ "x-n8n-secret": "test-secret" }), { params: { id: VALID_ID } });
    expect(res.status).toBe(200);

    const json = (await res.json()) as ContextResponseBody;
    expect(json.project.title).toBe("Website Revamp");
    expect(json.tasks).toHaveLength(1);
    expect(json.updates).toHaveLength(3);
    expect(json.updates.map((u) => u.type).sort()).toEqual(["message", "milestone", "task"]);
  });

  it("returns empty tasks/updates arrays (not an error) for a project with none yet", async () => {
    findUniqueProject.mockResolvedValue({
      id: VALID_ID,
      title: "Brand New Project",
      description: null,
      status: "PLANNING",
      priority: "MEDIUM",
      progress: 0,
      budget: 0,
      startDate: null,
      deadline: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: { id: "c1", companyName: "Acme", industry: null, email: null, phone: null, status: "ACTIVE" },
      manager: null,
    });
    findManyTask.mockResolvedValue([]);
    findManyMessage.mockResolvedValue([]);
    findManyMilestone.mockResolvedValue([]);

    const res = await GET(makeRequest({ "x-n8n-secret": "test-secret" }), { params: { id: VALID_ID } });
    expect(res.status).toBe(200);

    const json = (await res.json()) as ContextResponseBody;
    expect(json.tasks).toEqual([]);
    expect(json.updates).toEqual([]);
  });
});

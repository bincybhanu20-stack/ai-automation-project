import { describe, it, expect } from "vitest";
import { buildProjectUpdatesFeed } from "./project-context";

describe("buildProjectUpdatesFeed", () => {
  it("returns an empty array for a project with no tasks, messages, or milestones", () => {
    expect(buildProjectUpdatesFeed({ tasks: [], messages: [], milestones: [] })).toEqual([]);
  });

  it("normalizes a task into a 'task' update using its real title and status", () => {
    const updates = buildProjectUpdatesFeed({
      tasks: [{ id: "t1", title: "Build homepage", status: "IN_PROGRESS", updatedAt: new Date("2026-01-15T00:00:00Z") }],
      messages: [],
      milestones: [],
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      type: "task",
      entityId: "t1",
      content: 'Task "Build homepage" is IN_PROGRESS.',
      date: "2026-01-15T00:00:00.000Z",
    });
  });

  it("normalizes a message into a 'message' update carrying the real body, unmodified", () => {
    const updates = buildProjectUpdatesFeed({
      tasks: [],
      messages: [
        {
          id: "m1",
          body: "Loving the progress so far!",
          createdAt: new Date("2026-01-16T00:00:00Z"),
          author: { id: "u1", name: "Client User", role: "CLIENT" },
        },
      ],
      milestones: [],
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      type: "message",
      entityId: "m1",
      content: "Loving the progress so far!",
      meta: { authorId: "u1", authorName: "Client User", authorRole: "CLIENT" },
    });
  });

  it("normalizes a message with no author (author account deleted) without throwing", () => {
    const updates = buildProjectUpdatesFeed({
      tasks: [],
      messages: [{ id: "m1", body: "hi", createdAt: new Date("2026-01-16T00:00:00Z"), author: null }],
      milestones: [],
    });
    expect(updates[0].meta).toEqual({ authorId: null, authorName: null, authorRole: null });
  });

  it("marks a completed milestone as completed and dates it by completedAt", () => {
    const updates = buildProjectUpdatesFeed({
      tasks: [],
      messages: [],
      milestones: [
        {
          id: "ms1",
          title: "Design approved",
          description: null,
          dueDate: new Date("2026-01-10T00:00:00Z"),
          completedAt: new Date("2026-01-09T00:00:00Z"),
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
    });
    expect(updates[0]).toMatchObject({
      type: "milestone",
      content: 'Milestone "Design approved" completed.',
      date: "2026-01-09T00:00:00.000Z",
      meta: { completed: true },
    });
  });

  it("describes an incomplete milestone by its due date instead of inventing a status", () => {
    const updates = buildProjectUpdatesFeed({
      tasks: [],
      messages: [],
      milestones: [
        {
          id: "ms1",
          title: "Launch",
          description: null,
          dueDate: new Date("2026-03-01T00:00:00Z"),
          completedAt: null,
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
    });
    expect(updates[0].content).toBe('Milestone "Launch" due 2026-03-01.');
    expect(updates[0].meta).toMatchObject({ completed: false });
  });

  it("combines all three sources and sorts them most-recent-first", () => {
    const updates = buildProjectUpdatesFeed({
      tasks: [{ id: "t1", title: "Old task", status: "TODO", updatedAt: new Date("2026-01-01T00:00:00Z") }],
      messages: [
        { id: "m1", body: "Newest", createdAt: new Date("2026-01-20T00:00:00Z"), author: null },
      ],
      milestones: [
        {
          id: "ms1",
          title: "Middle",
          description: null,
          dueDate: null,
          completedAt: new Date("2026-01-10T00:00:00Z"),
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
    });
    expect(updates.map((u) => u.entityId)).toEqual(["m1", "ms1", "t1"]);
  });
});

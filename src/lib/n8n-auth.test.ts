import { describe, it, expect, vi, beforeEach } from "vitest";

interface EnvOverrides {
  N8N_WEBHOOK_SECRET?: string;
  CRON_SECRET?: string;
}

async function loadWithEnv(overrides: EnvOverrides) {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({
    env: { N8N_WEBHOOK_SECRET: overrides.N8N_WEBHOOK_SECRET, CRON_SECRET: overrides.CRON_SECRET },
    isN8NInboundConfigured: Boolean(overrides.N8N_WEBHOOK_SECRET?.trim()),
    isCronConfigured: Boolean(overrides.CRON_SECRET?.trim()),
  }));
  return import("./n8n-auth");
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("verifyN8nSecret", () => {
  it("rejects with 503 when N8N_WEBHOOK_SECRET is not configured", async () => {
    const { verifyN8nSecret } = await loadWithEnv({});
    const res = verifyN8nSecret(new Request("http://localhost/api/n8n/x"));
    expect(res?.status).toBe(503);
  });

  it("rejects with 401 when the credential header is missing", async () => {
    const { verifyN8nSecret } = await loadWithEnv({ N8N_WEBHOOK_SECRET: "correct-secret" });
    const res = verifyN8nSecret(new Request("http://localhost/api/n8n/x"));
    expect(res?.status).toBe(401);
  });

  it("rejects with 401 when the credential is wrong", async () => {
    const { verifyN8nSecret } = await loadWithEnv({ N8N_WEBHOOK_SECRET: "correct-secret" });
    const res = verifyN8nSecret(
      new Request("http://localhost/api/n8n/x", { headers: { "x-n8n-secret": "wrong-secret" } })
    );
    expect(res?.status).toBe(401);
  });

  it("rejects a credential of a different length than the real secret", async () => {
    // Regression guard: an early implementation using a plain `a === b` or a
    // length-sensitive comparison can behave differently for short guesses.
    const { verifyN8nSecret } = await loadWithEnv({ N8N_WEBHOOK_SECRET: "a-fairly-long-correct-secret-value" });
    const res = verifyN8nSecret(
      new Request("http://localhost/api/n8n/x", { headers: { "x-n8n-secret": "x" } })
    );
    expect(res?.status).toBe(401);
  });

  it("allows the request through (returns null) when the credential is correct", async () => {
    const { verifyN8nSecret } = await loadWithEnv({ N8N_WEBHOOK_SECRET: "correct-secret" });
    const res = verifyN8nSecret(
      new Request("http://localhost/api/n8n/x", { headers: { "x-n8n-secret": "correct-secret" } })
    );
    expect(res).toBeNull();
  });

  it("never echoes the configured secret back in an error response body", async () => {
    const { verifyN8nSecret } = await loadWithEnv({ N8N_WEBHOOK_SECRET: "super-secret-value" });
    const res = verifyN8nSecret(
      new Request("http://localhost/api/n8n/x", { headers: { "x-n8n-secret": "wrong" } })
    );
    const body = await res!.json();
    expect(JSON.stringify(body)).not.toContain("super-secret-value");
  });
});

describe("verifyCronSecret", () => {
  it("rejects with 503 when CRON_SECRET is not configured", async () => {
    const { verifyCronSecret } = await loadWithEnv({});
    const res = verifyCronSecret(new Request("http://localhost/api/cron/automation-scan"));
    expect(res?.status).toBe(503);
  });

  it("rejects with 401 when the Authorization header is missing", async () => {
    const { verifyCronSecret } = await loadWithEnv({ CRON_SECRET: "cron-value" });
    const res = verifyCronSecret(new Request("http://localhost/api/cron/automation-scan"));
    expect(res?.status).toBe(401);
  });

  it("rejects with 401 when the bearer token is wrong", async () => {
    const { verifyCronSecret } = await loadWithEnv({ CRON_SECRET: "cron-value" });
    const res = verifyCronSecret(
      new Request("http://localhost/api/cron/automation-scan", {
        headers: { authorization: "Bearer wrong-value" },
      })
    );
    expect(res?.status).toBe(401);
  });

  it("allows the request through when Vercel's auto-attached bearer token matches", async () => {
    const { verifyCronSecret } = await loadWithEnv({ CRON_SECRET: "cron-value" });
    const res = verifyCronSecret(
      new Request("http://localhost/api/cron/automation-scan", {
        headers: { authorization: "Bearer cron-value" },
      })
    );
    expect(res).toBeNull();
  });
});

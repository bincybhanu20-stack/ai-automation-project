import { NextResponse } from "next/server";
import { getAuthSession, clearAuthCookie } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getAuthSession();
  await clearAuthCookie();

  if (session) {
    await logAuditEvent({
      userId: session.userId,
      action: "USER_LOGOUT",
      entity: "Auth",
      entityId: session.userId,
    });
  }

  return NextResponse.json({ redirectTo: "/login" });
}

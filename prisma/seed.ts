/**
 * Database seed script.
 *
 * Run with:  npm run db:seed
 *
 * SAFE TO RUN MORE THAN ONCE. Every record is upserted — users by email,
 * and the demo Lead/Client/Project/Task/Notification/AutomationRun/AuditLog
 * by a fixed id declared below — so re-running never creates duplicates.
 *
 * Note: this file imports bcryptjs directly rather than src/lib/auth.ts,
 * because auth.ts imports next/headers which only works inside a running
 * Next.js server, not in a plain Node script.
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Fixed ids for demo records below, so re-running this script updates the
// same rows instead of creating new ones each time.
const DEMO_LEAD_ID = "00000000-0000-0000-0000-000000000101";
const DEMO_CONVERTED_CLIENT_ID = "00000000-0000-0000-0000-000000000102";
const DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000103";
const DEMO_TASK_ID = "00000000-0000-0000-0000-000000000104";
const DEMO_NOTIFICATION_ID = "00000000-0000-0000-0000-000000000105";
const DEMO_AUTOMATION_RUN_ID = "00000000-0000-0000-0000-000000000106";
const DEMO_AUDIT_LOG_ID = "00000000-0000-0000-0000-000000000107";

// A second client company + login, separate from Dana Reyes's account,
// specifically so authorization tests can prove one client can't see
// another client's data. Not part of SEED_USERS below because that list is
// keyed one-per-role, and this is a second CLIENT-role account.
const SEED_CLIENT_2 = {
  email: "client2@clientflow.local",
  name: "Morgan Lee",
  password: "Client123!",
  role: Role.CLIENT,
  companyName: "Globex Trading Co",
};

// Development-only credentials. Change these before going to production.
const SEED_USERS = [
  {
    email: "admin@clientflow.local",
    name: "Platform Admin",
    password: "Admin123!",
    role: Role.ADMIN,
  },
  {
    email: "manager@clientflow.local",
    name: "Priya Menon",
    password: "Manager123!",
    role: Role.PROJECT_MANAGER,
  },
  {
    email: "member@clientflow.local",
    name: "Sam Okafor",
    password: "Member123!",
    role: Role.TEAM_MEMBER,
  },
  {
    email: "client@clientflow.local",
    name: "Dana Reyes",
    password: "Client123!",
    role: Role.CLIENT,
  },
];

async function main() {
  console.log("Seeding database…\n");

  // --- Users ---
  const users: Record<string, { id: string; email: string; role: Role }> = {};

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        // Admin-provisioned dev accounts are trusted from creation — there's
        // no public self-signup flow for this platform to verify against.
        emailVerifiedAt: new Date(),
      },
    });

    users[user.role] = record;
    console.log(`  user            ${record.email.padEnd(28)} ${record.role}`);
  }

  // --- Second client login (Morgan Lee / Globex), for isolation testing ---
  const client2PasswordHash = await bcrypt.hash(SEED_CLIENT_2.password, 10);
  const client2User = await prisma.user.upsert({
    where: { email: SEED_CLIENT_2.email },
    update: { name: SEED_CLIENT_2.name, role: SEED_CLIENT_2.role },
    create: {
      email: SEED_CLIENT_2.email,
      name: SEED_CLIENT_2.name,
      passwordHash: client2PasswordHash,
      role: SEED_CLIENT_2.role,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  user            ${client2User.email.padEnd(28)} ${client2User.role}`);

  const client2 = await prisma.client.upsert({
    where: { userId: client2User.id },
    update: {},
    create: {
      userId: client2User.id,
      companyName: SEED_CLIENT_2.companyName,
      industry: "Logistics",
      email: client2User.email,
      phone: "+971 50 999 8888",
    },
  });
  console.log(`  client          ${client2.companyName} (for isolation testing)`);

  const admin = users[Role.ADMIN];
  const manager = users[Role.PROJECT_MANAGER];
  const member = users[Role.TEAM_MEMBER];
  const clientUser = users[Role.CLIENT];

  // --- Client (existing portal client, Dana Reyes) ---
  const existingClient = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      companyName: "Reyes Digital Ltd",
      industry: "E-commerce",
      email: clientUser.email,
      phone: "+971 50 000 0000",
    },
  });
  console.log(`  client          ${existingClient.companyName}`);

  // --- Lead (assigned to the manager, not yet converted) ---
  const lead = await prisma.lead.upsert({
    where: { id: DEMO_LEAD_ID },
    update: {},
    create: {
      id: DEMO_LEAD_ID,
      name: "Jordan Blake",
      email: "jordan.blake@acme-robotics.example",
      company: "Acme Robotics",
      phone: "+971 55 111 2222",
      source: "WEBSITE",
      message:
        "We need an automation platform to manage our client onboarding and project budget tracking.",
      service: "Automation Platform",
      budgetRange: "$10,000 - $25,000",
      status: "QUALIFIED",
      assignedToId: manager.id,
      qualificationScore: 82,
      qualificationSummary:
        "High-priority opportunity. Client intent score 82/100. Strong commercial fit detected for automation workflows.",
      qualificationReason:
        'Rules engine adjusted score based on: mentions "automation", mentions "platform", mentions "budget", company name provided, detailed message.',
      aiProcessedAt: new Date(),
    },
  });
  console.log(`  lead            ${lead.name} (${lead.company})`);

  // --- Convert the lead into a new client (no portal login yet) ---
  const convertedClient = await prisma.client.upsert({
    where: { id: DEMO_CONVERTED_CLIENT_ID },
    update: {},
    create: {
      id: DEMO_CONVERTED_CLIENT_ID,
      companyName: "Acme Robotics Ltd",
      industry: "Robotics",
      status: "ACTIVE",
      email: lead.email,
      phone: lead.phone,
      // userId intentionally omitted: this client doesn't have a portal
      // account yet. Demonstrates that Client.userId is optional.
      convertedFromLeadId: lead.id,
    },
  });
  console.log(`  client          ${convertedClient.companyName} (converted from lead, no login yet)`);

  // --- Project for the existing (Dana Reyes) client, managed by the PM ---
  const project = await prisma.project.upsert({
    where: { id: DEMO_PROJECT_ID },
    update: {},
    create: {
      id: DEMO_PROJECT_ID,
      title: "Website Revamp",
      description: "Redesign the storefront and integrate the new checkout flow.",
      status: "ACTIVE",
      priority: "HIGH",
      progress: 35,
      budget: 18000,
      clientId: existingClient.id,
      managerId: manager.id,
    },
  });
  console.log(`  project         ${project.title}`);

  // --- Task under that project, assigned to the team member ---
  const task = await prisma.task.upsert({
    where: { id: DEMO_TASK_ID },
    update: {},
    create: {
      id: DEMO_TASK_ID,
      title: "Implement checkout flow",
      description: "Build the new multi-step checkout with payment provider integration.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: project.id,
      assigneeId: member.id,
      creatorId: manager.id,
    },
  });
  console.log(`  task            ${task.title}`);

  // --- Notification for the admin about the new lead ---
  const notification = await prisma.notification.upsert({
    where: { id: DEMO_NOTIFICATION_ID },
    update: {},
    create: {
      id: DEMO_NOTIFICATION_ID,
      userId: admin.id,
      title: "New lead qualified",
      message: `${lead.name} from ${lead.company} was auto-qualified with a score of ${lead.qualificationScore}.`,
      type: "SUCCESS",
      entityType: "Lead",
      entityId: lead.id,
    },
  });
  console.log(`  notification    ${notification.title}`);

  // --- AutomationRun recording a simulated n8n execution ---
  const automationRun = await prisma.automationRun.upsert({
    where: { id: DEMO_AUTOMATION_RUN_ID },
    update: {},
    create: {
      id: DEMO_AUTOMATION_RUN_ID,
      workflowName: "lead-qualified-notification",
      entityType: "Lead",
      entityId: lead.id,
      executionId: "n8n-exec-demo-0001",
      status: "SUCCESS",
      idempotencyKey: `lead-qualified-${lead.id}`,
      completedAt: new Date(),
    },
  });
  console.log(`  automation run  ${automationRun.workflowName} -> ${automationRun.status}`);

  // --- AuditLog recording the qualification action ---
  const auditLog = await prisma.auditLog.upsert({
    where: { id: DEMO_AUDIT_LOG_ID },
    update: {},
    create: {
      id: DEMO_AUDIT_LOG_ID,
      userId: manager.id,
      action: "LEAD_QUALIFIED",
      entity: "Lead",
      entityId: lead.id,
      metadata: { oldStatus: "NEW", newStatus: "QUALIFIED", score: lead.qualificationScore },
      ipAddress: "127.0.0.1",
    },
  });
  console.log(`  audit log       ${auditLog.action}`);

  console.log("\nSeed complete.\n");
  console.log("Login credentials (development only):");
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(16)} ${u.email.padEnd(28)} ${u.password}`);
  }
  console.log(
    `  ${SEED_CLIENT_2.role.padEnd(16)} ${SEED_CLIENT_2.email.padEnd(28)} ${SEED_CLIENT_2.password}  (Globex — isolation test account)`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

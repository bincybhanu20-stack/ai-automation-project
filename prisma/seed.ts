/**
 * Database seed script.
 *
 * Run with:  npm run db:seed
 *
 * It is SAFE to run more than once. Every record uses `upsert`, which means
 * "update it if it exists, otherwise create it" — so you never get duplicates
 * and you never lose data you added manually.
 *
 * Note: this file imports bcryptjs directly rather than src/lib/auth.ts,
 * because auth.ts imports next/headers which only works inside a running
 * Next.js server, not in a plain Node script.
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  for (const user of SEED_USERS) {
    // Hash the password — we never store plain text.
    const passwordHash = await bcrypt.hash(user.password, 10);

    const record = await prisma.user.upsert({
      where: { email: user.email },
      // On re-run, refresh the name/role but keep the existing id.
      update: { name: user.name, role: user.role },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
      },
    });

    console.log(`  user   ${record.email.padEnd(28)} ${record.role}`);
  }

  // Give the CLIENT user a client profile, so the Phase 6 portal has data.
  const clientUser = await prisma.user.findUniqueOrThrow({
    where: { email: "client@clientflow.local" },
  });

  const client = await prisma.client.upsert({
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

  console.log(`  client ${client.companyName}`);

  console.log("\nSeed complete.\n");
  console.log("Login credentials (development only):");
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(16)} ${u.email.padEnd(28)} ${u.password}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    // Non-zero exit code tells npm the script failed.
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

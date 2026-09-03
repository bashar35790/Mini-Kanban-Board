import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../src/lib/prisma";

// Seed creates a demo user + a second user for sharing, plus a demo board
// with columns and tasks. Run with: npx tsx prisma/seed.ts

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  advanced: {
    cookiePrefix: "kanban",
  },
});

const DEMO_USER = {
  name: "Demo User",
  email: "demo@kanban.local",
  password: "password123",
};

const DEMO_SHARED_USER = {
  name: "Collaborator",
  email: "collab@kanban.local",
  password: "password123",
};

async function upsertUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    console.log(`User ${input.email} already exists`);
    return existing;
  }
  const res = await auth.api.signUpEmail({ body: input });
  console.log(`Created user ${input.email} (${res.user.id})`);
  return res.user;
}

async function main() {
  console.log("Seeding demo data...");

  const owner = await upsertUser(DEMO_USER);
  await upsertUser(DEMO_SHARED_USER);

  // Create the demo board if it doesn't exist
  const existingBoard = await prisma.board.findFirst({
    where: { title: "Product Launch" },
  });

  if (existingBoard) {
    console.log("Demo board already exists, skipping board creation");
    return;
  }

  const board = await prisma.board.create({
    data: {
      title: "Product Launch",
      description: "A sample kanban board to demo the app",
      ownerId: owner.id,
      members: {
        create: [{ userId: owner.id, role: "OWNER" }],
      },
    },
  });

  console.log(`Created board ${board.id}`);

  const columnTitles = ["Backlog", "To Do", "In Progress", "Done"];
  const tasksByColumn: Record<string, string[]> = {
    Backlog: [
      "Write press release",
      "Prepare launch metrics dashboard",
      "Draft customer onboarding emails",
    ],
    "To Do": [
      "Finalize pricing page",
      "Record product demo video",
    ],
    "In Progress": [
      "Build landing page",
      "Integrate analytics tracking",
    ],
    Done: [
      "Set up marketing blog",
      "Define beta feedback survey",
    ],
  };

  let colPos = 1000;
  for (const title of columnTitles) {
    const column = await prisma.column.create({
      data: {
        boardId: board.id,
        title,
        position: colPos,
      },
    });

    colPos += 1000;

    let taskPos = 1000;
    for (const taskTitle of tasksByColumn[title] ?? []) {
      await prisma.task.create({
        data: {
          columnId: column.id,
          title: taskTitle,
          description: null,
          position: taskPos,
          createdById: owner.id,
        },
      });
      taskPos += 1000;
    }
  }

  console.log("Seeded columns and tasks for demo board");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

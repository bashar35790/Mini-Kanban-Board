import { PrismaPg } from "@prisma/adapter-pg";
// Prisma 7's new generator ("prisma-client") emits client under /client —
// note the trailing /client segment (unlike prisma-client-js)
import { PrismaClient } from "../generated/prisma/client";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

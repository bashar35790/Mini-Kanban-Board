// prisma.config.ts — sits at the backend root, next to package.json (NOT inside prisma/)
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

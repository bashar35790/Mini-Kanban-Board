import { betterAuth } from "better-auth";

// Placeholder auth config for the Express shell (T02).
// Finalized in T05 with the Prisma adapter and httpOnly cookie settings.
export const auth = betterAuth({
  emailAndPassword: { enabled: true },
});

# Mini Kanban Board — Full-Stack Implementation Plan

**Role:** Full-Stack Engineer Technical Assessment  
**Timeline:** 4 Days  
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4 | Node.js + Express.js + TypeScript | PostgreSQL (Supabase) + Prisma | Better Auth (email/password, httpOnly cookie sessions) | Docker  

---

## 0. Codebase Review Summary

Before planning, the existing workspace was reviewed:

```
d:\Test-docker\
├── docker-compose.yml     ← Already defines postgres (5432), backend (5000), frontend (3000)
├── backend\
│   ├── Dockerfile         ← Node 20-alpine, runs npm run start:dev, EXPOSE 5000
│   └── .dockerignore
└── frontend\
    ├── Dockerfile         ← Node 20-alpine, runs npm run dev, EXPOSE 3000
    ├── package.json       ← Next.js 16.3.4, React 19, Tailwind CSS v4
    ├── app\
    │   ├── layout.tsx     ← Geist font, bare-bones RootLayout
    │   └── page.tsx       ← Default Next.js placeholder page
    └── (other config files)
```

**Key observations:**
- The frontend is already scaffolded with Next.js + TypeScript + Tailwind CSS v4 (uses `@tailwindcss/postcss` — no `tailwind.config.js`; all config in CSS via `@theme`)
- The backend directory only has a `Dockerfile` — no source code yet; we build it from scratch
- `docker-compose.yml` already wires postgres → backend (depends_on with healthcheck), but needs env var updates for Better Auth
- Backend port is `5000` (not 4000); we keep `5000`

---

## 1. Objective

Build a fully functional Mini Kanban Board where users can:
- Register and log in (email + password via Better Auth)
- Create, update, delete **Boards**
- Share boards with other registered users (OWNER / EDITOR / VIEWER roles)
- Manage **Columns** and **Tasks** within boards they have access to
- Drag-and-drop tasks within and across columns (fractional-index ordering)
- Access the app locally via `docker-compose up` in one command

Deliverable: single repo (`/frontend`, `/backend`), `README.md`, `docker-compose.yml`, `.env.example` files, optional live deployment.

---

## 2. Confirmed Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | Already scaffolded in `/frontend` |
| **Backend** | Express.js + TypeScript | User's preference over NestJS |
| **ORM** | Prisma 7 | Works with Supabase Postgres; Prisma adapter for Better Auth |
| **Database** | Supabase (managed PostgreSQL) | `DATABASE_URL` = pooled (pgBouncer), `DIRECT_URL` = direct for migrations |
| **Auth** | Better Auth — `email-password` plugin + `prismaAdapter` | httpOnly cookie sessions; no JWT plugin needed — see §5.1 |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` | Lightweight, React 19 compatible |
| **State / Data Fetching** | TanStack Query (React Query v5) | Server-state cache + optimistic updates |
| **DevOps** | Docker Compose | 3 services: postgres, backend, frontend |

---

## 3. Architecture

```
┌───────────────────────────────────────────────────┐
│              Next.js Frontend (port 3000)           │
│  better-auth/client  ←→  TanStack Query  ←→  dnd-kit│
└─────────────────────────┬─────────────────────────┘
                           │ HTTP with credentials: "include"
                           │ Auth calls:  POST /api/auth/*
                           │ API calls:   /api/v1/*  (cookie auto-sent)
                           ▼
┌───────────────────────────────────────────────────┐
│          Express.js Backend (port 5000)             │
│                                                     │
│  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  Better Auth      │  │  Kanban API            │  │
│  │  (mounted at      │  │  /api/v1/boards        │  │
│  │   /api/auth/*)    │  │  /api/v1/columns       │  │
│  │  email-password   │  │  /api/v1/tasks         │  │
│  │  httpOnly cookie  │  │  /api/v1/users         │  │
│  └──────────┬────────┘  └──────────┬─────────────┘  │
│             │    Prisma Client (shared singleton)     │
└─────────────┴──────────────────────┴──────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │  Supabase PostgreSQL   │
              │  (or local postgres    │
              │   via docker-compose)  │
              └───────────────────────┘
```

**Auth flow:**
1. User POSTs to `/api/auth/sign-in/email` → Better Auth sets an httpOnly `kanban.session_token` cookie (name derives from `cookiePrefix: "kanban"` in auth.ts)
2. Browser automatically sends this cookie on every subsequent request to the same origin (or cross-origin with `credentials: "include"` + CORS `credentials: true`)
3. Express `authenticate` middleware calls `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` — Better Auth reads the cookie and returns the session
4. `requireBoardAccess` middleware then checks `BoardMember` for the resolved `boardId`

---

## 4. Database Schema (Prisma)

Better Auth manages its own tables (`user`, `session`, `account`, `verification`) — generated via `npx auth generate`. Our domain tables reference `user.id`.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"   // Prisma 7's recommended generator (prisma-client-js is deprecated in v7)
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // Prisma 7: connection strings are configured in prisma.config.ts (see below),
  // not here. The CLI reads datasource.url from prisma.config.ts, so this block
  // only declares the provider.
}

// ─── Better Auth Tables (auto-generated by `npx auth generate`) ───────────────
// user, session, account, verification — managed by Better Auth CLI

// ─── Domain Models ────────────────────────────────────────────────────────────

enum BoardRole {
  OWNER
  EDITOR
  VIEWER
}

model Board {
  id          String        @id @default(uuid())
  title       String
  description String?
  ownerId     String        // references Better Auth user.id
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  columns     Column[]
  members     BoardMember[]
}

model BoardMember {
  id        String    @id @default(uuid())
  boardId   String
  userId    String    // references Better Auth user.id
  role      BoardRole @default(EDITOR)
  createdAt DateTime  @default(now())

  board     Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)

  @@unique([boardId, userId])
  @@index([userId])
}

model Column {
  id        String   @id @default(uuid())
  boardId   String
  title     String
  position  Float                        // fractional index for ordering
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks     Task[]

  @@index([boardId, position])
}

model Task {
  id          String   @id @default(uuid())
  columnId    String
  title       String
  description String?
  position    Float                        // fractional index within column
  createdById String   // references Better Auth user.id
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  column      Column   @relation(fields: [columnId], references: [id], onDelete: Cascade)

  @@index([columnId, position])
}
```

### Prisma 7 CLI Config (`prisma.config.ts`)

Prisma 7 changed how CLI commands (`migrate dev` / `migrate deploy`) get their connection string — it's read from `prisma.config.ts`, **not** `datasource.url`/`directUrl` in `schema.prisma`. `.env` is also no longer auto-loaded, so the config must import `dotenv/config` explicitly.

```typescript
// prisma.config.ts — sits at the backend root, next to package.json (NOT inside prisma/)
import "dotenv/config";                                  // required — Prisma 7 no longer auto-loads .env
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DIRECT_URL"),     // CLI/migrations use the direct (non-pooled) connection;
                                // formerly schema.prisma's directUrl field
  },
});
```

The runtime `PrismaClient` (`src/lib/prisma.ts`, via the `PrismaPg` adapter) keeps using the pooled `DATABASE_URL` — only the CLI/migration path reads from `prisma.config.ts`.

### Fractional Indexing Strategy

- **Initial position:** First item → `1000.0`; subsequent items → `prevPosition + 1000`
- **Insert between:** `newPos = (prevPos + nextPos) / 2`
- **Insert at start:** `newPos = firstPos / 2`
- **Insert at end:** `newPos = lastPos + 1000`
- **Re-balance trigger:** If gap between adjacent items < `1e-6`, re-index all items in that column/board with step `1000` (single Prisma transaction)
- This makes reordering an **O(1) single-row UPDATE** — no locking, no N+1 rewrites

---

## 5. Backend File Structure (`/backend`)

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── generated/
│   │   └── prisma/              ← Prisma client output (gitignored)
│   ├── lib/
│   │   ├── prisma.ts            ← Singleton PrismaClient with PrismaPg adapter
│   │   └── auth.ts              ← betterAuth() config
│   ├── middleware/
│   │   ├── authenticate.ts      ← Verify Better Auth cookie session → req.user
│   │   └── boardAccess.ts       ← Check BoardMember role → req.boardMember
│   ├── routes/
│   │   ├── boards.ts            ← Board CRUD + member management
│   │   ├── columns.ts           ← Column CRUD
│   │   ├── tasks.ts             ← Task CRUD + move endpoint
│   │   └── users.ts             ← User search by email
│   ├── utils/
│   │   └── fractional.ts        ← Pure fractional-index calculation (testable)
│   └── index.ts                 ← Express app entry point
├── .env
├── .env.example
├── .dockerignore
├── Dockerfile
├── package.json
├── tsconfig.json
└── prisma.config.ts
```

### §5.1 — Why httpOnly Cookie Sessions (not the JWT plugin)

Better Auth's `jwt()` plugin issues a separate short-lived JWT via `/api/auth/token` and a JWKS endpoint. This is designed for **external services** (e.g., a separate microservice that can't share the session DB) — not for a first-party Express API that already has access to the same database and can call `auth.api.getSession()` directly.

Using cookie sessions here is strictly better:

| | Cookie Session | JWT Plugin |
|---|---|---|
| **Token storage** | httpOnly cookie — not accessible to JS (XSS-safe) | Must be stored in memory or localStorage (XSS risk) |
| **Revocation** | Immediate — delete the `session` row | Not until JWT expires (15 min default) |
| **Complexity** | Zero extra code — Better Auth handles it | Extra `/api/auth/token` fetch + `Authorization: Bearer` header injection |
| **Our use case** | ✅ Backend shares same DB — `getSession()` is a single Prisma lookup | ❌ Overkill; JWT plugin is for *external* services |

**Local cross-port note (important):** Frontend runs on `:3000`, backend on `:5000`. Browsers treat different ports as different origins. Configuration required:
- Express CORS: `credentials: true`, `origin: process.env.FRONTEND_URL`
- Better Auth: `trustedOrigins: [FRONTEND_URL]`
- Cookie: `sameSite: "lax"` works locally (same hostname, different port)
- **Production** (different domains): switch to `sameSite: "none"` + `secure: true` + HTTPS

### Key Implementation Snippets

**`src/lib/prisma.ts`**
```typescript
import { PrismaPg } from "@prisma/adapter-pg";
// Prisma 7's new generator ("prisma-client") emits client under /client —
// note the trailing /client segment (unlike prisma-client-js)
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });
```

**`src/lib/auth.ts`**
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // No jwt() plugin — we use httpOnly cookie sessions (see §5.1)
  trustedOrigins: [process.env.FRONTEND_URL!],
  advanced: {
    // Local dev: same hostname (:3000 / :5000) — sameSite: "lax" works.
    // Production (different domains): NODE_ENV === "production" switches to
    // sameSite: "none" + secure: true (requires HTTPS on the backend).
    cookiePrefix: "kanban",
    cookies: {
      session_token: {
        attributes: {
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
});
```

**`src/index.ts`**
```typescript
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import boardsRouter from "./routes/boards";

const app = express();

// 1. CORS first — handles preflight OPTIONS and sets headers for every path (incl. /api/auth/*)
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// 2. Better Auth before body parsing — it reads the raw request stream itself;
//    express.json() would otherwise drain the body and break sign-up/sign-in
//    *splat (Express 5) — bare * is rejected by Express 5's route parser
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. express.json() only for your own /api/v1/* routes (they need a parsed JSON body)
app.use(express.json());

app.use("/api/v1/boards", boardsRouter);
// ... other routers

app.listen(process.env.PORT || 5000);
```

> **Express version note:** `*splat` syntax above targets **Express 5** (what `npm install express` pulls by default today). Express 5's route parser rejects a bare `*` wildcard with `TypeError: Missing parameter name` at boot. If you'd rather stay on the v4 path that Better Auth's docs mostly assume, instead pin `"express": "^4.19.0"` in `package.json` and keep `app.all("/api/auth/*", ...)`. Pick one explicitly and write it down — verify against the `better-auth/node` version you install.

**`src/middleware/authenticate.ts`**
```typescript
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

export async function authenticate(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
  req.user = session.user;
  next();
}
```

**`src/utils/fractional.ts`**
```typescript
export function computePosition(prevPos: number | null, nextPos: number | null): number {
  if (prevPos === null && nextPos === null) return 1000;
  if (prevPos === null) return nextPos! / 2;
  if (nextPos === null) return prevPos + 1000;
  return (prevPos + nextPos) / 2;
}

export function needsRebalance(positions: number[]): boolean {
  const sorted = [...positions].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] < 1e-6) return true;
  }
  return false;
}

export function rebalancePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * 1000);
}
```

---

## 6. API Endpoints

All `/api/v1/*` routes require `authenticate` middleware. Routes with role requirements also use `requireBoardAccess(minRole)`.

### Auth (Better Auth — `/api/auth/*`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Register `{name, email, password}` → sets httpOnly session cookie |
| POST | `/api/auth/sign-in/email` | Login `{email, password}` → sets httpOnly session cookie |
| POST | `/api/auth/sign-out` | Clears session cookie + deletes DB session row |
| GET | `/api/auth/get-session` | Returns current user + session (cookie required) |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | ✅ | Current user profile |
| GET | `/api/v1/users/search?email=` | ✅ | Search users by email for inviting |

### Boards

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/v1/boards` | — | Create board; creator becomes OWNER |
| GET | `/api/v1/boards` | — | List boards user owns or is member of |
| GET | `/api/v1/boards/:boardId` | VIEWER+ | Board with columns + tasks |
| PATCH | `/api/v1/boards/:boardId` | EDITOR+ | Update title/description |
| DELETE | `/api/v1/boards/:boardId` | OWNER | Delete board (cascades) |
| GET | `/api/v1/boards/:boardId/members` | VIEWER+ | List members |
| POST | `/api/v1/boards/:boardId/members` | OWNER | Invite `{email, role}` — **404** if email not registered, **409** if already a member |
| PATCH | `/api/v1/boards/:boardId/members/:userId` | OWNER | Change role `{role}` |
| DELETE | `/api/v1/boards/:boardId/members/:userId` | OWNER | Remove member — **400** if `userId === req.user.id` (no user can remove themselves, regardless of role) |

### Columns

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/v1/boards/:boardId/columns` | EDITOR+ | Create column `{title}` |
| PATCH | `/api/v1/columns/:columnId` | EDITOR+ | Update `{title?, position?}` |
| DELETE | `/api/v1/columns/:columnId` | EDITOR+ | Delete column (cascades tasks) |

### Tasks

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/v1/columns/:columnId/tasks` | EDITOR+ | Create task `{title, description?}` |
| PATCH | `/api/v1/tasks/:taskId` | EDITOR+ | Update `{title?, description?}` |
| DELETE | `/api/v1/tasks/:taskId` | EDITOR+ | Delete task |
| **POST** | **`/api/v1/tasks/:taskId/move`** | **EDITOR+** | **Move task (see below)** |

#### Task Move Endpoint

**Request body:**
```jsonc
{
  "targetColumnId": "col-uuid",    // Required: destination column (same or different)
  "afterTaskId": "task-uuid",      // Optional: task this goes AFTER (null = insert at start)
  "beforeTaskId": "task-uuid"      // Optional: task this goes BEFORE (null = insert at end)
}
```

**Server logic:**
1. Validate task belongs to a board with EDITOR+ access
2. Fetch neighbor tasks' `position` values
3. Compute new `position` via `computePosition(afterPos, beforePos)`
4. Prisma `$transaction`: update `task.columnId` + `task.position` atomically
5. If re-balance needed, re-index all tasks in column in same transaction
6. Return updated task

---

## 7. Frontend File Structure (`/frontend`)

```
frontend/
├── app/
│   ├── layout.tsx                    ← QueryClientProvider, metadata, fonts
│   ├── globals.css                   ← Tailwind v4 @theme tokens + base styles
│   ├── page.tsx                      ← Redirect to /boards or /login
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── boards/
│   │   ├── page.tsx                  ← Board list view
│   │   └── [boardId]/page.tsx        ← Kanban board view
│   └── not-found.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── boards/
│   │   ├── BoardCard.tsx
│   │   ├── BoardList.tsx
│   │   ├── CreateBoardModal.tsx
│   │   └── ShareBoardModal.tsx       ← Search user + set role + invite
│   ├── kanban/
│   │   ├── KanbanBoard.tsx           ← DndContext, DragOverlay
│   │   ├── KanbanColumn.tsx          ← SortableContext for tasks
│   │   ├── KanbanTask.tsx            ← useSortable task card
│   │   ├── AddColumnForm.tsx
│   │   └── AddTaskForm.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Spinner.tsx
│       └── Avatar.tsx
├── lib/
│   ├── auth-client.ts               ← Better Auth createAuthClient (cookie sessions, credentials: "include")
│   ├── api.ts                       ← Fetch wrapper with credentials: "include" for cross-origin cookies
│   └── fractional.ts                ← Client-side position helpers (optimistic UI)
├── hooks/
│   ├── useAuth.ts
│   ├── useBoards.ts
│   ├── useBoard.ts
│   └── useKanban.ts                 ← Move mutation + optimistic update
├── middleware.ts                    ← Route protection (redirect if no session)
├── .env.local
└── .env.example
```

### Better Auth Client (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";
// No jwtClient plugin — cookie sessions are used (see §5.1)
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,  // http://localhost:5000
  fetchOptions: {
    // Required for cross-origin cookie sending (:3000 → :5000)
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### API Fetch Wrapper (`lib/api.ts`)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL + "/api/v1";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    // Send the session cookie cross-origin (:3000 → :5000)
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Optimistic Drag-and-Drop (dnd-kit pattern)

```typescript
// In useKanban.ts
const moveMutation = useMutation({
  mutationFn: ({ taskId, targetColumnId, afterTaskId, beforeTaskId }) =>
    apiFetch(`/tasks/${taskId}/move`, {
      method: "POST",
      body: JSON.stringify({ targetColumnId, afterTaskId, beforeTaskId }),
    }),
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ["board", boardId] });
    const previous = queryClient.getQueryData(["board", boardId]);
    // Optimistically reorder local state
    queryClient.setQueryData(["board", boardId], (old) => reorderBoard(old, variables));
    return { previous };
  },
  onError: (_err, _vars, context) => {
    // Rollback on failure
    queryClient.setQueryData(["board", boardId], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["board", boardId] });
  },
});
```

---

## 8. UI Design System (Tailwind CSS v4)

All tokens in `app/globals.css` using `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0d0d0f;
  --color-surface: #16161a;
  --color-surface-2: #1e1e26;
  --color-border: #2a2a35;
  --color-primary: #6c63ff;
  --color-primary-hover: #5a52e0;
  --color-text: #e8e8f0;
  --color-muted: #8888a0;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --font-sans: "Inter", system-ui, sans-serif;
  --radius-card: 0.75rem;
}
```

**Visual design principles:**
- Dark-first, premium glass-morphism cards
- Column cards: `bg-surface border border-border rounded-card backdrop-blur`
- Task cards: drag handle icon, hover lift (`hover:-translate-y-0.5`), shadow elevation
- Smooth transitions: `transition-all duration-200 ease-out`
- Primary CTA buttons: gradient `from-primary to-primary-hover`
- Micro-animations: scale on drag, shadow on hover, pulse on loading
- Inter font via Next.js `next/font/google`

---

## 9. Environment Variables

### Backend (`.env.example`)

```env
# Database (use Supabase connection strings in production)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanban?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/kanban?schema=public"

# Better Auth
BETTER_AUTH_SECRET="replace-with-a-random-32-char-secret"
BETTER_AUTH_URL="http://localhost:5000"

# App
NODE_ENV=development   # flips auth cookie to sameSite:"none" + secure:true when set to "production"
FRONTEND_URL="http://localhost:3000"
PORT=5000
```

### Frontend (`.env.example`)

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

---

## 10. Docker Compose — Required Updates to Existing File

The existing `docker-compose.yml` is already well-structured. Key changes needed:
1. Add `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV`, `FRONTEND_URL` to backend env
2. Update backend `command` to run migrations before starting: `sh -c "npx prisma migrate deploy && npm run dev"`
3. Ensure frontend `NEXT_PUBLIC_API_URL` points to `http://localhost:5000` (external/browser access)

```yaml
# Relevant updated section:
services:
  backend:
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/kanban?schema=public
      DIRECT_URL: postgresql://postgres:postgres@postgres:5432/kanban?schema=public
      BETTER_AUTH_SECRET: local-dev-secret-minimum-32-chars-here
      BETTER_AUTH_URL: http://localhost:5000
      NODE_ENV: development
      FRONTEND_URL: http://localhost:3000
      PORT: 5000
    command: sh -c "npx prisma migrate deploy && npm run dev"
```

---

## 11. 4-Day Execution Plan

### Day 1 — Backend Foundations

- [ ] Initialize backend: `npm init -y`, install all dependencies
  - Core: `express`, `cors`, `dotenv`, `typescript`, `tsx`, `@types/express`, `@types/node`, `@types/cors`
  - Auth: `better-auth` (the Prisma adapter ships inside `better-auth` at `better-auth/adapters/prisma` — no separate package exists)
  - DB: `prisma`, `@prisma/adapter-pg`, `pg`
  - Validation: `express-validator`
- [ ] Set up `tsconfig.json` (target ES2022, module NodeNext), `package.json` scripts
- [ ] Write `prisma/schema.prisma` — domain models only (Board, BoardMember, Column, Task)
- [ ] Write `prisma.config.ts` — `import "dotenv/config"` + `datasource.url: env("DIRECT_URL")` (Prisma 7 CLI requirement; see §4)
- [ ] Run `npx auth generate` to add Better Auth tables to schema
- [ ] Set up Supabase project → get connection strings → copy to `.env`
- [ ] Run `npx prisma migrate dev --name init` (**run this locally, not in Docker** — it creates the migration files that `migrate deploy` later consumes; requires `prisma.config.ts` to be correct first)
- [ ] Commit the generated `prisma/migrations/` folder
- [ ] Implement `src/lib/prisma.ts` (import PrismaClient from `../generated/prisma/client`, PrismaPg adapter)
- [ ] Implement `src/lib/auth.ts` (betterAuth + prismaAdapter + email-password, **no jwt plugin** — cookie sessions)
- [ ] Implement `src/utils/fractional.ts`
- [ ] Implement basic `src/index.ts` (Express + Better Auth mounted, CORS with `credentials: true`)
- [ ] **Test auth flow** with curl: sign-up → sign-in (check cookie in response) → get-session (send cookie) ✓
- [ ] Update `Dockerfile` (add `npx prisma generate` + `npx prisma migrate deploy` steps)

### Day 2 — Backend CRUD + Authorization

- [ ] Implement `src/middleware/authenticate.ts`
- [ ] Implement `src/middleware/boardAccess.ts` (role rank helper: VIEWER=1, EDITOR=2, OWNER=3)
- [ ] Implement `src/routes/users.ts` (GET `/me`, GET `/search?email=`)
- [ ] Implement `src/routes/boards.ts`:
  - POST `/` → create board + create OWNER BoardMember entry
  - GET `/` → list boards where user is a member
  - GET `/:boardId` → board with all columns + tasks sorted by position
  - PATCH `/:boardId` → update (EDITOR+)
  - DELETE `/:boardId` → delete (OWNER)
  - POST `/:boardId/members` → invite by email (OWNER); look up user by email first — **404** if not found, **409** if already a member (catch Prisma unique constraint error)
  - PATCH `/:boardId/members/:userId` → change role (OWNER)
  - DELETE `/:boardId/members/:userId` → remove member (OWNER); **400** if `userId === req.user.id`
- [ ] Implement `src/routes/columns.ts` (POST/PATCH/DELETE; resolve boardId via column for access check)
- [ ] Implement `src/routes/tasks.ts` (POST/PATCH/DELETE + **POST `/:taskId/move`**)
- [ ] Add input validation on all routes
- [ ] **Manual API testing** (Postman/Thunder Client):
  - 401 for unauthenticated requests
  - 403 for non-member access
  - 403 for VIEWER attempting task create
  - Move task: same column, cross-column, to start, to end, empty column

### Day 3 — Frontend

- [ ] Install frontend deps: `better-auth`, `@tanstack/react-query`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (no extra jwt plugin needed)
- [ ] Design `app/globals.css`: full design system with `@theme` tokens
- [ ] Update `app/layout.tsx`: add Inter font, QueryClientProvider, metadata
- [ ] Implement `lib/auth-client.ts` + `lib/api.ts` + `lib/fractional.ts`
- [ ] Implement UI primitives: `Button`, `Input`, `Modal`, `Spinner`, `Avatar`
- [ ] Implement `app/(auth)/login/page.tsx` + `LoginForm.tsx` — premium dark glass form
- [ ] Implement `app/(auth)/register/page.tsx` + `RegisterForm.tsx`
- [ ] Implement `middleware.ts` (route protection)
- [ ] Implement `app/boards/page.tsx` — boards list + create board action
- [ ] Implement `app/boards/[boardId]/page.tsx` — main Kanban board
- [ ] Implement `KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanTask.tsx` with dnd-kit:
  - Drag within column (reorder)
  - Drag across columns (move)
  - `DragOverlay` for smooth preview
  - Optimistic update → rollback on API error
- [ ] Implement `ShareBoardModal.tsx` (email search + role picker + invite; visible to OWNER only)
- [ ] Implement `AddColumnForm.tsx`, `AddTaskForm.tsx`
- [ ] Wire all TanStack Query hooks: `useBoards`, `useBoard`, `useKanban`
- [ ] Loading states, error states, empty states for all views

### Day 4 — Polish, Docker, Docs, Deploy

- [ ] Finalize & test `docker-compose.yml` one-command spin-up from scratch
- [ ] Write `README.md` (clone → setup → docker or manual → open localhost:3000)
- [ ] Add seed script (`prisma/seed.ts`) with demo board + columns + tasks
- [ ] Add `prisma/seed.ts` to package.json scripts
- [ ] Error boundaries in frontend
- [ ] Responsive layout (horizontal scroll on mobile for columns)
- [ ] Final edge-case testing:
  - Move task to first/last position
  - Move to empty column
  - Revoke member → 403 on next request
  - OWNER tries to remove self → blocked
- [ ] Optional: Deploy to Vercel (frontend) + Railway (backend) + Supabase prod DB
- [ ] Final code review, cleanup, remove console.logs

---

## 12. Testing Strategy

**Unit tests** (`src/utils/fractional.test.ts`):
- `computePosition(null, null)` → `1000`
- `computePosition(null, 2000)` → `1000`
- `computePosition(1000, 2000)` → `1500`
- `computePosition(1000, null)` → `2000`
- `needsRebalance([1000, 1000 + 1e-7])` → `true`

**API integration tests** (manual curl/Postman or `supertest`):
- Auth flow: register → login → protected route 200 → logout → re-access 401
- Board auth: non-member blocked 403, VIEWER can read 200, VIEWER cannot write 403
- Task move: same column sort, cross-column, edge positions

**Frontend smoke tests:**
- Login/register → redirect to /boards
- Create board → appears in list
- Add columns + tasks → visible on board
- Drag-and-drop → order persists after page reload

---

## 13. Key Technical Decisions

| Decision | Rationale |
|---|---|
| **Better Auth in Express** (not Next.js API routes) | Single API server; frontend talks to one origin; simplifies CORS and cookie config |
| **httpOnly cookie sessions** (not JWT plugin) | XSS-safe; immediate revocation; zero extra client code — see §5.1 for full comparison |
| **`credentials: "include"`** on all fetches | Required for cross-origin (:3000→:5000) cookie sending; paired with `credentials: true` in Express CORS |
| **`DIRECT_URL` for migrations** | Supabase pgBouncer doesn't support DDL; `DIRECT_URL` bypasses pool for `prisma migrate` |
| **`migrate dev` locally, `migrate deploy` in Docker** | `migrate dev` creates migration files + applies them (dev only); `migrate deploy` only applies existing migrations — safe for Docker entrypoint |
| **Fractional indexing** | O(1) reorder vs O(n) re-numbering; avoids table-lock race conditions |
| **`@dnd-kit`** over `react-beautiful-dnd` | Actively maintained, React 19 compatible, works with Next.js App Router |
| **TanStack Query optimistic updates** | Best-in-class server state; `onMutate`/`onError`/`onSettled` for rollback |
| **Tailwind CSS v4** | Already installed; use `@theme` in CSS — no `tailwind.config.js` needed |

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Float precision drift | Re-balance trigger when gap < `1e-6`; logged in README as known limitation |
| Cookie not sent cross-port locally | `credentials: "include"` on all fetches; `credentials: true` + correct `origin` in Express CORS; `sameSite: "lax"` in cookie config |
| Cookie not sent cross-domain in prod | Switch cookie to `sameSite: "none"` + `secure: true`; deploy backend on HTTPS |
| `migrate deploy` fails in Docker (no migration files) | Must run `npx prisma migrate dev` locally first to generate migration files, commit them, then Docker's `migrate deploy` applies them |
| Supabase pool + Prisma 7 | Use `PrismaPg` adapter with pooled URL for runtime; `DIRECT_URL` for migrations |
| Docker volume + `node_modules` conflicts | Anonymous volumes for `node_modules` already in docker-compose |
| Next.js SSR + protected routes | Use `"use client"` for board pages; `middleware.ts` handles redirect server-side |

---

## 15. Out of Scope (4-Day MVP)

- Real-time sync / WebSockets (noted as "next step" in README)
- Task assignees, labels, due dates, comments, attachments
- Email verification or OAuth providers
- Automatic float position re-balancing background job
- Full-text search, rate limiting, audit logs
- **Self-removal prevention** — no user can remove themselves from a board via the remove member endpoint (returns `400` if `userId === req.user.id`); transferring ownership or leaving a board would require dedicated endpoints not in the brief

---

## 16. Complete File Creation Checklist

### Backend (`/backend`) — all new
- [ ] `package.json`, `tsconfig.json`, `prisma.config.ts`
- [ ] `prisma/schema.prisma`, `prisma/seed.ts`
- [ ] `src/lib/prisma.ts`, `src/lib/auth.ts`
- [ ] `src/middleware/authenticate.ts`, `src/middleware/boardAccess.ts`
- [ ] `src/utils/fractional.ts`
- [ ] `src/routes/users.ts`, `src/routes/boards.ts`, `src/routes/columns.ts`, `src/routes/tasks.ts`
- [ ] `src/index.ts`
- [ ] `.env`, `.env.example`

### Frontend (`/frontend`) — modify/add
- [ ] `app/globals.css` ← full redesign
- [ ] `app/layout.tsx` ← QueryClientProvider + better fonts
- [ ] `app/page.tsx` ← redirect logic
- [ ] `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
- [ ] `app/boards/page.tsx`, `app/boards/[boardId]/page.tsx`
- [ ] `middleware.ts`
- [ ] `lib/auth-client.ts`, `lib/api.ts`, `lib/fractional.ts`
- [ ] `hooks/useAuth.ts`, `hooks/useBoards.ts`, `hooks/useBoard.ts`, `hooks/useKanban.ts`
- [ ] All `components/auth/*`, `components/boards/*`, `components/kanban/*`, `components/ui/*`
- [ ] `.env.local`, `.env.example`

### Root level
- [ ] `docker-compose.yml` ← update env vars + migrate command
- [ ] `README.md`

# Execution Plan — Mini Kanban Board

**Source:** `plan.md` — full architecture, corrected for: CORS→auth→json order, Express 5 `*splat`, Prisma 7 CLI config + new generator, Better Auth cookie naming/NODE_ENV, self-removal rule.

**Baseline reviewed:**
```
d:\Test-docker\
├── docker-compose.yml     ← 3 services (postgres, backend 5000, frontend 3000) wired; needs env/config updates
├── backend\
│   ├── Dockerfile         ← Node 20-alpine, runs npm run start:dev, EXPOSE 5000
│   └── .dockerignore      ← no source code yet
└── frontend\              ← Next.js 16.3.4 + React 19 + Tailwind v4 scaffold, placeholder page
```

**Commit strategy:** Conventional Commits, one commit per **logical feature** (~22 total). Small, atomic, independently verifiable steps. Each task lists its files, steps, and an explicit commit message.

---

## §1 Ground Rules

- **Test gate before each commit:** run `tsc` / `next build` / tests where applicable; nothing is committed red.
- **Verify, don't assume:** confirm the installed `better-auth` cookie-attribute key shape (`cookies.session_token.attributes` vs the current version's config surface) *before* writing `auth.ts`. Pin down version compatibility up front, don't discover it on Day 1.
- **No secrets in git:** `.env` is gitignored; only `.env.example` is committed.
- **Migrations:** generated locally (`npx prisma migrate dev`), applied in Docker (`npx prisma migrate deploy`). Commit the generated `prisma/migrations/` folder.
- **Clean history:** stage only intended files per commit; never commit secrets or generated artifacts (`.env`, `node_modules`, `.next`, `/src/generated/prisma`).

---

## §2 Lock-ins (decided)

| Concern | Decision |
|---|---|
| **Express** | **Express 5** + `app.all("/api/auth/*splat", toNodeHandler(auth))` (bare `*` is rejected by Express 5's route parser) |
| **Prisma generator** | `provider = "prisma-client"` (new, Rust-free) — `prisma-client-js` is deprecated in v7 |
| **Prisma client import** | `import { PrismaClient } from "../generated/prisma/client"` (trailing `/client` segment) |
| **Prisma CLI config** | `prisma.config.ts` at backend root next to `package.json`; `import "dotenv/config"`; `datasource.url: env("DIRECT_URL")` |
| **Runtime DB** | `src/lib/prisma.ts` PrismaPg adapter uses pooled `DATABASE_URL` |
| **Auth** | httpOnly cookie session; `cookiePrefix: "kanban"`; `sameSite`/`secure` gated on `NODE_ENV === "production"`; no JWT plugin |
| **Docker** | backend `command: sh -c "npx prisma migrate deploy && npm run dev"` |

---

## §3 Phases & Tasks

### Phase 0 — Repo & Docker config

**T01: Scaffold monorepo config**
- Files: `docker-compose.yml`, new root `.gitignore`
- Steps:
  1. `git init` at repo root
  2. Write root `.gitignore`: `node_modules/`, `.env`, `.next/`, `dist/`, `src/generated/prisma/`, `.DS_Store`
  3. Update `docker-compose.yml` backend `environment`: add `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV` (`development`), `FRONTEND_URL` (`http://localhost:3000`); remove stale `JWT_SECRET`
  4. Change backend `command` to `sh -c "npx prisma migrate deploy && npm run dev"`
  5. Ensure frontend `NEXT_PUBLIC_API_URL` is `http://localhost:5000`
- Commit → `chore: scaffold monorepo and docker config`

---

### Phase 1 — Backend shell

**T02: Express backend shell**
- Files: `backend/package.json`, `backend/tsconfig.json`, `backend/src/index.ts`, `backend/.env`, `backend/.env.example`
- Steps:
  1. `npm init -y` in `backend/`
  2. Install deps: `express@5`, `cors`, `dotenv`, `express-validator`, `better-auth`, `prisma`, `@prisma/adapter-pg`, `pg`, and dev deps `typescript`, `tsx`, `@types/express`, `@types/node`, `@types/cors`
  3. Configure `package.json` scripts: `dev` (tsx watch), `build` (tsc), `start:dev`
  4. Write `tsconfig.json` (target ES2022, module NodeNext, strict)
  5. Write `src/index.ts` with the **3-way middleware order** (CORS → auth → json), using `*splat`
  6. Write `.env` (from plan.md §9) and `.env.example`
- Commit → `feat: express backend shell with cors/auth/body order`

---

### Phase 2 — Prisma layer

**T03: Prisma schema + client + config**
- Files: `backend/prisma/schema.prisma`, `backend/prisma.config.ts`, `backend/src/lib/prisma.ts`
- Steps:
  1. `schema.prisma`: `generator client { provider = "prisma-client" output = "../src/generated/prisma" }`; `datasource db { provider = "postgresql" }` (no in-schema URL); domain models `BoardRole`, `Board`, `BoardMember`, `Column`, `Task`
  2. `prisma.config.ts`: `import "dotenv/config"`, `defineConfig`, `schema: "prisma/schema.prisma"`, `migrations.path`, `datasource.url: env("DIRECT_URL")`
  3. `src/lib/prisma.ts`: PrismaPg adapter with pooled `DATABASE_URL`; import `PrismaClient` from `../generated/prisma/client`
- Commit → `feat: prisma client config and schema`

**T04: Better Auth tables + initial migration**
- Files: `backend/prisma/migrations/**`
- Steps:
  1. Run `npx auth generate` to add `user`, `session`, `account`, `verification` tables to schema
  2. Run `npx prisma migrate dev --name init` (**locally**, not in Docker)
  3. Commit the generated `prisma/migrations/` folder
- Commit → `chore: add better-auth tables and initial migration`

---

### Phase 3 — Better Auth

**T05: Better Auth config + auth flow verification**
- Files: `backend/src/lib/auth.ts`
- Steps:
  1. **Verify cookie-attribute key shape** against the installed `better-auth` version (`cookies.session_token.attributes`) — cross-check per plan.md §5
  2. `betterAuth({ database: prismaAdapter(prisma, ...), emailAndPassword: { enabled: true }, trustedOrigins: [FRONTEND_URL], advanced: { cookiePrefix: "kanban", cookies: { session_token: { attributes: { sameSite/secure gated on NODE_ENV, httpOnly, path } } } } })`
  3. curl test: sign-up → sign-in (check `kanban.session_token` cookie) → get-session (send cookie)
- Commit → `feat: better-auth cookie session auth`

---

### Phase 4 — Middleware & utils

**T06: Auth + board-access middleware**
- Files: `backend/src/middleware/authenticate.ts`, `backend/src/middleware/boardAccess.ts`
- Steps:
  1. `authenticate`: `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` → 401 or set `req.user`
  2. `boardAccess(minRole)`: resolve `BoardMember`, role rank VIEWER=1/EDITOR=2/OWNER=3, 403 on insufficient/non-member
- Commit → `feat: auth and board-access middleware`

**T07: Fractional indexing utils + tests**
- Files: `backend/src/utils/fractional.ts`, `backend/src/utils/fractional.test.ts`
- Steps:
  1. `computePosition`, `needsRebalance`, `rebalancePositions` per plan.md §5
  2. Unit tests for the cases in plan.md §12 (`computePosition(null,null)→1000`, insert-between, start, end, rebalance trigger)
- Commit → `feat: fractional indexing utils with tests`

---

### Phase 5 — Routes (one commit per module)

**T08: Users routes**
- Files: `backend/src/routes/users.ts`
- Steps: `GET /api/v1/users/me`, `GET /api/v1/users/search?email=`
- Commit → `feat: users routes`

**T09: Boards routes + member management**
- Files: `backend/src/routes/boards.ts`
- Steps: CRUD; GET board with columns+tasks sorted; members list/invite (404 not-found, 409 already-member), change role, remove member with `400` on self-removal (`userId === req.user.id`)
- Commit → `feat: boards routes and member management`

**T10: Columns routes**
- Files: `backend/src/routes/columns.ts`
- Steps: POST/PATCH/DELETE; resolve boardId via column for access check
- Commit → `feat: columns routes`

**T11: Tasks routes + move endpoint**
- Files: `backend/src/routes/tasks.ts`
- Steps: POST/PATCH/DELETE; `POST /:taskId/move` with fractional rebalance transaction
- Commit → `feat: tasks routes with move endpoint`

**T12: Wire routers + validation + manual API tests**
- Files: `backend/src/index.ts`, all routes
- Steps:
  1. Mount all routers under `/api/v1/*` in `index.ts` (after auth, before/after json as appropriate)
  2. Add `express-validator` input validation on all routes
  3. Manual API tests: 401 unauthenticated, 403 non-member, 403 VIEWER write, move task (same-column, cross-column, to start, to end, empty column)
- Commit → `feat: wire routers and validate inputs`

---

### Phase 6 — Frontend foundations

**T13: Frontend base + design system**
- Files: `frontend/package.json`, `frontend/app/globals.css`, `frontend/app/layout.tsx`
- Steps:
  1. Install deps: `better-auth`, `@tanstack/react-query@^5`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
  2. Design system tokens in `globals.css` via `@theme` per plan.md §8
  3. `layout.tsx`: Inter font, queryClientProvider, metadata
- Commit → `feat: frontend foundation and design system`

**T14: Auth client + API wrapper + fractional helpers**
- Files: `frontend/lib/auth-client.ts`, `frontend/lib/api.ts`, `frontend/lib/fractional.ts`
- Steps: `createAuthClient` with `credentials: "include"` (no JWT plugin); `apiFetch` wrapper sending cookie cross-origin; client-side position helpers
- Commit → `feat: frontend auth client and api wrapper`

**T15: UI primitives**
- Files: `frontend/components/ui/{Button,Input,Modal,Spinner,Avatar}.tsx`
- Steps: build reusable primitives against the design system
- Commit → `feat: ui primitives`

---

### Phase 7 — Frontend auth + board list

**T16: Auth pages + route protection**
- Files: `frontend/app/(auth)/login/page.tsx`, `register/page.tsx`, `frontend/components/auth/{LoginForm,RegisterForm}.tsx`, `frontend/middleware.ts`
- Steps: dark-glass forms; session redirect; middleware route protection
- Commit → `feat: auth pages and route protection`

**T17: Board list + create**
- Files: `frontend/app/boards/page.tsx`, `frontend/components/boards/{BoardCard,BoardList,CreateBoardModal}.tsx`, `frontend/hooks/{useAuth,useBoards}.ts`
- Steps: list boards, create board flow, query hooks
- Commit → `feat: board list and create`

---

### Phase 8 — Frontend Kanban

**T18: Kanban board with dnd-kit**
- Files: `frontend/app/boards/[boardId]/page.tsx`, `frontend/components/kanban/{KanbanBoard,KanbanColumn,KanbanTask}.tsx`, `frontend/hooks/{useBoard,useKanban}.ts`
- Steps: DndContext, SortableContext, DragOverlay; optimistic move mutation with rollback (`onMutate`/`onError`/`onSettled`)
- Commit → `feat: kanban board with dnd-kit`

**T19: Board sharing + column/task editing**
- Files: `frontend/components/boards/ShareBoardModal.tsx`, `frontend/components/kanban/{AddColumnForm,AddTaskForm}.tsx`
- Steps: email search + role picker + invite (OWNER only); add column/task forms
- Commit → `feat: board sharing and editing`

---

### Phase 9 — Polish, seed, docs

**T20: Seed script**
- Files: `backend/prisma/seed.ts`, `backend/package.json`
- Steps: demo board + columns + tasks; add `prisma/seed` script
- Commit → `chore: seed demo data`

**T21: README + final polish**
- Files: `README.md`, plus error boundaries, responsive layout, docker-compose final test
- Steps:
  1. Write `README.md` (clone → setup → docker or manual → open localhost:3000)
  2. Error boundaries; responsive horizontal-scroll columns
  3. Final edge-case QA (move to first/last/empty, revoke member → 403, self-removal blocked)
  4. Verify one-command `docker-compose up` from scratch
  5. Remove console.logs; final review
- Commit → `docs: readme` and `chore: polish and final review`

---

## §4 4-Day Mapping

| Phase | Days |
|---|---|
| Phase 0–4 (repo, shell, Prisma, auth, middleware) | Day 1 |
| Phase 5 (routes) | Day 2 |
| Phase 6–8 (frontend) | Day 3 |
| Phase 9 (polish, seed, docs, deploy) | Day 4 |

These are guidance, not a hard gate — follow task order regardless of day boundaries.

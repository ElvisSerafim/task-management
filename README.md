# Task management

pnpm monorepo: Next.js frontend (`apps/frontend`) and NestJS backend (`apps/backend`) with PostgreSQL.

Register, log in, manage **your** projects and tasks (due dates, complete locks the row). JWT on the API; the browser keeps the token in an httpOnly cookie.

## How to run

### Prerequisites

- Docker and Docker Compose
- Node 22 + pnpm (tests and host runs)

```bash
cp .env.example .env
```

Set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `JWT_SECRET`. Compose Postgres uses the `POSTGRES_*` values. The backend talks to Postgres as host `postgres` in Docker (override with `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`). Those `DB_*` names must match the Postgres user/db.

### Docker (frontend + backend + Postgres)

```bash
docker compose up --build
```

| Service    | URL / host port       | Notes                                                     |
| ---------- | --------------------- | --------------------------------------------------------- |
| Frontend   | http://localhost:3002 | Next in the container listens on 3000, mapped to **3002** |
| Backend    | http://localhost:3001 | Nest listens on 3000, mapped to **3001**                  |
| PostgreSQL | localhost:15432       | mapped from 5432                                          |

UI changes need a rebuild (`docker compose up --build`). Stop with `docker compose down`. Add `-v` only if you also want to drop the Postgres volume.

### Host (frontend + backend, Postgres still in Docker)

Use this to iterate without rebuilding images. Postgres stays in Compose.

```bash
pnpm install
docker compose up postgres
```

Backend (must be **3001** so the frontend default `API_URL` matches):

```bash
DB_HOST=localhost DB_PORT=15432 PORT=3001 JWT_SECRET=… \
  DB_USER=… DB_PASSWORD=… DB_NAME=… \
  pnpm --filter backend start:dev
```

`DB_USER` / `DB_PASSWORD` / `DB_NAME` must match `POSTGRES_*`. Nest loads env from `apps/backend` (cwd); exporting vars as above is enough.

Frontend:

```bash
API_URL=http://localhost:3001 pnpm --filter frontend dev
```

| Service  | Host URL                                           |
| -------- | -------------------------------------------------- |
| Frontend | http://localhost:3000 (Next default; **not** 3002) |
| Backend  | http://localhost:3001                              |

## Tests

From the repo root (needs `pnpm install`):

```bash
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter frontend test
```

Backend e2e covers register/login JWT and project/task CRUD (including the completed-task lock). Frontend Vitest covers Zod schemas, `api()` errors, and hook cache/toasts.

## API

Base URL: `http://localhost:3001`. Protected routes need `Authorization: Bearer <accessToken>` from login. The Next app sends that from a server action that reads the cookie.

| Method | Path                  | Auth | Notes                                                          |
| ------ | --------------------- | ---- | -------------------------------------------------------------- |
| POST   | `/auth/register`      | no   | `{ username, password }` → 201 `{ id, username }`              |
| POST   | `/auth/login`         | no   | `{ username, password }` → 200 `{ id, username, accessToken }` |
| POST   | `/projects`           | yes  | `{ title }`                                                    |
| GET    | `/projects`           | yes  | list own projects                                              |
| GET    | `/projects/:id`       | yes  | 404 if missing or not yours                                    |
| PATCH  | `/projects/:id`       | yes  | `{ title }`                                                    |
| DELETE | `/projects/:id`       | yes  | 204                                                            |
| POST   | `/projects/:id/tasks` | yes  | `{ description, dueDate? }`                                    |
| GET    | `/projects/:id/tasks` | yes  | 404 if the project is missing or not yours                     |
| PATCH  | `/tasks/:id`          | yes  | incomplete tasks only; 409 if completed                        |
| DELETE | `/tasks/:id`          | yes  | 204; 409 if completed                                          |
| POST   | `/tasks/:id/complete` | yes  | sets `finishedAt`; 409 if already completed                    |

Invalid or missing Bearer → 401. Duplicate username → 409. Unexpected errors → 500 JSON without a stack. String bodies are trimmed; whitespace-only values fail validation.

## Architectural decisions

- **JWT-only API.** Login returns `accessToken`. Project/task routes take `Authorization: Bearer`. No server session store.
- **Browser never holds the JWT in JS.** Next `loginAction` sets an httpOnly cookie (`maxAge` 24h, same as the token). Middleware only checks that the cookie **exists**. A server function (`fetchAction`) attaches the Bearer header to Nest.
- **Ownership in the service layer.** Queries are scoped by `userId` from the JWT `sub`. Missing/foreign rows are 404, not 403 (no extra leak of “it exists”).
- **Completed tasks are immutable.** Complete sets `finishedAt`; update/delete/complete again is 409. The UI hides edit/delete on done rows.
- **TanStack Query owns list state.** Create/update/delete/complete use `setQueryData` (append / replace / filter). No full-list refetch after those mutations.
- **Zod + react-hook-form** on the client; `class-validator` + `@Transform` trim on Nest DTOs. Past due dates are blocked on **create**; an existing past due date may stay on **edit**.
- **Errors.** Nest `AllExceptionsFilter` maps unknown errors to a safe 500 and logs them. Create/update/register/delete/complete failures toast for 5 seconds (sonner). Field errors stay on the form.
- **TypeORM `synchronize`** when `NODE_ENV !== 'production'`. Fine for this challenge; not a migration story.

## Trade-offs

- **Logout does not revoke the JWT.** The cookie is deleted; a stolen token still works until expiry. Revocation would need a denylist or short-lived access + refresh.
- **Middleware does not verify the JWT** (secret lives on Nest). After 24h the cookie expires so `/projects` goes to login without a 401 bounce. The cookie is persistent 24h (survives browser restart), not a session cookie.
- **CORS `origin: true`.** The browser talks to Nest through Next server actions, but the API is still wide open to any origin for direct callers.
- **Docker UI is a built image.** Local frontend edits are invisible until `--build` (or a host `pnpm dev`).

## What I would improve with more time

- Access + refresh tokens (or a logout denylist) and rate-limit login.
- Pagination and empty/loading states that do not flash an empty list.

## AI assistance

### Tools

| Tool                                          | What it was used for                                          |
| --------------------------------------------- | ------------------------------------------------------------- |
| **Cursor IDE**                                | Editing, running commands, viewing diffs                      |
| **Cursor Agent (Grok 4.6)**                   | Implementing features, tests, and this README from my prompts |
| **OpenSpec** (`/opsx-propose`, `/opsx-apply`) | Planning artifacts then implementation checklists             |
| **Ponytail** (`.cursor/rules/ponytail.mdc`)   | “Smallest diff / no extra deps” constraint on the agent       |

No Copilot, ChatGPT, Claude, or other standalone chat was used for this repo.

### What it touched

Auth (JWT, cookie, middleware), Nest project/task modules, exception filter and HTTP logs, Next pages/components/hooks, Zod schemas, Vitest, e2e, Docker-related docs, and OpenSpec files under `openspec/changes/` (gitignored planning).

### Outputs

The agent generated Nest modules/DTOs/tests, Next pages/hooks/components, Vitest files, OpenSpec proposal/design/tasks, and README text. I did not hand-write those files from scratch.

### Accepted / modified / rejected

- **Accepted as asked:** JWT login, three screens, Tailwind + components + TanStack hooks, `setQueryData`, Zod/RHF, 5s error toasts, centered modal, to-do/done, logout, labeled due date, frontend hook tests, error-handling pass, this README.
- **Steered / modified:** JWT-**only** Delete/complete toasts and overdue-edit were added in the error-handling pass, not in the first toast change. Cookie `maxAge` 24h, dropped global unique descriptions, removed public `GET /users`.
- **Not built (agent or I declined):** Passport, over-engineering on features, Playwright/MSW.

### How it was reviewed

- `pnpm --filter backend test` and `test:e2e`
- `pnpm --filter frontend test`
- `docker compose up --build` while developing (UI in the image lags the working tree until rebuild)
- I read diffs and iterated in Portuguese when the agent guessed wrong (tests, JWT vs session, toast vs inline errors)

# Task management

pnpm monorepo with a Next.js frontend (`apps/frontend`) and a NestJS backend (`apps/backend`).

## Prerequisites

- Docker and Docker Compose
- Copy environment defaults:

```bash
cp .env.example .env
```

## Production-like stack

Builds the production images and starts frontend, backend, and PostgreSQL:

```bash
docker compose up --build
```

| Service    | Host port |
|------------|-----------|
| Frontend   | 3000      |
| Backend    | 3001      |
| PostgreSQL | 5432      |

Stop with `docker compose down`. Add `-v` only if you also want to delete the Postgres data volume.

Host ports 3000, 3001, and 5432 must be free. A local PostgreSQL install often already binds 5432.

## Development stack (hot reload)

Runs `next dev` and `nest start --watch` with the repo bind-mounted. PostgreSQL is the same service as above.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Edit files on the host; the containers reload without an image rebuild. After dependency changes, rebuild (`--build`) and, if modules look stale, recreate volumes with `docker compose down -v`.

You can still run the apps on the host with pnpm instead of Docker when you prefer native file watching.

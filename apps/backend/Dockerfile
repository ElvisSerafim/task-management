FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "--filter", "backend", "start:dev"]

FROM deps AS builder
COPY . .
RUN pnpm --filter backend build \
  && pnpm --filter backend deploy --prod /deploy \
  && cp -r apps/backend/dist /deploy/dist

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /deploy ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

# /cortex-devops-setup — DevOps Infrastructure Generator
# skill: cortex-devops-setup | domain: devops | version: 1.0 | added: 2026-03-21
# Generate CI/CD pipeline, Dockerfile, docker-compose, and monitoring config from detected stack.

---

## LOAD

Before executing:
- `adapters/devops/vocabulary.md`
- `adapters/devops/rules.md`
- `adapters/devops/github-actions-nestjs.md` (if NestJS detected)
- `adapters/devops/github-actions-nextjs.md` (if Next.js detected)
- `adapters/devops/docker-patterns.md`
- `adapters/devops/monitoring.md`

---

## TRIGGER

Use when:
- Setting up CI/CD for a new project
- A project has no Dockerfile or GitHub Actions workflow
- Migrating from manual deployment to automated pipeline
- Rebuilding a broken CI/CD pipeline from scratch

---

## EXECUTION

### STEP 1 — Scratch Phase

Write to `/tmp/cortex-devops-setup-scratch.md`:
```
STACK DETECTED:       [from CLAUDE.md + package.json]
REPOS:                [API repo + Web repo paths]
RISK CATEGORY:        [A/B/C/D — determines test gate strictness]
DEPLOY TARGET:        [Railway / Coolify / AWS / GCP / manual]
ENV VARS REQUIRED:    [from CLAUDE.md critical env section]
SERVICES REQUIRED:    [postgres / redis / other external services]
CI GATES NEEDED:      [lint / typecheck / unit / integration / E2E per risk category]
MONITORING NEEDED:    [health endpoint / uptime / error tracking]
```

Review scratch before generating. If deploy target unknown → ask before proceeding.

---

### STEP 2 — Stack Detection

Read `CLAUDE.md` and `package.json`:

```
NestJS detected:   package.json has @nestjs/core → backend = NestJS
Next.js detected:  package.json has next → frontend = Next.js
Prisma detected:   package.json has prisma → needs DB migration step in CI
Redis detected:    package.json has ioredis or bullmq → needs Redis in CI
Monorepo:          single repo with both API + Web → adjusted paths
```

---

### STEP 3 — Generate Dockerfile(s)

Use patterns from `adapters/devops/docker-patterns.md`.

**NestJS API Dockerfile:**
```dockerfile
# Stage 1 — Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2 — Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3 — Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "dist/main"]
```

**Next.js Frontend Dockerfile:**
```dockerfile
# Stage 1 — Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2 — Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 — Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000 || exit 1
CMD ["node", "server.js"]
```

**Rules applied:**
- Always multi-stage (never single-stage production builds)
- Always HEALTHCHECK
- Never run as root (Next.js: dedicated nextjs user)
- Always explicit NODE_ENV=production
- node:20-alpine (not latest — pinned for reproducibility)

---

### STEP 4 — Generate docker-compose.yml (development)

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: builder
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/dbname
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dbname
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d dbname"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Adjust services based on detection step (remove Redis if not needed, etc.)

---

### STEP 5 — Generate GitHub Actions Workflow

Use patterns from `adapters/devops/github-actions-nestjs.md` or `github-actions-nextjs.md`.

Generate `.github/workflows/ci.yml` (full template in adapter files).

Gates applied by risk category:
```
Risk A (financial/auth):   lint + typecheck + unit + integration + E2E (P1 paths) + security scan
Risk B (internal tools):   lint + typecheck + unit + integration
Risk C (content/CMS):      lint + typecheck + unit
Risk D (prototype):        lint + typecheck only
```

---

### STEP 6 — Generate Health Endpoint Check

If NestJS: verify `/api/health` endpoint exists in the codebase.
If missing: flag it — "Health endpoint required for Dockerfile HEALTHCHECK and CI. Add HealthModule."

---

### STEP 7 — Generate Monitoring Config

Use patterns from `adapters/devops/monitoring.md`.

Output:
- `.env.example` additions: `SENTRY_DSN` · `UPTIME_WEBHOOK_URL` (if applicable)
- Sentry initialization snippet (if not already present)
- Recommended uptime monitoring setup (UptimeRobot or Betterstack — free tiers)

---

### STEP 8 — Deliver + Checklist

Output all generated files as code blocks ready to copy.

Then output the setup checklist:
```
DEVOPS SETUP CHECKLIST
[ ] Dockerfile committed and builds locally
[ ] docker-compose.yml tested with: docker compose up
[ ] .github/workflows/ci.yml committed and first run passes
[ ] Health endpoint reachable at /api/health
[ ] All required env vars documented in .env.example
[ ] Monitoring configured (Sentry DSN + uptime check URL)
[ ] First PR merged through CI gate (proves the gate works)
```

The last item is critical — a CI gate that has never been tested is not a CI gate.

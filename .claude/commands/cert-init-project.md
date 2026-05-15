╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-init-project  |  v1.0  |  TIER: 1  |  BUDGET: LEAN  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 (Intent) + L2 (Context) + L3 (Execution)         ║
║ AUTHORITY     ║ ORCHESTRATOR                                         ║
║ CAN           ║ - Scaffold multi-app coordinator structure           ║
║               ║ - Substitute all {placeholders} from user input      ║
║               ║ - Create ai/ governance skeleton                     ║
║               ║ - Register project in REGISTRY.json                  ║
║ CANNOT        ║ - Push to any git remote                             ║
║               ║ - Create GitHub repos                                ║
║               ║ - Scaffold sub-repos (exena-api etc) — separate task ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-init-project v1.0 — Scaffold a Cortex-governed multi-app project coordinator.

## WHAT THIS BUILDS

```
{project}/                        ← git coordinator repo (GitHub: {org}/{project})
├── CLAUDE.md                     ← Cortex master context brief
├── REGISTRY.json                 ← project registry (tracks all sub-repos)
├── .gitignore                    ← excludes sub-repos from coordinator tracking
├── .env.example                  ← shared docker env vars template
├── docker-compose.yml            ← full dev stack (api + web + admin + db + cache)
├── docker-compose.prod.yml       ← production compose (if needed)
├── Makefile                      ← unified commands: dev · test · release · db
├── ai/                           ← Cortex governance (NEVER pushed to sub-repos)
│   ├── STATUS.md                 ← current score · tests · open items
│   ├── memory/
│   │   ├── INVARIANT_MEMORY.md   ← hard rules — HALT if violated
│   │   └── watchpoints.md        ← forward-looking risk indicators
│   ├── decisions/                ← ADRs
│   ├── learning/
│   │   ├── instincts.json        ← graduated patterns
│   │   └── pending-patterns.json ← bugs awaiting /cert-learn
│   └── patterns/
│       └── dev.json              ← dev domain patterns
├── {project}-api/                ← own git repo (NOT tracked by coordinator)
├── {project}-web/                ← own git repo (NOT tracked by coordinator)
└── {project}-admin/              ← own git repo (NOT tracked by coordinator)
```

## GIT RULE (enforced via .gitignore)

```
Coordinator root      → tracks: CLAUDE.md · REGISTRY.json · docker-compose* · Makefile · ai/
Sub-repos             → ZERO Cortex files · only app code · own GitHub repos
Cortex root           → C:\luv\Cortex → always pushed separately
```

## STEP 1 — COLLECT INPUT

Ask the user for:
```
1. project name         (e.g. "ledgrpay", "slotbook")
2. domain               (e.g. "Fintech", "Marketplace", "SaaS")
3. backend stack        (default: NestJS + Prisma + PostgreSQL + Redis)
4. frontend stack       (default: Next.js 15 + React 19 + Tailwind 4)
5. GitHub org           (e.g. "latakant")
6. ports                (default: api=4000, web=3000, admin=3001, db=5432, redis=6379)
7. root path            (e.g. C:\luv\{project})
```

If user says "same as exena" → use exena defaults for stack/ports.

## STEP 2 — SUBSTITUTE PLACEHOLDERS

Replace all `{placeholder}` tokens in every template with actual values:
- Source templates: `C:\luv\Cortex\templates\multi-app\`
- Target: `{root_path}\`

Substitutions:
```
{project}           → project name (lowercase, kebab)
{PROJECT_NAME}      → display name (Title Case)
{DOMAIN}            → domain
{CORTEX_VERSION}    → current Cortex version
{DATE}              → today's date
{GITHUB_ORG}        → GitHub org
{API_PORT}          → api port
{WEB_PORT}          → web port
{ADMIN_PORT}        → admin port
{DB_PORT}           → db port
{REDIS_PORT}        → redis port
{DB_PASSWORD}       → "change_me_in_production" (placeholder)
{BACKEND_FRAMEWORK} → e.g. NestJS
{FRONTEND_FRAMEWORK}→ e.g. Next.js
{ORM}               → e.g. Prisma
{MONEY_FORMAT}      → e.g. Decimal(10,2)
{PK_STRATEGY}       → e.g. CUID
{TOKEN_STORAGE}     → e.g. httpOnly cookies / localStorage
{BACKEND_STACK}     → e.g. NestJS 10 · Prisma 6 · TS 5
{DB_STACK}          → e.g. PostgreSQL 16 + Redis 7
{FRONTEND_STACK}    → e.g. Next.js 15 · React 19 · Tailwind 4
```

## STEP 3 — CREATE FILES

Write all substituted files to target path.
Also create empty placeholder files:
```
ai/memory/watchpoints.md          (empty, populated during development)
ai/decisions/.gitkeep
ai/learning/instincts.json        ({"patterns": [], "version": "1.0"})
ai/learning/pending-patterns.json ({"patterns": []})
ai/patterns/dev.json              ({"patterns": [], "domain": "dev"})
```

## STEP 4 — INIT GIT

```bash
cd {root_path}
git init
git add CLAUDE.md REGISTRY.json .gitignore .env.example docker-compose.yml Makefile ai/
git commit -m "chore: init {project} coordinator — Cortex v{CORTEX_VERSION}"
```

Do NOT add sub-repo dirs.
Do NOT set remote — user creates GitHub repo and adds remote manually.

## STEP 5 — PRINT COMPLETION

Output:

```
✅ {PROJECT_NAME} coordinator scaffolded

Root:     {root_path}
GitHub:   create → https://github.com/{GITHUB_ORG}/{project} then:
          git remote add origin https://github.com/{GITHUB_ORG}/{project}.git
          git push -u origin master

Sub-repos (clone into root):
          git clone https://github.com/{GITHUB_ORG}/{project}-api
          git clone https://github.com/{GITHUB_ORG}/{project}-web
          git clone https://github.com/{GITHUB_ORG}/{project}-admin

Next:
  1. Add .env from .env.example
  2. Run: make dev
  3. Run: /start in {project}-api to begin Cortex session
```

## USAGE

```
/cert-init-project
```

Then answer the prompts. Everything else is automatic.

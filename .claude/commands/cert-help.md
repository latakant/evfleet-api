╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cert-help  |  v21.0  |  TIER: 15  |  BUDGET: LEAN          ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1                                                  ║
║ AUTHORITY     ║ ANALYST                                             ║
║ CAN           ║ - Display full skill catalog organized by phase     ║
║               ║ - Explain any skill or concept                      ║
║               ║ - Recommend which skill to use for a task           ║
║ CANNOT        ║ - Modify files · Execute other skills               ║
║ REQUIRES      ║ - Nothing (always available)                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Full skill catalog. Organized by when you use them, not alphabetically.
Run with no args for the full catalog, or ask about a specific skill.

$ARGUMENTS
- (no args)        → full catalog
- `<skill-name>`   → explain that specific skill
- `workflow`       → standard feature workflow
- `quick`          → just the cheat sheet (no full list)
- `onboard`        → onboarding path for new sessions

---

## FULL CATALOG

```
CORTEX v21.0 — SKILL CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use this as your map. Every skill has one job. Find the right one first.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━ 1. SESSION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /start             Full context load → score → open items → brief (replaces /cert-session)
  /cert-status       Quick score + blockers only (no full context)
  /cert-enforce      Load graduated instincts → block known mistakes before code
  /cert-switch       Controlled handoff to a different project context
  /end               Close session → log → queue next tasks
  /cert-help         This catalog. Always available.
  /cert-checkpoint   Save progress mid-session for long orchestrations

━━ 2. PLAN & DESIGN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cortex-intent     Parse any free-form request → classify → propose chain
  /cortex-validate   Stress-test an idea (5 dimensions) before building
  /cortex-blueprint  Idea → domain map → architecture → phased plan (9 phases)
  /cortex-design     Feature → UX flows → 12 screens → component tree
  /cortex-intake     Capture raw idea → chain into /cortex-validate
  /cortex-iterate    User feedback → PRD diff → architecture impact assessment
  /cortex-plan       Lightweight planner for single features (non-blueprint scope)
  /cortex-decision   Record an architectural decision with rationale
  /cert-plan         Write a PRD + get PA approval before building
  /cert-prd          Generate or refresh the project PRD
  /cert-propose      Generate a full project proposal (greenfield/existing/upgrade)

━━ 3. BUILD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cert-feature      Full feature pipeline: classify → plan → graph → build → verify
  /cert-build        Write code with TDD (red → green → refactor)
  /cert-scaffold     Scaffold a new module (files + structure, no logic)
  /cert-modify       Change existing behaviour with PRD diff + approval
  /cert-remove       Delete a feature/endpoint/module safely
  /cert-fix          Fix a known issue from TRACKER or open-issues list
  /cert-hotfix       Emergency fix for production — bypasses normal plan step
  /cert-refactor     Safe refactoring — behaviour unchanged, structure improves

  — NestJS Backend —
  /dev-backend-context    Load module context before working in it
  /dev-backend-endpoint   Add a new API endpoint to an existing module
  /dev-backend-schema     Prisma schema change (model / field / relation / index)
  /dev-backend-auth       Auth guard, role, or permission change
  /dev-backend-queue      BullMQ producer + processor
  /dev-backend-test       Write or fix unit tests for a NestJS service
  /dev-backend-debug      Debug a NestJS issue — systematic triage

  — Next.js Frontend —
  /dev-frontend-context   Load frontend context (web or admin)
  /dev-frontend-page      Add a new App Router page
  /dev-frontend-component Build a reusable UI component
  /dev-frontend-service   Add or update an API service function
  /dev-frontend-form      Form with validation (React Hook Form + Zod)
  /dev-frontend-table     Data table with pagination + sorting
  /dev-frontend-search    Search UI with debounce + results
  /dev-frontend-debug     Debug a frontend issue — systematic layer isolation
  /dev-frontend-lint      Standards audit with score

  — Fullstack + TDD —
  /dev-fullstack-feature  End-to-end feature: backend API → frontend UI
  /dev-fullstack-debug    Cross-layer debug spanning API and frontend
  /dev-tdd                TDD cycle — Red → Green → Refactor (NestJS service)
  /dev-tdd-constraint     TDD for DB constraint violations (CHECK / UNIQUE / FK)
  /dev-tester             Coverage audit → write missing tests → fix failures

━━ 4. QUALITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cert-verify       Post-build gate: tsc + tests + secrets + invariants (5 phases)
  /cert-gate         Per-task gate inside orchestration (runs after each DAG node)
  /cert-review       Code review — style, types, security, logic
  /cert-security     Security deep review — OWASP + auth + webhooks + secrets
  /cert-score --full Full governance audit → score all 7 domains (use --full flag)
  /cert-eval         Eval-driven dev for AI features (define evals first)
  /cert-spec         Spec compliance — PRD criteria mapped to tests
  /cert-secrets      Scan codebase for hardcoded secrets
  /cert-shield       Harden a module (rate-limit + auth + validation pass)
  /cert-perf         Performance review — N+1 queries, indexes, response times
  /cert-score        Run enterprise scoring → produce domain-level report
  /cert-health       Module health check → coverage + error mapping + invariants
  /dev-debugger      3-tier bug resolution: instincts → patterns → fresh debug

━━ 5. ORCHESTRATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cert-orchestrate  Multi-phase agent workflow (graph / feature / bugfix / refactor)
  /cert-parallel     Run independent tasks simultaneously via parallel agents
  /cortex-task-graph Generate + visualize + track a task dependency graph
  /cert-task         Run an isolated sub-agent for a single skill (prevents context rot)
  /cortex-observe    Monitor active orchestration — surface blocked nodes + risks
  /cortex-sync       Close orchestration → record score → queue next session tasks
  /cortex-connect    Connect to persistent orchestrator → load active features + state
  /cortex-server     Start / stop / status the persistent orchestrator (localhost:7391)

━━ 6. COMMIT & DEPLOY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cert-commit       Conventional commit + score gate + lifecycle log
  /cert-changelog    Generate changelog entry from recent commits
  /cert-docs         Update API contract + Swagger + topology diagram
  /cert-swagger      Generate or refresh Swagger/OpenAPI docs
  /cert-env          Validate environment variables against required list
  /cert-staging      Deploy to staging + smoke test checklist
  /cert-prelaunch    Pre-launch readiness gate (full checklist)
  /cert-production   Deploy to production → GO / NO-GO decision
  /cert-rollback     Safely undo a fix or deployment
  /cert-demo         Prepare a demo build (seed data + clean state)
  /cert-certify      Final certification sign-off before go-live

━━ 7. LEARN & GOVERNANCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cert-learn        Promote pending patterns → graduate instincts
  /cert-pattern      Capture a single pattern from current work
  /cortex-patterns   Browse + search the full pattern library
  /cert-diagnose     Diagnose a bug using pattern library + instincts first
  /cert-enforce      (also in Session) — enforce instincts pre-code
  /cert-report       Founder brief + developer workload + system health
  /cert-meta         Meta-analysis: skill usage stats + session patterns
  /cert-runtime      Production feedback loop → Sentry errors → instinct updates
  /cert-assign       Assign work items to roles + track ownership
  /cortex-feature-status  Track active feature progress across sessions

━━ 8. DOMAIN ADAPTERS — load BEFORE working in that domain ━━━━━━━━━━
  /ecom-orders        Order lifecycle (7-state), $transaction, stock guard
  /ecom-payments      Razorpay HMAC webhook, COD flow, ProcessedWebhookEvent
  /ecom-cart          Cart upsert, no stock reservation, validate at checkout
  /ecom-inventory     Stock Decimal(10,2), CHECK constraint, restore on cancel
  /ecom-coupons       PERCENTAGE/FLAT, @@unique guard, $tx redeem
  /ecom-delivery      Shiprocket webhook dedup + signature verify
  /ecom-reviews       Verified purchase only, PENDING state, admin moderation
  /ecom-tax           GST intra-state=CGST+SGST, inter-state=IGST, snapshot immutable
  /ecom-notifications Async BullMQ queue, 5 types, never inline in $transaction

  /nestjs-patterns    NestJS accuracy patterns (guards, DTOs, Prisma, errors)
  /nextjs-patterns    Next.js App Router patterns (RSC, useQuery, apiClient)
  /prisma-patterns    Prisma accuracy patterns (money, soft-delete, N+1, indexes)

━━ 9. UTILITIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /cert-migrate       Run DB migration (expand-contract protocol)
  /cert-index         Audit + add missing DB indexes
  /cert-upgrade       Upgrade dependencies / Prisma / NestJS versions
  /cert-discover      Universal project intelligence scan (new projects)
  /cert-extract       Extract spec from existing code
  /cert-generate      Generate code from spec
  /cert-clean         Remove stale files interactively (never auto-deletes)
  /cert-compact       Compress context when approaching token limits
  /cert-stuck         Document a blocker — never leave session unlogged
  /cert-diagram       Update the living architecture diagram after a change
  /cert-handoff       Generate a structured handoff document between agents
  /cert-init          Validate environment + project identity at startup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 125 active skills across cert· cortex· dev· ecom· adapter namespaces
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Standard Workflows

```
━━ NEW FEATURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/start → /cert-enforce → /cert-feature "[description]"
  (cert-feature auto-generates task graph + orchestrates for FEATURE path)
→ /cert-commit

━━ QUICK FIX (1-2 files) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/start → /cert-fix → /cert-verify → /cert-commit

━━ BUG WITH UNKNOWN CAUSE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/start → /cert-diagnose [requestId] → /cert-fix → /cert-verify → /cert-commit

━━ FULL FEATURE (backend + frontend) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/start → /cortex-intent "build [X]"
→ [CONFIRM] → /cert-orchestrate graph → /cert-commit

━━ SCHEMA CHANGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/start → /dev-backend-schema → /cert-migrate → /cert-verify → /cert-commit

━━ PRE-LAUNCH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/cert-prelaunch → /cert-env → /cert-security → /cert-staging → [GO] → /cert-production

━━ WEEKLY HEALTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/cert-score --full → /cert-learn → /cert-report
```

---

## Quick-Reference Cheat Sheet

```
SITUATION                         SKILL
────────────────────────────────  ────────────────────────────────────
Don't know which skill to use   → /cortex-intent "[your request]"
Starting a new session          → /start
Not sure what the bug is        → /cert-diagnose [requestId]
Fixing a known issue            → /cert-fix
Adding a feature                → /cert-feature "[description]"
Schema change needed            → /dev-backend-schema
Writing a new API endpoint      → /dev-backend-endpoint
Building a frontend page        → /dev-frontend-page
Tests are missing/failing       → /dev-tester [module]
Before committing               → /cert-verify
Ready to commit                 → /cert-commit
Blocked, don't know next step   → /cert-stuck
Context window getting heavy    → /cert-compact
Working on orders module        → /ecom-orders (load first)
Working on payments module      → /ecom-payments (load first)
Complex task, 3+ files          → /cert-orchestrate "[task]"
Long feature, resumable         → /cortex-task-graph feature "[name]"
Score dropped below 95          → /cert-score --full → fix blockers → /cert-verify
```

---

## Onboarding Path

1. **Read** `ai/core/MASTER.md` — once (the full constitution)
2. **Run** `/start` — see current project state + score
3. **Run** `/cert-enforce` — know which instincts are active this session
4. **Try** a small fix: `/cert-fix` → `/cert-verify` → `/cert-commit`
5. **Learn the flow** above — it covers 80% of daily work

If unsure which skill to use at any point: `/cortex-intent "[what you want to do]"`

---

## Completion Block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-help                      COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skills  ~114 available · organized in 9 sections
Unsure? /cortex-intent "[your task]"  ← always works
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-blueprint  |  v1.0  |  TIER: 1  |  BUDGET: LEAN  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Architecture) · L1 (Domain) · L2 (Planning)    ║
║ AUTHORITY     ║ ARCHITECT                                           ║
║ CAN           ║ - Analyze any product idea (natural language)       ║
║               ║ - Map idea → Universal Domain Model                 ║
║               ║ - Validate against 7 System Laws                   ║
║               ║ - Generate phased implementation plan               ║
║               ║ - Output machine-readable blueprint                 ║
║ CANNOT        ║ - Generate implementation code (→ coding agents)    ║
║               ║ - Modify existing codebase files                   ║
║               ║ - Skip validation (all 7 laws checked always)      ║
║ WHEN TO RUN   ║ - Before any new project or major feature starts   ║
║               ║ - When product idea is unclear or scope is large   ║
║               ║ - Before /cortex-scaffold or /cortex-build         ║
║ OUTPUTS       ║ - Domain blueprint · Risk report · Phased plan     ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Blueprint Engine — converts product ideas into architecture.

Before any code is generated, Cortex reasons first.
This skill executes the full reasoning pipeline:
  idea → actors → domains → laws check → data model → API contracts → phased plan

References:
- core/DOMAIN_MODEL.md — 15-domain Universal Domain Catalogue
- core/SYSTEM_LAWS.md  — 7 laws every architecture must satisfy

$ARGUMENTS

Parse from $ARGUMENTS:
- `idea "<description>"` — free-text product idea (quoted string)
- `file <path>` — read idea from a file
- `app-type <type>` — hint for assembly (ecommerce | saas | marketplace | ride-hailing | booking | fintech | edtech | social | healthcare | blog | cms | custom)
- `output <path>` — write blueprint to this file (default: ai/blueprint.md)
- `--validate-only` — run law validation only against an existing blueprint
- `--phased-plan-only` — skip analysis, generate phased plan from existing domain map

---

## PHASE 0 — Build Constraints Intake

Before reasoning about architecture, understand the constraints the product must be built within.
Architecture that ignores constraints produces over-engineered systems for small teams or
under-engineered systems for high-scale products.

### 0.1 Check for existing constraints

If `ai/build-constraints.md` exists → read it, skip Q&A, go to Phase 0.5.

### 0.1b — Outcome history check (item 3)

Before asking constraints, check if past iteration data exists:

```
CHECK: does ai/learning/outcome-log.json exist?
```

If YES → read it. Identify domains with the most feedback across all iterations:

```
OUTCOME HISTORY FOUND ([N] iterations)
─────────────────────────────────────────────────────
High-feedback domains (ranked by total feedback items):
  1. [domain] — [N] items across [N] iterations  ← HIGH RISK
  2. [domain] — [N] items
  3. ...
─────────────────────────────────────────────────────
These domains need extra design attention in this blueprint.
They have historically generated the most post-launch change requests.
```

Carry this HIGH RISK list into Phase 6 (Risk Analysis) — auto-add these domains to the risk register.

If outcome-log.json does NOT exist → skip silently. Note: "First project — no outcome history."

---

### 0.2 Ask 4 constraint questions (if no file exists)

Ask these one at a time (or extract from $ARGUMENTS if provided):

**Q1 — Team size**
"How many engineers will build this? (1 solo / 2–4 small team / 5–10 / 10+)"

Maps to:
```
1 solo      → monolith-first, no microservices, minimal infra complexity
2–4 small   → modular monolith ok, 1–2 external services max
5–10        → modular monolith or light services, CI/CD needed
10+         → can support service split, platform team warranted
```

**Q2 — Scale target (first 12 months)**
"How many users do you realistically expect in the first year? (<1K / 1K–50K / 50K–500K / 500K+)"

Maps to:
```
< 1K        → simple Postgres, no caching, no queue needed
1K–50K      → add Redis cache + BullMQ queue, indexing matters
50K–500K    → CDN, read replicas, rate limiting, queue workers
500K+       → horizontal scaling, sharding strategy, infra team
```

**Q3 — Budget tier**
"What infrastructure budget are you working with? (bootstrap / seed / series-a / enterprise)"

Maps to:
```
bootstrap   → Vercel + Supabase/Railway. No managed services.
seed        → Small VPS/cloud. 1–2 managed services (Redis, Email).
series-a    → Full cloud (AWS/GCP/Azure). Managed everything.
enterprise  → On-prem / dedicated. Compliance infra included.
```

**Q4 — Timeline to first launch**
"When do you need an MVP in users' hands? (4 weeks / 3 months / 6 months / 12 months)"

Maps to:
```
4 weeks     → Only core transaction. Cut everything else.
3 months    → Core + 1 supporting flow (e.g. auth + orders + basic payment).
6 months    → Full MVP with auth, core domain, payments, basic admin.
12 months   → Complete product with all domains, analytics, performance work.
```

### 0.3 Write constraints summary

```
BUILD CONSTRAINTS
─────────────────────────────────────────────────────
Team:         [1 solo | 2-4 | 5-10 | 10+]
Scale target: [<1K | 1K-50K | 50K-500K | 500K+]
Budget:       [bootstrap | seed | series-a | enterprise]
Timeline:     [4 weeks | 3 months | 6 months | 12 months]
─────────────────────────────────────────────────────
Architecture tier: [MINIMAL | STANDARD | SCALED | ENTERPRISE]
  (derived: solo+bootstrap+4weeks=MINIMAL, 5-10+seed+6months=STANDARD, etc.)
─────────────────────────────────────────────────────
```

Save to `ai/build-constraints.md`.

### 0.4 — Pipeline enforcement (item 4)

Check if idea was validated before blueprint:

```
CHECK: does ai/PRD.md exist? (produced by /cortex-brief)
```

If YES → read the PRD. Extract recommendation from header.
- `PROCEED` or `PROCEED WITH CAUTION` → continue normally
- `PIVOT` → warn: `⚠️ cortex-brief recommends PIVOT. Address weaknesses before blueprinting. Type OVERRIDE to continue anyway.` Wait for input.
- `ABANDON` → halt: `🚨 cortex-brief recommends ABANDON. Do not generate architecture for an abandoned idea. Run /cortex-brief to redefine the idea first.`

If NO → output soft warning, do not block:
```
⚠️  No ai/PRD.md found.
    Skipping /cortex-brief increases risk of building the wrong thing.
    Continue anyway? [Y] or run /cortex-brief first.
```
Wait for user confirmation before continuing.
User types Y or any text → continue. User runs /cortex-brief → respect its output.

These constraints directly influence:
- Phase 3 (service architecture complexity — monolith vs services)
- Phase 4 (law validation — stricter for SCALED/ENTERPRISE)
- Phase 7 (phased plan — MVP scope cut for MINIMAL tier)

---

## PHASE 0.5 — Decision Knowledge Check

Before reasoning begins, check if Cortex has seen this domain before.

```
CHECK: does ai/knowledge/decisions/ exist and have relevant entries?
```

Search for decision files matching:
- the `app-type` argument (ecommerce, saas, booking, etc.)
- key entities extracted from the idea (payments, auth, orders, etc.)

If matching decisions found → surface them:
```
PAST DECISIONS FOUND
─────────────────────────────────────────────────────
[id]  [title]
  Chosen:  [option]   Outcome: [SUCCESS | PENDING | FAILURE]
  Lesson:  [one-line extractable rule]
─────────────────────────────────────────────────────
These inform Phase 3 (architecture). Still verify each is valid for current context.
```

If no decisions found → note: "No prior decisions for this domain — reasoning fresh."

After blueprint is complete (Phase 7), prompt:
"Key architectural decisions were made. Log them? → /cortex-decision log"

---

## PHASE 1 — Problem Understanding

### 1.1 Read the idea
If `file` arg provided → read that file.
If `idea` arg provided → use as-is.
If neither → stop: output "Provide your product idea: `/cortex-blueprint idea \"your idea here\"`"

### 1.2 Extract structured product model

From the idea text, extract:

```
PRODUCT MODEL
─────────────────────────────────────────────────────
Name:          [inferred product name]
Type:          [SaaS | E-Commerce | Marketplace | Ride-hailing | Booking | Custom]
Description:   [1-2 sentences what this product does]

ACTORS (who uses this)
  Primary:     [list of human actors: customer, driver, admin, seller…]
  Secondary:   [list of system actors: payment gateway, courier, SMS provider…]

CORE PRODUCT LIFECYCLE
  [what happens from the moment a user opens the app to the moment value is delivered]
  Step 1: [actor] does [action]
  Step 2: [system] does [action]
  …

KEY ENTITIES (things the system tracks)
  [list: User, Order, Product, Driver, Booking, Subscription…]

MONEY (if any)
  [how money moves: who pays, who receives, what method]

EXTERNAL DEPENDENCIES
  [list services this will integrate with]
─────────────────────────────────────────────────────
```

If the idea is too vague to extract any of these → output specific questions to clarify before continuing.

---

## PHASE 2 — Domain Extraction

### 2.1 Load domain catalogue
Reference: `core/DOMAIN_MODEL.md` — the 15 base domains.

### 2.2 Map product model → domains

For each entity and lifecycle step extracted in Phase 1:
- Which base domain owns this entity?
- Which base domain owns this lifecycle step?

Build the domain map:

```
DOMAIN MAP
─────────────────────────────────────────────────────
Required domains (must build):
  ✅ [DOMAIN_NAME] — because [reason from product model]
  ✅ [DOMAIN_NAME] — because [reason from product model]
  …

Optional domains (consider if scale requires):
  ◻ [DOMAIN_NAME] — if [condition]
  …

Excluded domains (not needed):
  ✗ [DOMAIN_NAME] — reason: [why not applicable]
  …
─────────────────────────────────────────────────────
```

### 2.3 Check for custom domains

If any entity or lifecycle step doesn't fit a base domain:
```
CUSTOM DOMAINS NEEDED
  ⚡ [CUSTOM_DOMAIN_NAME]
     Responsibilities: [what it owns]
     Reason not in base catalogue: [why]
```

---

## PHASE 3 — System Blueprint

### 3.0 Architecture tier decision (from Phase 0 constraints)

Apply constraints from `ai/build-constraints.md` before designing services:

```
ARCHITECTURE TIER RULES
─────────────────────────────────────────────────────
MINIMAL (solo + bootstrap + <3 months):
  → Single monolith. All domains in one app. No queues unless payments require it.
  → Recommended stack: Next.js fullstack OR NestJS + Postgres + Railway/Supabase
  → Do NOT recommend: microservices, Kafka, K8s, Redis (unless caching critical path)

STANDARD (2-4 team + seed + 3-6 months):
  → Modular monolith. Domains are modules, not services. 1 queue (BullMQ).
  → Recommended: NestJS modules + Postgres + Redis + 1 worker process
  → Optional: split auth service if security requires isolation

SCALED (5-10 team + series-a + 6-12 months):
  → Modular monolith → extract hot domains as services when needed.
  → CI/CD required. Read replicas. CDN. Rate limiting from day 1.
  → Microservices allowed for: payments, notifications, media processing

ENTERPRISE (10+ team + enterprise budget):
  → Services from the start. Platform team owns infra.
  → Compliance, audit logging, dedicated security boundary per domain.
─────────────────────────────────────────────────────
```

Flag if the product model demands a higher tier than constraints allow:
```
⚠️  CONSTRAINT MISMATCH: Product needs SCALED tier (500K users) but team is solo + bootstrap.
    Recommend: Build MINIMAL MVP first, validate, then scale infra after traction.
```

### 3.1 Service architecture

For each required domain, define a service:

```
SERVICE BLUEPRINT
─────────────────────────────────────────────────────
Service          Owns                    External?
─────────────────────────────────────────────────────
IdentityService  credentials, JWT, OTP   MSG91 (OTP)
UsersService     profiles, addresses     —
CatalogService   products, categories    Cloudinary (images)
…
─────────────────────────────────────────────────────
```

### 3.2 Data model sketch

For each service, list primary entities and critical fields:

```
DATA MODEL SKETCH
─────────────────────────────────────────────────────
[ServiceName]
  [Entity]:
    - id (CUID)
    - [critical field]: [type] [constraint note]
    - [status field if state machine]: [enum values]
    - createdAt, updatedAt
    - [soft delete flag if applicable]
─────────────────────────────────────────────────────
```

### 3.3 Critical cross-domain flows

Identify the 2-4 most important cross-domain data flows:

```
CRITICAL FLOWS
─────────────────────────────────────────────────────
Flow 1 — [Name] (e.g. "Order Creation")
  [Domain A] → [Domain B] → [Domain C]
  Key invariant: [what must hold across all steps]
  Transaction boundary: [$transaction wraps which steps]

Flow 2 — [Name] (e.g. "Payment Confirmation")
  …
─────────────────────────────────────────────────────
```

---

## PHASE 4 — Law Validation

Reference: `core/SYSTEM_LAWS.md` — validate every domain against all 7 laws.

Output validation table:

```
SYSTEM LAW VALIDATION
─────────────────────────────────────────────────────────────────────
Law 1 — Single Source of Truth
  Check: Does any entity have more than one owning domain?
  [List conflicts found, or "✅ No violations"]

Law 2 — Domain Ownership
  Check: Does any domain modify another domain's entities directly?
  [List violations found, or "✅ No violations"]

Law 3 — Immutable Transactions
  Check: Are any financial/historical records designed as mutable?
  [List violations found, or "✅ No violations"]

Law 4 — State Machines Control Entities
  Check: Do all lifecycle entities (orders, payments, bookings) have explicit states?
  Missing state machines: [list or "✅ All covered"]

Law 5 — Side Effects Must Be Isolated
  Check: Are any notifications, emails, or analytics calls inside core transactions?
  [List violations found, or "✅ No violations"]

Law 6 — Everything Important Is an Event
  Check: Which critical state changes have no event/log?
  Missing events: [list or "✅ All covered"]

Law 7 — Systems Fail (Design for Recovery)
  Check: Are idempotency, retry, and failure recovery designed?
  Missing: [list gaps or "✅ Covered"]
─────────────────────────────────────────────────────────────────────
RESULT: [PASS | VIOLATIONS FOUND]
Violations: [count]
Blockers (must fix before code): [list critical ones]
Warnings (should fix before launch): [list non-critical ones]
```

If any Law 2, 3, or 7 violations are found for money-handling domains → **STOP and output blocker.**
Do not proceed to Phase 5 until blockers are resolved.

---

## PHASE 5 — API Contract Sketch

For each required domain, sketch the primary endpoints:

```
API CONTRACT SKETCH
─────────────────────────────────────────────────────
[DomainName]
  POST   /api/[resource]           — create [entity]       AUTH: [level]
  GET    /api/[resource]           — list [entities]        AUTH: [level]
  GET    /api/[resource]/:id       — get single [entity]    AUTH: [level]
  PATCH  /api/[resource]/:id       — update [entity]        AUTH: [level]
  DELETE /api/[resource]/:id       — remove [entity]        AUTH: [level]

  [Special endpoints]
  POST   /api/[resource]/[action]  — [what it does]         AUTH: [level]
─────────────────────────────────────────────────────
Auth levels: PUBLIC | CUSTOMER | SELLER | ADMIN | SUPER_ADMIN
```

---

## PHASE 6 — Risk & Failure Analysis

Identify top risks before implementation begins:

```
RISK REGISTER
─────────────────────────────────────────────────────────────────────
Risk         Severity   Domain          Mitigation
─────────────────────────────────────────────────────────────────────
[describe]   HIGH       [domain]        [how to handle]
[describe]   MED        [domain]        [how to handle]
[describe]   LOW        [domain]        [monitor]
─────────────────────────────────────────────────────────────────────

RACE CONDITIONS TO GUARD
  [list any concurrent-write risks: stock, coupons, bookings, seats…]
  Each needs: @@unique constraint + $transaction + P2002 catch

EXTERNAL DEPENDENCY FAILURES
  [for each external service: what happens if it goes down?]
  [is there a fallback? is it graceful or hard failure?]
```

---

### 6.1 — Write Risk Report artifact

After completing the RISK REGISTER output, write it as a standalone named file:

**File:** `ai/risk-report.md`

```markdown
# Risk Report — [Product Name]
> Generated by /cortex-blueprint Phase 6 | Date: [today]
> Blueprint: ai/blueprint.md

## Risk Register
[paste full RISK REGISTER table here]

## Race Conditions
[paste RACE CONDITIONS TO GUARD section here]

## External Dependency Failures
[paste EXTERNAL DEPENDENCY FAILURES section here]

---
## Summary
- Total risks: [N]  (HIGH: [N] · MED: [N] · LOW: [N])
- Race conditions: [N]
- External dependencies: [N]
- Action required before code: [YES — fix HIGH items | NO — all mitigated]
```

This file is the deliverable for Phase 6. Reference it in the blueprint under `## Risk Register`.

---

## PHASE 7 — Phased Implementation Plan

Sequence domains by dependency order (foundation first):

```
IMPLEMENTATION PLAN
─────────────────────────────────────────────────────────────────────
Phase 0 — Foundation (always first)
  □ Project scaffold (framework + DB + auth)
  □ JWT + role system
  □ Global error handling + request ID middleware
  □ Health check endpoint
  Unblocks: everything

Phase 1 — Core Identity + Users
  □ [IdentityService] — registration, login, OTP, JWT
  □ [UsersService] — profiles, addresses
  Unblocks: all authenticated features

Phase 2 — [Domain Group 2]
  □ [ServiceA] — [brief]
  □ [ServiceB] — [brief]
  Depends on: Phase 1
  Unblocks: [downstream phases]

Phase 3 — [Domain Group 3]
  …

Phase N — [Final Group]
  □ Admin panel features
  □ Analytics
  □ Performance tuning
  Depends on: all prior phases

─────────────────────────────────────────────────────────────────────
ESTIMATED SCOPE
  Domains:   [N required + N optional]
  Endpoints: ~[estimated count] (N per domain average)
  Models:    ~[estimated count] DB tables
  Phases:    [N]
─────────────────────────────────────────────────────────────────────
```

---

## PHASE 7.5 — Generate Task Graph

After the phased implementation plan is complete, automatically generate the dependency graph.

This makes the feature resumable across sessions and parallelizable across agents.

### 7.5A — Run graph generation

Call `/cortex-task-graph generate` internally (no user prompt needed).

The task graph skill will:
1. Read Phase 7 output (the phased implementation plan just produced above)
2. Extract every unit of work as a node (schema · migration · service · endpoint · component · page · test · e2e · deploy)
3. Assign dependency edges using the hardcoded DEPENDENCY RULES
4. Identify parallel groups
5. Write `ai/task-graph.json`
6. POST to orchestrator at localhost:7391 (if running — fail silently if offline)

### 7.5B — Output task graph summary

After graph generation, output:

```
TASK GRAPH GENERATED
─────────────────────────────────────────────────────
File:     ai/task-graph.json
Nodes:    [total count] tasks
Parallel: [N] groups can run simultaneously
Next:     /cortex-task-graph status  — see what to run first
          /cortex-task-graph next    — see ready tasks
─────────────────────────────────────────────────────
```

### 7.5C — Skip condition

If `--validate-only` or `--phased-plan-only` flags are set → skip Phase 7.5.
If `ai/task-graph.json` already exists and is for the same feature → ask: "Task graph exists. Regenerate? [y/N]"

---

## PHASE 8 — Write Blueprint File

Write the full blueprint to `ai/blueprint.md` (or `$ARGUMENTS output` path).

Structure:
```markdown
# [Product Name] — Architecture Blueprint
> Generated by /cortex-blueprint v1.0 | Date: [today]
> Status: [VALIDATED | VIOLATIONS — [N] blockers]

## Product Model
[Phase 1 output]

## Domain Map
[Phase 2 output]

## Service Blueprint
[Phase 3.1 output]

## Data Model Sketch
[Phase 3.2 output]

## Critical Flows
[Phase 3.3 output]

## System Law Validation
[Phase 4 output]

## API Contract Sketch
[Phase 5 output]

## Risk Register
[Phase 6 output]

## Implementation Plan
[Phase 7 output]

---
*Reviewed by: human architect*
*Approved:*
*Code generation unlocked: [YES | NO — resolve blockers first]*
```

---

### 8.1 — Auto-generate Mermaid diagrams

After writing the main blueprint sections, append three Mermaid diagram blocks to `ai/blueprint.md`:

**Block 1 — System Architecture**
```markdown
## System Architecture

```mermaid
graph LR
  subgraph Clients
    WEB[Web App]
    MOB[Mobile App]
    ADM[Admin Panel]
  end
  subgraph API [[API — [stack]]]
    [for each service: SVC_NAME([ServiceName])]
  end
  subgraph External
    [for each external dep: EXT_NAME[[ExternalName]]]
  end
  WEB --> API
  MOB --> API
  ADM --> API
  [for each service→external connection: SVC_NAME --> EXT_NAME]
```
```

**Block 2 — Core State Machine** (primary lifecycle entity — order, booking, subscription, etc.)
```markdown
## [Entity] State Machine

```mermaid
stateDiagram-v2
  [*] --> [INITIAL_STATE]
  [for each transition from Phase 7 plan:
    FROM_STATE --> TO_STATE : [actor/event]
  ]
  [TERMINAL_STATE_1] --> [*]
  [TERMINAL_STATE_2] --> [*]
```
```

**Block 3 — Domain Dependency Graph**
```markdown
## Domain Graph

```mermaid
graph TD
  [for each required domain from Phase 2:
    DOMAIN_NAME([Domain Name])
  ]
  [for each critical flow from Phase 3.3:
    SOURCE_DOMAIN --> TARGET_DOMAIN
  ]
```
```

Generate these from the data already produced in Phases 2, 3, and 4.
Use only domains and flows explicitly identified — do not invent connections.

---

## PHASE 9 — Human Approval Gate

After writing the blueprint file, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLUEPRINT READY — HUMAN REVIEW REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File:         ai/blueprint.md
Domains:      [N required] identified
Laws:         [PASS | N violations — list blockers]
Phases:       [N] implementation phases
Est. scope:   ~[N] endpoints · ~[N] models

Review checklist:
  □ Domain boundaries make sense for your product?
  □ Law violations (if any) understood and plan to fix?
  □ Phased plan order agrees with your priorities?
  □ All external integrations accounted for?

To unlock code generation:
  → Edit ai/blueprint.md, fill in "Approved:" line
  → Then run /cortex-scaffold to generate project structure
  → Or run /cortex-build [phase] to start implementing a specific phase

⛔ Do NOT generate code before this blueprint is approved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## LOG

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="BLUEPRINT: [product-name] · [N] domains · [N] phases · laws=[PASS|N-violations]"
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Blueprint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Product  : [name] · [type]
Domains  : [N required] · [N optional]
Laws     : ✓ PASS | ✗ [N violations — see blueprint]
Phases   : [N] implementation phases
File     : ai/blueprint.md written
Next     : Human approval → /cortex-scaffold or /cortex-build [phase]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If laws have violations:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Blueprint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE WITH VIOLATIONS
Product  : [name] · [type]
Domains  : [N required] · [N optional]
Laws     : ✗ [N] violations — resolve before code generation
Phases   : [N] implementation phases
File     : ai/blueprint.md written
Next     : Fix violations in blueprint → rerun /cortex-blueprint --validate-only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Quick Reference — What Each Phase Produces

| Phase | Input | Output |
|-------|-------|--------|
| 1 — Problem Understanding | Raw idea text | Structured product model: actors, entities, money flow |
| 2 — Domain Extraction | Product model | Domain map (required / optional / excluded) |
| 3 — System Blueprint | Domain map | Services · data model sketch · critical flows |
| 4 — Law Validation | Blueprint | 7-law check · blockers · warnings |
| 5 — API Contract | Domain map | Endpoint sketch per domain with auth levels |
| 6 — Risk Analysis | Blueprint | Race conditions · external failure modes · mitigations |
| 7 — Phased Plan | All above | Dependency-ordered implementation phases |
| 7.5 — Task Graph | Phase 7 plan | ai/task-graph.json · resumable · parallelizable |
| 8 — Write File | All above | ai/blueprint.md |
| 9 — Approval Gate | blueprint.md | Human decision to unlock code generation |

---

## Mode: `--validate-only`

Skip Phases 1-3. Read existing `ai/blueprint.md`.
Run Phase 4 (law validation) only.
Output validation report.
Use this to re-check after making changes to the blueprint.

---

## Mode: `--phased-plan-only`

Skip Phases 1-5. Read existing domain map from `ai/blueprint.md`.
Run Phase 7 (phased plan) only with new priorities or constraints.
Use when domain map is approved but plan needs re-sequencing.

---

## Domain Skill Coverage — What's Ready

After the blueprint is approved, these domain skills exist to govern implementation:

| App Type | Status | Domain Skills Available |
|----------|--------|------------------------|
| E-Commerce | ✅ FULL | ecom-orders · ecom-payments · ecom-cart · ecom-inventory · ecom-coupons · ecom-delivery · ecom-reviews · ecom-tax · ecom-notifications |
| SaaS / Subscription | ✅ FULL | saas-subscriptions · saas-organizations |
| Marketplace | ✅ FULL | All ecom-* skills + saas-organizations (for multi-vendor) |
| Booking | ✅ FULL | booking-core |
| Ride-Hailing | 📦 ARCHIVED | ride-hailing-core (archived — no active project; restore from adapters/domains/archive/ride-hailing/) |
| FinTech / Wallet | ✅ FULL | fintech-ledger (double-entry bookkeeping, transfer atomicity, reversals, idempotency, KYC) |
| Blog / CMS | ✅ FULL | cms-content (post state machine, slug immutability, revisions, scheduling, SEO, taxonomy, comments) |
| EdTech | ⚠️ PARTIAL | Generic skills only — edtech-courses skill coming |
| Social | ⚠️ PARTIAL | Generic skills only — social-feed skill coming |
| Healthcare | ⚠️ PARTIAL | Generic skills only — HIPAA/DPDP compliance skill coming |

For PARTIAL types: blueprint + law validation work fully. Domain skill enforcement deferred to `cert-build`.

---

## Adapter Load Guide (after blueprint approved)

When `cortex-build` starts a phase, load the right adapter skills:

**Domain adapters** (business rules + state machines):

| Domain in blueprint | Load this skill |
|---------------------|----------------|
| Orders / Transactions (ecom) | `adapters/domains/ecom-india/ecom-orders.md` |
| Payments (ecom) | `adapters/domains/ecom-india/ecom-payments.md` |
| Cart | `adapters/domains/ecom-india/ecom-cart.md` |
| Inventory | `adapters/domains/ecom-india/ecom-inventory.md` |
| Coupons / Promotions | `adapters/domains/ecom-india/ecom-coupons.md` |
| Fulfillment / Delivery | `adapters/domains/ecom-india/ecom-delivery.md` |
| Reviews / Feedback | `adapters/domains/ecom-india/ecom-reviews.md` |
| Tax (GST) | `adapters/domains/ecom-india/ecom-tax.md` |
| Notifications | `adapters/domains/ecom-india/ecom-notifications.md` |
| Subscriptions (SaaS) | `adapters/domains/saas/saas-subscriptions.md` |
| Organizations / Multi-tenancy | `adapters/domains/saas/saas-organizations.md` |
| Booking / Availability | `adapters/domains/booking/booking-core.md` |
| FinTech / Ledger / Wallet | `adapters/domains/fintech/fintech-ledger.md` |
| Ride-Hailing / On-demand | `adapters/domains/archive/ride-hailing/ride-hailing-core.md` *(archived)* |
| Blog / CMS / Content | `adapters/domains/cms/cms-content.md` |
| Ops / Workflow | `adapters/domains/ops-workflow/ops-workflow-core.md` |

**Stack adapters** (language + framework patterns):

| Stack | Load this skill |
|-------|----------------|
| NestJS backend | `adapters/typescript/backend/nestjs/nestjs-patterns.md` |
| Prisma ORM | `adapters/typescript/backend/nestjs/prisma-patterns.md` |
| Next.js frontend | `adapters/typescript/frontend/nextjs/nextjs-patterns.md` |
| React Native | `adapters/typescript/frontend/react-native/react-native-patterns.md` |
| Express | `adapters/typescript/backend/express/express-patterns.md` |
| Go / Gin | `adapters/go/gin/go-patterns.md` |
| Java / Spring Boot | `adapters/java/spring-boot/springboot-patterns.md` |
| Flutter / Dart | `adapters/dart/flutter/flutter-patterns.md` |

**Shared dev skills** (load when needed regardless of stack):

| Need | Load this skill |
|------|----------------|
| Debugging | `adapters/domains/shared/dev-debugger.md` |
| TDD workflow | `adapters/domains/shared/dev-tdd.md` |
| E2E testing | `adapters/domains/shared/dev-e2e.md` |
| Full-stack feature | `adapters/domains/shared/dev-fullstack-feature.md` |
| Full-stack debug | `adapters/domains/shared/dev-fullstack-debug.md` |

---

## Integration with Other Skills

| After blueprint | Run this |
|----------------|----------|
| Blueprint approved, starting fresh project | `/cortex-scaffold` |
| Blueprint approved, building phase by phase | `/cortex-build [phase-name]` |
| Check task graph progress (auto-generated in Phase 7.5) | `/cortex-task-graph status` |
| See which tasks are ready to run right now | `/cortex-task-graph next` |
| Run all ready tasks in parallel | `/cert-parallel` |
| Run full graph in dependency order | `/cert-orchestrate graph` |
| Want full PRD from blueprint | `/cortex-prd generate` |
| Want to validate existing project against a blueprint | `/cortex-audit` |
| Blueprint has violations, need fix plan | `/cortex-propose` |

╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-plan  |  v1.0  |  TIER: 1  |  BUDGET: LEAN        ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Blueprint) + L1 (Intent) + L5 (Design)          ║
║ AUTHORITY     ║ ORCHESTRATOR                                         ║
║ CAN           ║ - Plan new projects with 3 explicit modes            ║
║               ║ - Run UI/UX impact check on any incoming task        ║
║               ║ - Gate frontend work behind human approval           ║
║               ║ - Produce and show full execution chain              ║
║ CANNOT        ║ - Write code (routes to coding skills)               ║
║               ║ - Skip the approval gate on Mode B                  ║
║               ║ - Skip the UI/UX check on task mode                 ║
║ WHEN TO RUN   ║ - Starting any new project                          ║
║               ║ - Before planning any new task/feature              ║
║               ║ - When you want Cortex to decide the right chain    ║
║ OUTPUTS       ║ - Execution plan → human confirmation → chain runs  ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-plan — the project-level planner.

Two modes:
  /cortex-plan new "idea"     → New project setup (3 explicit build modes)
  /cortex-plan task "desc"    → New task with automatic UI/UX impact check

The difference from /cortex-intent:
  cortex-intent routes any request to a skill.
  cortex-plan thinks at project and task level with explicit UI/UX awareness built in.
  Use cortex-plan when starting something new. Use cortex-intent for ad-hoc routing.

$ARGUMENTS

Parse from $ARGUMENTS:
- `new "<idea>"` — new project planning wizard
- `task "<description>"` — new task on existing project
- `--mode <A|B|C>` — skip mode prompt for new project (A=Full, B=Design-first, C=Backend-first)
- `--dry-run` — show plan only, do not run any step
- `--auto` — skip confirmations (use only for Mode C / backend-only tasks)

---

## ══ PATH 1: NEW PROJECT ══

Triggered by: `/cortex-plan new "idea"`

---

### STEP N1 — Parse the Idea

Read the idea. Extract:
- What kind of product is this? (marketplace, SaaS, booking, tool, etc.)
- Who are the primary actors? (customer, admin, vendor, driver, etc.)
- Is there a frontend? (yes / no / unknown)
- Is there a backend? (yes / no / API only)
- Is there money involved? (payments, subscriptions, billing)

Output one-line summary:
```
Idea: "[idea]"
Type: [marketplace | saas | booking | ecommerce | tool | other]
Actors: [list]
Has frontend: [yes / no / unknown]
Has backend: [yes]
Money: [yes / no]
```

---

### STEP N2 — Choose Build Mode

Present the 3 modes clearly. Ask the user to choose.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX PLAN — NEW PROJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Idea:   [idea]
Type:   [type]

Choose how you want to build this:

  A  FULL STACK
     Design + backend + frontend planned and built together.
     Best for: you know the full product, want everything in one run.
     Flow: blueprint → design all screens → backend + frontend in sync

  B  DESIGN-FIRST
     See the full UX design before any code is written.
     You approve the design. Then frontend development begins.
     Best for: you want to validate how the product feels before committing.
     Flow: blueprint → design all screens → [YOUR APPROVAL] → frontend → backend

  C  BACKEND-FIRST
     Start building the backend immediately. Skip design for now.
     Best for: API-only projects, or you'll handle frontend separately.
     Flow: blueprint → backend modules → tests → done (design skipped)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type A, B, or C:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If `--mode` flag provided: skip this prompt, proceed with given mode.
If idea clearly has no frontend (e.g. "REST API", "CLI tool", "webhook service"): suggest C and note why.

---

### STEP N3 — Build the Execution Chain

Based on chosen mode, assemble the chain:

#### MODE A — FULL STACK
```
EXECUTION CHAIN — MODE A (Full Stack)
─────────────────────────────────────────────────────────────
Step 1:  /cortex-blueprint idea "[idea]"          [DEPENDS ON PREV]
         → domain map · law validation · phased plan · ai/blueprint.md

Step 2:  /cortex-design feature "[product name]" --all-screens  [DEPENDS ON PREV]
         → all 12 screen types mapped · component tree · token requirements
         → UX flow for every actor

Step 3:  [backend chain — one step per domain phase from blueprint]  [PARALLEL OK with Step 4]
         /dev-backend-schema + /dev-backend-endpoint per module
         Independent modules can run in parallel terminals.

Step 4:  [frontend chain — one step per screen from design output]   [PARALLEL OK with Step 3]
         /dev-frontend-component (leaf components first)
         /dev-frontend-page (pages after components)
         /dev-frontend-service (API service layer)

Step 5:  /dev-tdd OR /dev-backend-test per domain  [PARALLEL OK across modules]
         → tests written after implementation per module

Step 6:  /cert-verify                              [DEPENDS ON PREV — all steps must complete]
         → tsc + tests + secrets + invariants

Step 7:  /cert-commit                              [DEPENDS ON PREV]
         → conventional commit + lifecycle log
─────────────────────────────────────────────────────────────
PARALLEL KEY:
  [PARALLEL OK]      — can run alongside other steps marked [PARALLEL OK]
  [DEPENDS ON PREV]  — must wait for all preceding steps to complete
─────────────────────────────────────────────────────────────
```

#### MODE B — DESIGN-FIRST (with approval gate)
```
EXECUTION CHAIN — MODE B (Design-First)
─────────────────────────────────────────────────────────────
PHASE 1 — Architecture + Design (runs first, gate before code)

Step 1:  /cortex-blueprint idea "[idea]"
         → domain map · law validation · phased plan · ai/blueprint.md

Step 2:  /cortex-design feature "[product name]" --all-screens
         → all screens · component tree · state inventory · token requirements
         → backend endpoints each screen will consume

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⏸  DESIGN APPROVAL GATE
  Blueprint and design are done. Review before any code is written.
  The design output shows all screens, states, components, and API needs.
  Type APPROVE to proceed to development. Or say what to change.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 2 — Development (only runs after APPROVE)

Step 3:  [backend chain from blueprint phases]
         /dev-backend-schema + /dev-backend-endpoint per module

Step 4:  [frontend chain from design output]
         /dev-frontend-component (leaf first)
         /dev-frontend-page (pages after components)
         /dev-frontend-service (API layer)

Step 5:  /dev-tdd per domain

Step 6:  /cert-verify

Step 7:  /cert-commit
─────────────────────────────────────────────────────────────
```

#### MODE C — BACKEND-FIRST
```
EXECUTION CHAIN — MODE C (Backend-First)
─────────────────────────────────────────────────────────────
Step 1:  /cortex-blueprint idea "[idea]"
         → domain map · law validation · phased plan · ai/blueprint.md

Step 2:  [backend chain from blueprint phases]
         /dev-backend-schema    → Prisma schema + migration
         /dev-backend-endpoint  → service + controller + DTO per module
         /dev-backend-auth      → if auth needed
         /dev-backend-queue     → if async jobs needed

Step 3:  /dev-tdd per domain

Step 4:  /cert-verify

Step 5:  /cert-commit

  [Frontend deferred — run /cortex-plan task "add frontend" when ready]
─────────────────────────────────────────────────────────────
```

---

### STEP N4 — Show Plan + Confirm

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX PLAN — READY TO START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project:  [idea]
Mode:     [A — Full Stack | B — Design-First | C — Backend-First]

[full step-by-step chain from N3]

Approval gates:    [Mode B: 1 gate after design | Mode A/C: none]
Sessions needed:   [~1 | ~2 | ~3+]

Type CONFIRM to begin.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On CONFIRM: execute chain. On Mode B: pause at gate, wait for APPROVE.

---

## ══ PATH 2: NEW TASK ══

Triggered by: `/cortex-plan task "description"`

---

### STEP T0 — Research & Reuse (mandatory before planning)

Before planning implementation, check what already exists:

1. **Search codebase first** — Does this feature/pattern already exist partially?
   ```bash
   grep -rn "<key-term>" src/ --include="*.ts" | head -20
   ```
2. **Check npm registry** — Is there a battle-tested library that solves 80%+ of this?
   Common sources: npm, GitHub search. Prefer proven libs over hand-rolled solutions.
3. **Check existing project patterns** — Is there a similar module already in this codebase?
   If yes → extend the existing pattern rather than starting fresh.

Output one line before proceeding:
```
Research: [reusing existing X | extending pattern from Y | new implementation needed]
```

If existing implementation found → skip to STEP T3-B immediately (route directly to coding skill, no design needed unless UI-facing).

---

### STEP T1 — Parse the Task

Read the task. Extract:
- What is being changed or added?
- Which module(s) does this touch?
- Is this purely data/logic (backend only) or does a user interact with it?

---

### STEP T2 — UI/UX Impact Check

Run this check. Answer each question YES or NO based on what the task requires.
Do NOT ask the user — answer from the task description and codebase context.

```
UI/UX IMPACT CHECK
─────────────────────────────────────────────────────────────
Q1  Screen change?      Does this add, remove, or structurally change a page?
Q2  Data displayed?     Does this change what data is visible to the user?
Q3  User action?        Does this add, remove, or change a button/form/link?
Q4  Navigation?         Does this change routing or how the user moves between pages?
Q5  State affected?     Does this change loading / empty / error / success behavior?
Q6  New API for UI?     Does this add a backend endpoint that a frontend screen consumes?
─────────────────────────────────────────────────────────────
```

**Result:**
- ANY YES → UI/UX affected → go to STEP T3-A
- ALL NO  → UI/UX not affected → go to STEP T3-B

Output the check result:
```
UI/UX IMPACT CHECK
─────────────────────────────────────────────────────────────
Q1 Screen change?    [YES / NO]
Q2 Data displayed?   [YES / NO]
Q3 User action?      [YES / NO]
Q4 Navigation?       [YES / NO]
Q5 State affected?   [YES / NO]
Q6 New API for UI?   [YES / NO]
─────────────────────────────────────────────────────────────
Result: [DESIGN NEEDED | BACKEND ONLY]
─────────────────────────────────────────────────────────────
```

---

### STEP T3-A — UI/UX Affected → Design Plan + Ask

Generate a mini design plan. This is NOT a full /cortex-design run.
It is a focused impact summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI/UX DESIGN NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task:            [task description]
Screens affected: [list the screens this touches]
Impact summary:
  · [Q1 YES] New screen: [screen name + primary action]
  · [Q2 YES] Data change on: [screen] — adds/removes [what]
  · [Q3 YES] New action: [what button/form — where]
  · [Q4 YES] Route change: [from → to]
  · [Q5 YES] State change: [which states affected]
  · [Q6 YES] New endpoint [METHOD /path] → consumed by [screen]

Components needed:
  New:    [list]
  Modify: [list]
  Reuse:  [list]

Proposed chain if approved:
  Step 1: /cortex-design feature "[task]" --delta
          (focused design — affected screens only, not all screens)
  Step 2: [backend steps — endpoints, schema]
  Step 3: [frontend steps — components, pages]
  Step 4: /cert-verify
  Step 5: /cert-commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This task affects the UI. Include frontend work?
  Type YES  → full chain (design + backend + frontend)
  Type NO   → backend only (UI stays as-is for now)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On YES: run the full chain (design delta → backend → frontend → verify → commit).
On NO: run STEP T3-B chain (backend only).

---

### STEP T3-B — Backend Only → Direct Execution

No design work needed (or user declined). Route directly to the right backend skill.

Classify the task type and build the chain:

```
TASK TYPE ROUTING
─────────────────────────────────────────────────────────────
New endpoint     → /dev-backend-endpoint → /dev-backend-test → /cert-verify → /cert-commit
Schema change    → /dev-backend-schema (Expand-Contract) → /cert-verify → /cert-commit
Auth/permissions → /dev-backend-auth → /dev-backend-test → /cert-verify → /cert-commit
Queue/async job  → /dev-backend-queue → /dev-backend-test → /cert-verify → /cert-commit
Bug fix          → /dev-backend-debug → /cert-verify → /cert-commit
Data migration   → /cert-migrate → /cert-verify → /cert-commit
Tests only       → /dev-tdd → /cert-verify
Refactor         → /cert-refactor → code-reviewer → /cert-verify → /cert-commit
─────────────────────────────────────────────────────────────
```

Show the chain. Confirm. Execute.

---

### STEP T4 — Show Execution Plan + Confirm

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX PLAN — TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task:    [description]
UI/UX:   [AFFECTED — design included | NOT AFFECTED — backend only]

[step-by-step chain]

Type CONFIRM to execute.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Decision Tree (quick reference)

```
/cortex-plan
│
├── new "idea"
│   │
│   ├── Mode A: FULL STACK
│   │   blueprint → design (all screens) → backend + frontend → verify → commit
│   │
│   ├── Mode B: DESIGN-FIRST ← approval gate in the middle
│   │   blueprint → design (all screens)
│   │   ━━━━ DESIGN APPROVAL GATE ━━━━
│   │   → backend → frontend → verify → commit
│   │
│   └── Mode C: BACKEND-FIRST
│       blueprint → backend modules → tests → verify → commit
│       [frontend deferred]
│
└── task "description"
    │
    ├── UI/UX Impact Check
    │   Q1–Q6 (any YES?)
    │   │
    │   ├── YES (UI affected)
    │   │   Show affected screens + mini design plan
    │   │   ━━━━ INCLUDE FRONTEND? ━━━━
    │   │   YES → design delta → backend → frontend → verify → commit
    │   │   NO  → backend only → verify → commit
    │   │
    │   └── NO (all clear)
    │       Backend only → verify → commit
    │       (no design step, no approval needed)
```

---

## Examples

### "New project: a tailoring management system"
```
/cortex-plan new "tailoring management system"

→ Type parsed: ops/workflow tool · Actors: customer, tailor, ops
→ Mode prompt shown → user picks B (design-first)
→ Phase 1: blueprint + design all screens
→ APPROVAL GATE shown after design
→ User approves → Phase 2: backend + frontend + tests
```

### "Add coupon code input to checkout"
```
/cortex-plan task "add coupon code input to checkout"

UI/UX Impact Check:
  Q3 User action? YES — new input field + apply button
  Q2 Data displayed? YES — discount amount shown after apply
  Q6 New API? YES — POST /coupons/validate endpoint needed

Result: DESIGN NEEDED
→ Affected screens: Checkout (Screen 7)
→ Ask: "Include frontend work? YES/NO"
→ User says YES
→ Chain: cortex-design delta → dev-backend-endpoint → dev-frontend-component → cert-verify → cert-commit
```

### "Add database index to orders.userId"
```
/cortex-plan task "add database index to orders.userId"

UI/UX Impact Check:
  Q1–Q6: all NO

Result: BACKEND ONLY
→ Chain: /cert-index → /cert-verify → /cert-commit
→ No design. No approval needed. Straight to execution.
```

### "Add order status tracking screen"
```
/cortex-plan task "add order status tracking screen"

UI/UX Impact Check:
  Q1 Screen change? YES — new screen
  Q5 State affected? YES — loading/empty/tracking states needed

Result: DESIGN NEEDED
→ Affected: new Order Status screen (Screen 8 from 12 Universal Screens)
→ Ask: "Include frontend work? YES/NO"
→ User says YES
→ Chain: cortex-design → dev-backend-endpoint (if missing) → dev-frontend-page → cert-verify → cert-commit
```

---

## Learning log

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="PLAN: [new/task] · mode=[A/B/C or impact result] · frontend=[yes/no] · steps=[N]"
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : CONFIRMED — chain executing
Mode   : [A — Full Stack | B — Design-First | C — Backend-First | Task]
Steps  : [N] skills in chain
Gates  : [N approval gates | none]
Next   : [first skill in chain]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-assign  |  v8.0  |  TIER: 2  |  BUDGET: LEAN       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L9                                             ║
║ AUTHORITY     ║ ANALYST                                             ║
║ CAN           ║ - Read task description from $ARGUMENTS            ║
║               ║ - Read core/resource-registry.md                   ║
║               ║ - Read ai/state/session-state.json                 ║
║               ║ - Write active_role to session-state.json          ║
║               ║ - Append assignment to ai/ROLE_LOG.md              ║
║               ║ - Load resource's pattern files                    ║
║ CANNOT        ║ - Modify any source code                           ║
║               ║ - Override PA escalation requirements              ║
║               ║ - Assign a resource outside their certified tiers  ║
║ REQUIRES      ║ - MASTER.md loaded                           ║
║               ║ - core/resource-registry.md accessible            ║
║ OUTPUTS       ║ - Assigned resource + fitness score                ║
║               ║ - Context to load + first skill to run            ║
║               ║ - Completion block (ASSIGNED or ESCALATE TO PA)   ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Auto-assign the best-qualified CORTEX resource to an incoming task.
Replaces manual role selection. Run before any task starts — especially
when the right resource isn't obvious.

$ARGUMENTS

Parse from $ARGUMENTS:
- `<task description>` — free text description of the work to do
- `--force <resource-id>` — skip scoring, assign specific resource (logged)
- `--explain` — show full scoring breakdown for all resources

---

## WHY THIS EXISTS

Without cortex-assign, you manually pick a skill and CORTEX infers the role.
That's backwards — you know the task, not which role fits best.

cortex-assign inverts it:
```
BEFORE: you pick /dev-backend-endpoint → CORTEX assigns Backend Dev
AFTER:  you describe task → CORTEX scores all resources → assigns highest fit
```

The difference matters most for:
- Cross-domain tasks (payments + notifications — who leads?)
- Ambiguous bugs (is this a backend bug or a frontend service layer bug?)
- Phase transitions (HOTFIX vs MAINTENANCE — different resource strengths)
- New developers — they don't know which skill to run first

---

## STEP 1 — CLASSIFY THE TASK

From $ARGUMENTS task description, extract:

**1a. Primary domain** (use Domain Map from resource-registry.md):
```
Map keywords to qualification domains:
  controller, service, DTO, NestJS → nestjs
  schema, model, migration, Prisma → prisma
  type, interface, generic          → typescript
  queue, worker, BullMQ             → bullmq
  page, component, hook, Next.js    → nextjs
  auth, JWT, OTP, RBAC, webhook     → auth_security
  order, payment, cart, coupon      → ecommerce
  test, spec, coverage, E2E         → testing
  deploy, env, docker, CI           → devops
  module, layer, architecture       → architecture
```

**1b. Work type** (4-question protocol):
```
Q1: Production emergency (live system broken)?          → HOTFIX
Q2: System structure change (new module/schema/service)? → MIGRATION
Q3: Nothing exists for this yet?                        → GREENFIELD
Q4: Existing behaviour changes?   NO → REFACTOR   YES → MAINTENANCE
```

**1c. Target project**:
```
Keywords → Project
  exena-api / backend / service / controller → exena-api
  exena-web / storefront / customer          → exena-web
  exena-admin / admin / management           → exena-admin
  cross-layer / frontend + backend           → all
```

---

## STEP 2 — SCORE EACH RESOURCE

For each resource in the registry, compute:

```
fitness_score =
  (qualification_match × 0.30)
  + (skill_coverage    × 0.30)
  + (cert_level        × 0.20)
  + (phase_affinity    × 0.20)
```

### Factor 1: qualification_match (0–100)
Average the resource's qualification scores for the task's detected domains.

Example — task: "fix race condition in payment webhook handler"
Domains detected: nestjs, prisma, auth_security, ecommerce

```
Backend Dev qualification_match:
  nestjs: 98 + prisma: 95 + auth_security: 85 + ecommerce: 85 = 363 / 4 = 90.8
```

### Factor 2: skill_coverage (0–100)
What percentage of the skills this task needs can this resource invoke?

```
Task needs: cortex-bug, dev-backend-debug, cortex-fix, cortex-verify
Backend Dev certified tiers: [1, 2, 5, 6, 7, 10, 13, 14, 15]
  cortex-bug (Tier 2) ✔ · dev-backend-debug (Tier 10) ✔
  cortex-fix (Tier 2) ✔ · cortex-verify (Tier 6) ✔
skill_coverage = 4/4 = 100
```

### Factor 3: cert_level (0–100)
Authority level score:
```
OBSERVER   → 20
ANALYST    → 40
EXECUTOR   → 60
BUILDER    → 80   ← most implementation resources
GOVERNOR   → 90   ← PA
ORCH       → 100  ← orchestrators (cortex-task, cortex-parallel)
```

### Factor 4: phase_affinity (0–100)
Look up the resource's affinity score for the detected work type.

```
Phase Affinity Table:
Work Type   | PA  | SFS | BE  | FE_WEB | FE_ADMIN
────────────|─────|─────|─────|────────|─────────
GREENFIELD  | 90  | 90  | 85  | 85     | 75
MAINTENANCE | 60  | 80  | 92  | 88     | 85
REFACTOR    | 85  | 85  | 88  | 82     | 80
HOTFIX      | 50  | 70  | 95  | 85     | 80
MIGRATION   | 100 | 85  | 80  | 60     | 55
```

### Compute final scores:

```
Resource          | qual  | skill | cert  | phase | FINAL
──────────────────|───────|───────|───────|───────|──────
PRINCIPAL_ARCHITECT  ...    ...     90     ...     X
SENIOR_FULLSTACK     ...    ...     80     ...     X
BACKEND_DEV          ...    ...     80     ...     X  ← highest?
FRONTEND_DEV_WEB     ...    ...     80     ...     X
FRONTEND_DEV_ADMIN   ...    ...     80     ...     X
```

---

## STEP 3 — ASSIGNMENT RULES

**Rule 1 — Highest score wins.**
Assign the resource with the highest fitness_score.

**Rule 2 — PA override.**
If work type is MIGRATION, or any Phase 1/2/3 trigger is detected, or admin risk is CRITICAL:
→ Set PA_REQUIRED = YES
→ Assign PA as co-resource (not instead of specialist — both are activated)

**Rule 3 — Minimum confidence.**
If highest score < 60 → escalate to SENIOR_FULLSTACK as coordinator.
If SFS score < 60 too → escalate to PA.

**Rule 4 — Tie-breaking.**
If two resources within 5 points: prefer the specialist over the generalist.
```
BE vs SFS within 5 points + task is backend → assign BE
FE_WEB vs SFS within 5 points + task is frontend → assign FE_WEB
```

**Rule 5 — Project targeting.**
Task in exena-admin → FE_ADMIN preferred over FE_WEB, even with slightly lower score.
Task in exena-api → BE preferred over SFS, even with slightly lower score.

**Rule 6 — Cross-project tasks.**
If task touches 2+ projects → assign SFS as primary, specialists as secondary.

---

## STEP 4 — ACTIVATE RESOURCE

Once assigned:

**Load this resource's pattern files:**
```
BACKEND_DEV      → nestjs-patterns.md + prisma-patterns.md + matching ecom skill
FRONTEND_DEV_WEB → nextjs-patterns.md + matching ecom skill
FRONTEND_DEV_ADMIN → nextjs-patterns.md
SENIOR_FULLSTACK → nestjs-patterns.md + nextjs-patterns.md
PA               → INVARIANT_MEMORY.md + ARCHITECTURE_MEMORY.md
```

**Suggest first skill based on work type + resource:**
```
GREENFIELD + BE   → /cortex-prd → /dev-backend-schema → /cortex-build
GREENFIELD + FE   → /cortex-prd → /dev-frontend-page → /cortex-build
MAINTENANCE + BE  → /cortex-bug → /dev-backend-debug → /cortex-fix
MAINTENANCE + FE  → /cortex-bug → /dev-frontend-debug → /cortex-fix
REFACTOR + any    → /cortex-prd → /cortex-refactor → /cortex-verify
HOTFIX + BE       → /dev-backend-debug → /cortex-fix → /cortex-verify
HOTFIX + FE       → /dev-frontend-debug → /cortex-fix → /cortex-verify
MIGRATION + PA    → /cortex-prd (PA designs) → /dev-backend-schema → /cortex-migrate
```

---

## STEP 5 — LOG ASSIGNMENT

Write to `ai/state/session-state.json`:
```json
{
  "active_role": "<resource_id>",
  "active_work_type": "<GREENFIELD|MAINTENANCE|REFACTOR|HOTFIX|MIGRATION>",
  "role_activations_this_session": ["...", "<resource_id>"]
}
```

Append to `ai/ROLE_LOG.md`:
```
[<ISO timestamp>] ASSIGNMENT
TASK=<one-line task description>
DOMAIN=<primary domain>
WORK_TYPE=<type>
ASSIGNED=<resource_id>
FITNESS=<score>/100
PA_REQUIRED=<YES Phase n | NO>
CONTEXT_LOADED=<pattern files>
FIRST_SKILL=<suggested skill>
```

---

## COMPLETION OUTPUT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-assign                          ASSIGNED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task       {one-line task description}
Domain     {primary domain(s)}
Work type  {GREENFIELD | MAINTENANCE | REFACTOR | HOTFIX | MIGRATION}
Project    {exena-api | exena-web | exena-admin | cross}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSIGNED   {Resource Name}
Fitness    {score}/100
Scores     qual={n} skill={n} cert={n} phase={n}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PA         {YES — Phase n reason | NO}
Loaded     {pattern files}
Next       {first skill → second skill → third skill}
Logged     ROLE_LOG · session-state.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If PA escalation required:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-assign                     ESCALATE TO PA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task       {description}
Trigger    {Phase 1/2/3 | MIGRATION | CRITICAL risk | admin elevated}
Primary    {specialist resource} — ready to implement after PA approval
PA role    Design + approve approach first
Next       PA reviews → approves plan → {specialist} implements
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## WORKED EXAMPLES

### Example 1 — Clear backend bug
```
Task: "Fix race condition in payment webhook handler"

Classification:
  Domain:    nestjs (98), prisma (95), auth_security (85), ecommerce (85)
  Work type: MAINTENANCE
  Project:   exena-api

Scores:
  PA:        qual=83 skill=65 cert=90 phase=60 → (83×.3)+(65×.3)+(90×.2)+(60×.2) = 74.4
  SFS:       qual=83 skill=90 cert=80 phase=80 → (83×.3)+(90×.3)+(80×.2)+(80×.2) = 83.9
  BE:        qual=91 skill=100 cert=80 phase=92 → (91×.3)+(100×.3)+(80×.2)+(92×.2) = 90.7 ✔
  FE_WEB:    qual=21 skill=20 cert=80 phase=88 → 47.3
  FE_ADMIN:  qual=21 skill=20 cert=80 phase=85 → 46.7

ASSIGNED: Backend Dev (90.7/100)
Next: /cortex-bug → /dev-backend-debug → /cortex-fix → /cortex-verify
```

### Example 2 — New storefront page
```
Task: "Add a wishlist page to exena-web with add/remove and share link"

Classification:
  Domain:    nextjs (96), ecommerce (75), auth_security (75)
  Work type: GREENFIELD
  Project:   exena-web

Scores:
  BE:        qual=46 skill=30 cert=80 phase=85 → 57.3
  FE_WEB:    qual=87 skill=95 cert=80 phase=85 → (87×.3)+(95×.3)+(80×.2)+(85×.2) = 87.6 ✔
  FE_ADMIN:  qual=87 skill=95 cert=80 phase=75 → 85.6

ASSIGNED: Frontend Dev Web (87.6/100)
Next: /cortex-prd → /dev-frontend-page → /dev-frontend-service → /cortex-verify
```

### Example 3 — Schema migration (PA trigger)
```
Task: "Add seller onboarding model to schema with RBAC for seller role"

Classification:
  Domain:    prisma (95), nestjs (85), auth_security (85)
  Work type: MIGRATION
  Trigger:   Phase 2 (Prisma schema) + Phase 3 (new RBAC role)

ESCALATE TO PA
  PA designs migration plan and RBAC approach
  Backend Dev implements after approval
  Next: PA review → /dev-backend-schema → /cortex-migrate → /cortex-verify
```

### Example 4 — Cross-layer feature
```
Task: "Add real-time order status notifications: backend event + web UI bell"

Classification:
  Domain:    nestjs (85), bullmq (75), nextjs (85), ecommerce (80)
  Work type: GREENFIELD
  Project:   cross (exena-api + exena-web)

Rule 6 applies: cross-project → SFS leads

  SFS:       qual=82 skill=92 cert=80 phase=90 → (82×.3)+(92×.3)+(80×.2)+(90×.2) = 85.6 ✔

ASSIGNED: Senior Fullstack (85.6/100) — coordinates BE + FE_WEB specialists
Next: /cortex-prd → /cortex-build (BE phase) → /cortex-build (FE phase)
```

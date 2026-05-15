╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cert-gate  |  v1.0  |  TIER: 2  |  BUDGET: LEAN            ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 · L8 (post-task quality gate)                    ║
║ AUTHORITY     ║ OBSERVER                                            ║
║ CAN           ║ - Run TypeScript check scoped to the node's module  ║
║               ║ - Run Jest for the node's changed files only        ║
║               ║ - Secret scan on files touched by this node         ║
║               ║ - Check node-type invariants on changed files       ║
║               ║ - Update retryCount + gateResult in task-graph.json ║
║ CANNOT        ║ - Modify any source files                           ║
║               ║ - Block other parallel branches on one branch fail  ║
║               ║ - Run full test suite (use /cert-verify for that)   ║
║ WHEN TO RUN   ║ - After EACH task node completes in cert-orchestrate ║
║               ║ - Called automatically — not invoked directly       ║
║ OUTPUTS       ║ - PASS / WARN / FAIL · gate report per node         ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Per-task quality gate. Runs between a node completing and its dependents
unlocking. Targeted to the specific node type — not a full-suite check.

Purpose: prevent broken nodes from unlocking dependent tasks in the graph.

The difference from /cert-verify:
  cert-gate  → runs after EACH node · scoped to one module · fast
  cert-verify → runs at END of full build · scoped to all changes · thorough

$ARGUMENTS

Parse from $ARGUMENTS:
- `node-id` — the task-graph node ID that just completed (required)
- `--skip-tests` — skip Phase 2 (used for schema/migration nodes where tests don't exist yet)

---

## CHECK MATRIX (by node type)

Each node type triggers a specific set of phases:

```
schema      → Phase 1 (TypeScript)  · Phase 3 (secrets)
migration   → Phase 1 (TypeScript)  · Phase 3 (secrets)
service     → Phase 1 (TypeScript)  · Phase 2 (jest module) · Phase 3 (secrets) · Phase 4 (invariants)
endpoint    → Phase 1 (TypeScript)  · Phase 2 (jest module) · Phase 3 (secrets) · Phase 4 (invariants)
auth        → Phase 1 (TypeScript)  · Phase 2 (jest module) · Phase 3 (secrets) · Phase 4 (invariants) · Phase 4+ (security)
queue       → Phase 1 (TypeScript)  · Phase 2 (jest module) · Phase 3 (secrets) · Phase 4 (invariants)
test        → Phase 2 (jest target) · Phase 2+ (coverage ≥80%)
component   → Phase 1 (TypeScript)  · Phase 3 (secrets)
page        → Phase 1 (TypeScript)  · Phase 3 (secrets)
service-fe  → Phase 1 (TypeScript)  · Phase 3 (secrets)
e2e         → Phase 2 (jest e2e)
deploy      → route to /cert-verify full (full 5-phase check)
```

---

## STEP 1 — Load node

Read `ai/task-graph.json`. Find node by ID.

Extract:
- `type` — schema / service / endpoint / etc.
- `name` — human name for output
- `skill` — which skill ran this node
- `skillArgs` — what args were passed
- `retryCount` — current retry count (default 0 if absent)

If node not found:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CERT GATE — [node-id]
STATUS : SKIP
Reason : Node not found in ai/task-graph.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
Output PASS and exit (do not block on missing metadata).

---

## STEP 2 — Derive scope (files changed by this node)

Strategy A — Git diff (preferred):
```bash
git diff --name-only HEAD 2>/dev/null
```
Filter to files relevant to this node's module.
Derive module name from `skillArgs` or node `name`.

Strategy B — Infer from node type + skillArgs:
- `service` node with skillArgs "orders" → `src/modules/orders/orders.service.ts`
- `endpoint` node with skillArgs "POST /orders" → `src/modules/orders/orders.controller.ts`
- `component` node with skillArgs "OrderCard" → `src/components/OrderCard/**`
- `page` node with skillArgs "/orders" → `src/app/orders/page.tsx`

If neither strategy finds changed files: output WARN and skip Phases 1–2.
Still run Phase 3 (secrets) and Phase 4 (invariants) on inferred paths.

---

## STEP 3 — Phase 1: TypeScript (scoped)

Skip for node types: `test`, `e2e`

```bash
npx tsc --noEmit 2>&1
```

Interpretation:
- 0 errors → PASS
- Errors in files NOT belonging to this node's module → WARN (pre-existing, not this node's fault)
- Errors in this node's files → FAIL

Output:
```
Phase 1  TypeScript    PASS ✔  [0 errors]
Phase 1  TypeScript    WARN ⚠  [N errors in other modules — pre-existing]
Phase 1  TypeScript    FAIL ✖  [N errors in src/modules/<module>/]
```

---

## STEP 4 — Phase 2: Jest (module-scoped)

Skip for node types: `schema`, `migration`, `component`, `page`, `service-fe`

Determine jest target from node type:
- `service` → `--testPathPattern="<module>.service.spec"`
- `endpoint` → `--testPathPattern="<module>"` (runs all specs in module)
- `auth` → `--testPathPattern="auth"`
- `queue` → `--testPathPattern="<module>"` (or queue processor spec)
- `test` → `--testPathPattern="<spec-file-name>"` (run exactly the file this node wrote)
- `e2e` → `--testPathPattern="<e2e-file-name>"`

Run:
```bash
npx jest --testPathPattern="<target>" --no-coverage 2>&1 | tail -30
```

Interpretation:
- 0 failures → PASS
- Any failure → FAIL (list failing tests)

For `test` node type — ALSO check coverage:
```bash
npx jest --testPathPattern="<target>" --coverage 2>&1 | tail -10
```
- Coverage ≥ 80% → PASS
- Coverage < 80% → FAIL (the node's purpose was to add tests — coverage is its acceptance criterion)

Output:
```
Phase 2  Tests         PASS ✔  [N tests · 0 failed]
Phase 2  Tests         FAIL ✖  [N failed — list test names]
Phase 2  Coverage      PASS ✔  [84%]
Phase 2  Coverage      FAIL ✖  [67% — threshold 80%]
```

---

## STEP 5 — Phase 3: Secret scan (always run)

Scan changed files for hardcoded secrets:
```bash
git diff --name-only HEAD | xargs grep -lE "(apiKey|secret|password|token)\s*=\s*['\"][^$'\"]{8,}" 2>/dev/null
git diff --name-only HEAD | xargs grep -l "sk-ant-\|sk-\|AIza\|AKIA" 2>/dev/null
```

- No matches → PASS
- Any match → FAIL (HARD STOP — this is a security issue)

Output:
```
Phase 3  Secrets       PASS ✔
Phase 3  Secrets       FAIL ✖  [file:line — value found]
```

---

## STEP 6 — Phase 4: Invariant check (service / endpoint / auth / queue only)

Read quick reference from `ai/memory/INVARIANT_MEMORY.md` (if present).

Node-type invariant map:

```
service (orders/payments/coupons module):
  → grep changed files for "$transaction" — must be present for multi-table writes
  → FAIL if missing

endpoint (any module):
  → grep changed controller files for "prisma\." — must NOT call prisma directly
  → FAIL if found (controller must call service, not prisma)

auth (any):
  → grep changed files for "timingSafeEqual" — must be present for any signature check
  → grep for hardcoded JWT secret patterns
  → FAIL if timing-safe comparison absent on signature verification

queue (processor files):
  → grep for "throw" inside processor — must re-throw errors for BullMQ retry
  → FAIL if processor catches and swallows errors silently
```

If the node's module is not in the invariant map → skip, output PASS (not applicable).

Output:
```
Phase 4  Invariants    PASS ✔  [N/N checked]
Phase 4  Invariants    FAIL ✖  [$transaction missing in orders.service.ts:34]
Phase 4  Invariants    N/A     [node type has no invariant checks]
```

---

## STEP 7 — Determine verdict

```
Any Phase 3 FAIL  → FAIL (hard — secrets are non-negotiable)
Any Phase 4 FAIL  → FAIL (hard — invariant violation)
Any Phase 1 FAIL  → FAIL (scoped to this node's files)
Any Phase 2 FAIL  → FAIL (tests broken by this node)
Phase 1 WARN only → WARN (pre-existing issues, not this node's responsibility)
All phases PASS   → PASS
```

---

## STEP 8 — Update task-graph.json

Read `ai/task-graph.json`. Find node by ID. Update:

On PASS or WARN:
```json
{
  "gateResult": {
    "verdict": "PASS",
    "timestamp": "<ISO>",
    "phases": { "typescript": "PASS", "tests": "PASS", "secrets": "PASS", "invariants": "PASS" }
  }
}
```
(do NOT change `status` or `retryCount` — cert-orchestrate handles those)

On FAIL:
```json
{
  "retryCount": <current + 1>,
  "gateResult": {
    "verdict": "FAIL",
    "timestamp": "<ISO>",
    "failedPhases": ["tests"],
    "failureDetail": "3 tests failed in orders.service.spec.ts",
    "phases": { "typescript": "PASS", "tests": "FAIL", "secrets": "PASS", "invariants": "PASS" }
  }
}
```

---

## OUTPUT FORMAT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CERT GATE — [node-id] ([node-name])
Node type: [type] · Retry: [N/3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1  TypeScript    [PASS ✔ / WARN ⚠ / FAIL ✖ / SKIP]
Phase 2  Tests         [PASS ✔ / FAIL ✖ / SKIP]
Phase 3  Secrets       [PASS ✔ / FAIL ✖]
Phase 4  Invariants    [PASS ✔ / FAIL ✖ / N/A]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  PASS ✔  /  WARN ⚠  /  FAIL ✖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On FAIL — always show actionable fix:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CERT GATE — orders-service (RefundService)
Node type: service · Retry: 1/3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1  TypeScript    PASS ✔  [0 errors]
Phase 2  Tests         FAIL ✖  [2 failed]
Phase 3  Secrets       PASS ✔
Phase 4  Invariants    PASS ✔  [2/2 checked]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  FAIL ✖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILED TESTS
  ✖  should process refund for DELIVERED order
     Expected: OrderStatus.REFUNDED
     Received: OrderStatus.CANCELLED
     at orders.service.spec.ts:87

  ✖  should reject refund for PENDING order
     Expected error not thrown
     at orders.service.spec.ts:102

Fix:  Update refund status logic in orders.service.ts
      Check status transition: DELIVERED → REFUNDED (not CANCELLED)
Retry: cert-orchestrate will re-run this node (attempt 2/3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On 3rd failure — escalation message:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CERT GATE — [node-id] ([node-name])
Node type: [type] · Retry: 3/3  ← MAX REACHED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  FAIL ✖  (3 attempts exhausted)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESCALATE TO DEVELOPER
Node will be marked BLOCKED.
Dependent nodes cannot run until this is resolved.
Independent branches will continue.

To fix manually:
  1. Read the failure detail above
  2. Fix the issue in the source files
  3. Run: /cert-orchestrate graph  (resumes from this blocked node)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## MODEL HINT

This skill is read-only (runs shell checks + reads files). Use **Haiku** if routing
is available — it doesn't need Sonnet-level reasoning.

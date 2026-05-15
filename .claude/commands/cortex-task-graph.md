╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-task-graph  |  v1.0  |  TIER: 1  |  BUDGET: LEAN  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Blueprint) + L1 (Intent)                         ║
║ AUTHORITY     ║ ARCHITECT                                            ║
║ CAN           ║ - Convert blueprint/feature into dependency graph    ║
║               ║ - Write ai/task-graph.json                          ║
║               ║ - POST graph to orchestrator                        ║
║               ║ - Show progress of any active feature               ║
║ CANNOT        ║ - Execute tasks (routes to the right build skills)   ║
║               ║ - Modify source code                                ║
║ WHEN TO RUN   ║ - After /cortex-blueprint (automatic via Phase 7.5) ║
║               ║ - Before any multi-session feature build            ║
║               ║ - When /cortex-intent starts a FULL chain           ║
║               ║ - To check progress: /cortex-task-graph status      ║
║ OUTPUTS       ║ - ai/task-graph.json · orchestrator record          ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-task-graph — the dependency graph that makes features resumable and parallelizable.

The problem it solves:
  A complex feature (e.g. refund system) has 8+ tasks across backend, frontend, tests.
  Without a graph: you lose track across sessions, can't parallelize, can't see progress.
  With a graph: every task has a status. Sessions resume exactly where they stopped.
  Parallel agents read the graph and claim independent nodes simultaneously.

$ARGUMENTS

Parse from $ARGUMENTS:
- `generate` — generate graph from current ai/blueprint.md (called by blueprint Phase 7.5)
- `feature "<description>"` — generate graph for a specific feature (not full project)
- `status` — show current graph progress (what's done, in progress, pending, blocked)
- `status --graph` — status + ASCII dependency diagram
- `visualize` — render full ASCII dependency diagram from ai/task-graph.json
- `next` — show which tasks can run right now (all dependencies met)
- `reset` — mark all nodes pending (restart the feature)
- `critical-path` — show the longest dependency chain (if one node fails, feature stops)
- `--output <path>` — override default output path (default: ai/task-graph.json)

---

## NODE TYPES

Every unit of work in the graph is one of these types:

```
schema      → Prisma schema change or new model
migration   → Database migration file
service     → NestJS service + business logic
endpoint    → NestJS controller endpoint + DTO
auth        → Auth guard, role, permission change
queue       → BullMQ producer + processor
test        → Unit or integration test file
component   → Frontend component (leaf)
page        → Frontend page (composed from components)
service-fe  → Frontend API service layer
e2e         → End-to-end test
deploy      → Deployment step
```

---

## NODE STRUCTURE

Each node in the graph:

```json
{
  "id": "unique-kebab-case-id",
  "type": "schema | migration | service | endpoint | auth | queue | test | component | page | service-fe | e2e | deploy",
  "name": "human-readable name",
  "description": "what this task produces",
  "skill": "/dev-backend-schema | /dev-backend-endpoint | ...",
  "skillArgs": "args to pass to the skill",
  "status": "pending | in_progress | done | blocked | skipped",
  "dependsOn": ["node-id-1", "node-id-2"],
  "parallelWith": ["node-id-3"],
  "blockedReason": null,
  "assignedSession": null,
  "completedAt": null,
  "retryCount": 0,
  "gateResult": null
}
```

**dependsOn:** This task CANNOT start until all listed nodes are `done`.
**parallelWith:** This task CAN run at the same time as listed nodes (no data dependency).
**retryCount:** Incremented by `/cert-gate` on each FAIL verdict. Capped at 3 — node becomes `blocked` at 3.
**gateResult:** Written by `/cert-gate` after the node's skill completes. Shape:
```json
{
  "verdict": "PASS | WARN | FAIL",
  "timestamp": "ISO-8601",
  "phases": {
    "typescript": "PASS | FAIL | SKIP",
    "tests": "PASS | FAIL | SKIP",
    "secrets": "PASS | FAIL",
    "invariants": "PASS | FAIL | N/A"
  },
  "failedPhases": [],
  "failureDetail": "human-readable summary of what failed"
}
```

---

## DEPENDENCY RULES (apply automatically)

```
schema      → nothing (always first)
migration   → depends on: schema
service     → depends on: schema
endpoint    → depends on: service
auth        → depends on: endpoint (usually)
queue       → depends on: service
test        → depends on: endpoint OR service (whichever it tests)
component   → depends on: endpoint (needs API contract to exist)
service-fe  → depends on: endpoint
page        → depends on: component(s) + service-fe
e2e         → depends on: page + endpoint (all must be done)
deploy      → depends on: all tests done
```

---

## STEP 1 — GENERATE GRAPH

### 1A — Read the source

If `generate` mode: read `ai/blueprint.md` Phase 7 (Phased Implementation Plan).
If `feature` mode: parse the feature description directly.

### 1B — Extract all tasks

For each item in the phased plan, create one node per unit of work.

Rule: one node = one skill call = one deployable piece.
Never bundle two types into one node (e.g. don't combine schema + endpoint into one node).

### 1C — Assign dependencies

Apply DEPENDENCY RULES above. Also check for any explicit dependencies mentioned in blueprint.

### 1D — Identify parallel groups

Nodes that share the same dependencies (or no dependencies) can run in parallel.
Label them with `parallelWith` each other.

### 1E — Write ai/task-graph.json

```json
{
  "feature": "feature name from blueprint or argument",
  "project": "project name from package.json",
  "created": "ISO timestamp",
  "status": "active",
  "nodes": [
    { ...node... },
    { ...node... }
  ],
  "summary": {
    "total": 0,
    "pending": 0,
    "in_progress": 0,
    "done": 0,
    "blocked": 0
  }
}
```

### 1F — POST to orchestrator (if running)

```
POST http://localhost:7391/features
{
  "name": "[feature name]",
  "project": "[project name]",
  "intentType": "FULL",
  "steps": [ ...nodes mapped to steps... ]
}
```

If orchestrator offline: skip silently, continue with local file only.

---

## GENERATE EXECUTION OUTPUT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Generate Task Graph
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/6] Read source
→ ai/blueprint.md Phase 7 [OR feature description from argument]
✓ Source loaded

[2/6] Extract tasks
→ Parsing phased implementation plan
✓ [N] nodes identified

[3/6] Assign dependencies
→ Applying dependency rules (schema → migration → service → endpoint → test)
✓ Dependencies resolved

[4/6] Identify parallel groups
→ Grouping nodes with shared or no dependencies
✓ [N] parallel groups identified

[5/6] Write ai/task-graph.json
→ Writing [N]-node graph to ai/task-graph.json
✓ Written
  [OR]
✗ File write failed — check path and permissions

[6/6] POST to orchestrator
→ POST http://localhost:7391/features
✓ Synced — feature registered
  [OR]
⚠ No response — orchestrator offline · continuing with local file only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Duration: Xs
Next   : /cortex-task-graph status
         OR /cert-parallel  (run parallel nodes)
         OR /cert-orchestrate graph  (run full graph)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Failure path — if step 5 (file write) fails:
```
[5/6] Write ai/task-graph.json
→ Writing to ai/task-graph.json
✗ File write failed

[6/6] POST to orchestrator
• Skipped — no file to sync

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : FAILED at step 5/6
Reason : Could not write ai/task-graph.json
Fix    : Check directory exists (mkdir -p ai/) and retry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 2 — STATUS VIEW

When `status` arg given, read `ai/task-graph.json` and output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK GRAPH — [feature name]
Progress: [████████░░░░░░░░░░░░] [N/Total] done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DONE
  [node-id]  [name]  ([type])

⏳ IN PROGRESS
  [node-id]  [name]  ([type])  — assigned: [session]

🔲 NEXT (ready to run — all deps met)
  [node-id]  [name]  ([type])  → run: [skill] [args]
  [node-id]  [name]  ([type])  → run: [skill] [args]
  (these can run in parallel)

⏸  WAITING (deps not met)
  [node-id]  [name]  — waiting for: [dep-ids]

🚫 BLOCKED
  [node-id]  [name]  — reason: [blockedReason]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To resume:      run the NEXT tasks above
To parallelize: open 2 sessions, each claims one NEXT task
To visualize:   /cortex-task-graph visualize
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 3 — MARK NODE STATUS

These commands update `ai/task-graph.json` during execution:

When a skill starts a task → mark `in_progress`:
```json
{ "status": "in_progress", "assignedSession": "session-YYYY-MM-DD-N" }
```

When a skill completes a task → mark `done`:
```json
{ "status": "done", "completedAt": "ISO timestamp" }
```

When a task is blocked → mark `blocked`:
```json
{ "status": "blocked", "blockedReason": "reason" }
```

Always update the `summary` counts after any status change.

---

## EXAMPLE GRAPH — Refund System

```json
{
  "feature": "Refund System",
  "nodes": [
    { "id": "refund-schema",   "type": "schema",   "name": "Refund model",         "dependsOn": [],                          "parallelWith": [] },
    { "id": "refund-migration","type": "migration", "name": "Refund migration",     "dependsOn": ["refund-schema"],           "parallelWith": [] },
    { "id": "refund-service",  "type": "service",  "name": "RefundService",         "dependsOn": ["refund-schema"],           "parallelWith": ["order-state-service"] },
    { "id": "order-state-service","type":"service", "name":"OrderStateService update","dependsOn":["refund-schema"],          "parallelWith": ["refund-service"] },
    { "id": "refund-endpoint", "type": "endpoint", "name": "POST /refunds",         "dependsOn": ["refund-service"],          "parallelWith": [] },
    { "id": "refund-webhook",  "type": "endpoint", "name": "Razorpay refund webhook","dependsOn":["refund-service"],          "parallelWith": ["refund-endpoint"] },
    { "id": "refund-test",     "type": "test",     "name": "Refund service tests",  "dependsOn": ["refund-endpoint"],         "parallelWith": ["refund-webhook-test"] },
    { "id": "refund-webhook-test","type":"test",   "name": "Webhook tests",         "dependsOn": ["refund-webhook"],          "parallelWith": ["refund-test"] }
  ]
}
```

**Reading this graph:**
- `refund-schema` first (no deps) → `refund-migration` next
- `refund-service` + `order-state-service` in parallel (both just need schema)
- `refund-endpoint` + `refund-webhook` in parallel (both need service)
- `refund-test` + `refund-webhook-test` in parallel (final)

---

## STEP 4 — VISUALIZE MODE

Triggered by: `visualize` or `status --graph`

Read `ai/task-graph.json`. Build an ASCII dependency tree grouped by phases.

### Rules for rendering

1. Root nodes (no `dependsOn`) are top-level — render first
2. Nodes sharing the same parent AND marked `parallelWith` each other → group with `├──` under a `[PARALLEL]` label
3. Each node shows: `[type] name — status-icon`
4. Status icons: `✓` done · `⏳` in_progress · `□` pending · `✗` blocked
5. Max width: 60 chars per line — truncate name if needed
6. Group by phase if blueprint phases are present in node IDs

### Output format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK DEPENDENCY GRAPH — [feature name]
[N] nodes · [N] parallel groups · [N/N] done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[schema] p0-scaffold                              ✓
│
├── [PARALLEL]
│   ├── [schema]    auth-schema                   ✓
│   └── [schema]    article-schema                ✓
│       │
│       ├── [PARALLEL]
│       │   ├── [migration] article-migration     ⏳
│       │   └── [service]   article-service       □
│       │       │
│       │       └── [endpoint] POST /articles     □
│       │           │
│       │           └── [PARALLEL]
│       │               ├── [component] ArticleCard   □
│       │               └── [service-fe] articleSvc   □
│       │                   │
│       │                   └── [page] /articles      □
│       │
│       └── [service] auth-service                □
│           │
│           └── [endpoint] POST /auth/login        □
│
└── [test] integration-tests                      □
    (waiting for: all endpoints)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Legend: ✓ done  ⏳ active  □ pending  ✗ blocked
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If graph is large (> 20 nodes)

Collapse completed subtrees to keep output readable:

```
├── [PARALLEL — 4 nodes]  ✓ ALL DONE
│   └── (collapsed — run /cortex-task-graph visualize --expand to see)
```

Show full tree only when `--expand` flag is passed.

### After diagram — always show NEXT actions

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READY TO RUN NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ article-migration  → /dev-backend-schema migrate
□ auth-service       → /dev-backend-auth
(run in parallel — no dependencies between them)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 5 — CRITICAL PATH

Triggered by: `critical-path`

Read `ai/task-graph.json`. Walk all dependency chains from root nodes (no `dependsOn`) to leaf
nodes (nothing depends on them). Find the longest chain by node count.

### Algorithm

```
1. Build adjacency map: node → nodes that depend on it
2. DFS from each root node, tracking chain depth
3. The longest path from any root to any leaf = critical path
4. If a tie: pick the one containing most `service` or `endpoint` type nodes
```

### Output format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL PATH — [feature name]
[N] nodes · longest chain: [depth] steps
If any node on this path fails → feature is blocked.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [schema]    refund-schema         ✓  done
       │
  [migration] refund-migration      ⏳  in_progress
       │
  [service]   refund-service        □  pending
       │
  [endpoint]  POST /refunds         □  pending
       │
  [test]      refund-service-tests  □  pending

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL (not on critical path — safe to skip if blocked):
  □ order-state-service   □ refund-webhook   □ refund-webhook-test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next on path: refund-service → /dev-backend-service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Duration: Xs
Next   : /cortex-task-graph status
         OR /cert-parallel  (run parallel nodes)
         OR /cert-orchestrate graph  (run full graph)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Feature      [name]
Nodes        [total] tasks · [N] parallel groups
Written      ai/task-graph.json
Orchestrator [synced | offline]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

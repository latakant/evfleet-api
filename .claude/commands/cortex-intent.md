╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-intent  |  v1.1  |  TIER: 1  |  BUDGET: LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ ALL layers (coordinator)                            ║
║ AUTHORITY     ║ ORCHESTRATOR                                        ║
║ CAN           ║ - Parse any free-form user request                  ║
║               ║ - Classify intent into the correct engine chain    ║
║               ║ - Propose a skill execution sequence               ║
║               ║ - Run the chain after human confirmation           ║
║ CANNOT        ║ - Skip human approval before executing a chain     ║
║               ║ - Route to code skills without blueprint/design    ║
║               ║   when those haven't been run yet                  ║
║ WHEN TO RUN   ║ - When you're not sure which skill to use          ║
║               ║ - For complex requests involving multiple engines  ║
║               ║ - When request mixes design + development + ops    ║
║ OUTPUTS       ║ - Intent classification · Engine chain · Exec plan ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Intent Engine — parses user requests and routes to the correct engine chain.

The job of this skill is to answer:
  "The user said X — which engines activate, in what order, with what inputs?"

It does NOT execute code. It proposes a plan, waits for approval, then triggers.

$ARGUMENTS

Parse from $ARGUMENTS:
- Free-form request text (no structured format needed)
- `--auto` — skip confirmation, run chain immediately (use only for simple single-engine tasks)
- `--design-only` — resolve to Design Engine only, skip dev
- `--dry-run` — output engine chain but do not run any skill

---

## STEP 0.5 — Vector-less RAG Retrieval

Before classifying, retrieve relevant skills and adapter knowledge from the corpus.

Run:
```bash
node /c/luv/Cortex/scripts/retrieve.js "[user's request]" --top=5 --json
```

Read the JSON output. For each result:
- `type=skill` → note the skill name — it may belong in the engine chain
- `type=adapter` → **load that adapter file now** — it contains domain laws for this task

Example: query "add auth endpoint" returns `dev-backend-auth` (adapter) and `cert-feature` (skill).
Action: read `adapters/stack/typescript/backend/nestjs/dev-backend-auth.md` before Step 1.

**Rules:**
- Only act on results with score > 2.0 — below that is noise
- If top result is a skill you wouldn't have thought of, add it to the chain in Step 2
- If retrieve.js is not found, skip silently — do not block execution
- This step adds context only — it does not override the routing table in Step 2

Output at end of this step:
```
RETRIEVED CONTEXT
─────────────────────────────────────────────────────
Skills surfaced: [list or "none above threshold"]
Adapters loaded: [list or "none above threshold"]
─────────────────────────────────────────────────────
```

---

## STEP 1 — Intent Classification

Read the user request. Classify into one of these intent types:

```
INTENT TYPES
─────────────────────────────────────────────────────
1. PLAN      — "plan / design system / architect / blueprint for [X]"
2. DESIGN    — "design UI / create screen / UX for / how should [X] look"
3. BUILD     — "build / implement / add / create [feature/endpoint/module]"
4. FIX       — "fix / debug / broken / not working [X]"
5. REVIEW    — "review / check / audit / score [X]"
6. TEST      — "write tests / add coverage / TDD [X]"
7. DEPLOY    — "deploy / push / staging / production / release [X]"
8. FULL      — "end-to-end / complete feature [X]" (multiple engines)
9. IMPROVE   — "refactor / optimize / clean up / improve [X]"
10. LEARN    — "explain / how does / what is [X]" (no code)
─────────────────────────────────────────────────────
```

Output:
```
INTENT DETECTED
─────────────────────────────────────────────────────
Request:  "[user's words]"
Intent:   [INTENT TYPE]
Target:   [what feature/module/screen they're referring to]
Scope:    [single engine | multi-engine | full lifecycle]
─────────────────────────────────────────────────────
```

---

## STEP 1.5 — Complexity Score (80/20 gate)

Score the task on 5 dimensions before deciding how many agents to spawn.
80% of tasks are SIMPLE — handle them inline. Only 20% justify a full agent chain.

| Dimension | 0 pts | 1 pt | 2 pts |
|-----------|-------|------|-------|
| Files to change | 1 file | 2–3 files | 4+ files |
| Modules/domains touched | 1 module | 2 modules | 3+ modules |
| Financial / auth / webhook involved | no | — | yes |
| Similar pattern already exists in codebase | yes (−2) | — | no |
| Schema or migration change needed | no | — | yes |

**Score → Agent mode:**

```
0–3   SIMPLE    → INLINE       — Claude handles directly. No sub-agent spawned.
4–6   MODERATE  → SINGLE-AGENT — One specialist agent. Choose most relevant.
7–10  COMPLEX   → FULL-CHAIN   — Multi-agent chain. Full orchestration justified.
```

**Agent selection for MODERATE (pick one):**
- New code to write → `tdd-guide`
- Existing code to review → `code-reviewer`
- Architecture decision → `architect`
- Security-sensitive change → `security-reviewer`

**Rule:** never spawn more agents than the score justifies.
If score is SIMPLE but you're tempted to spawn agents anyway → handle inline.

Add to INTENT DETECTED output:
```
─────────────────────────────────────────────────────
Complexity: [SIMPLE / MODERATE / COMPLEX]  (score: N/10)
Agent mode: [INLINE / SINGLE-AGENT: <name> / FULL-CHAIN: <names>]
─────────────────────────────────────────────────────
```

---

## STEP 2 — Engine Resolution

Map intent → engine chain:

```
ENGINE ROUTING TABLE
─────────────────────────────────────────────────────
PLAN   → cortex-blueprint
         (idea → domain map → law validation → phased plan)

DESIGN (section / UI pattern) →
         design-section [type] [product] → design-layout [page] → design-review
         (section content + copy → page arrangement → audit before handoff)
         Note: use this path for landing pages, UI sections, design specs

DESIGN (product feature / app screen) →
         cortex-design → dev-frontend-component(s) → dev-frontend-page
         (UX flow → component tree → production code)
         Note: if blueprint not done yet, run cortex-blueprint first

BUILD (backend only) →
         dev-backend-endpoint [OR] dev-backend-schema [OR] dev-backend-auth
         → dev-backend-test → cortex-verify → cortex-commit

BUILD (frontend only) →
         cortex-design → dev-frontend-component(s) → dev-frontend-page
         → cortex-verify → cortex-commit

BUILD (full-stack) →
         cortex-design [parallel] dev-backend-endpoint
         → dev-frontend-service → dev-frontend-page
         → dev-tdd → cortex-verify → cortex-commit

FIX (backend) →
         dev-backend-debug → dev-backend-test → cortex-verify → cortex-commit

FIX (frontend) →
         dev-frontend-debug → cortex-verify → cortex-commit

FIX (unknown layer) →
         dev-fullstack-debug → [backend or frontend fix] → cortex-verify

REVIEW → cortex-review → cortex-score → [fix if needed]

TEST   → dev-tdd [OR] dev-backend-test [OR] dev-tester

DEPLOY (staging) →
         cortex-staging → cortex-prelaunch → cortex-production

FULL (complete feature, end-to-end) →
         cortex-blueprint (if new domain)
         → cortex-task-graph feature "[feature name]"  ← generates dependency graph
         → cortex-design (for UI)
         → cortex-orchestrate feature "[feature name]"
           (runs nodes from task graph in dependency order)
         → cortex-verify → cortex-commit
         Note: graph is resumable — next session runs /cortex-task-graph status

IMPROVE → cortex-refactor → code-reviewer → cortex-verify

LEARN  → answer only, no skill chain (plain response)
─────────────────────────────────────────────────────
```

---

## STEP 3 — Prerequisite Check

Before proposing the chain, check what's already done:

```
PREREQUISITE CHECK
─────────────────────────────────────────────────────
Blueprint exists?
  Check: does ai/blueprint.md exist + is approved?
  If NO and intent needs architecture → add cortex-blueprint to chain first

Design done?
  Check: has cortex-design been run for this feature?
  If NO and intent is BUILD frontend → add cortex-design to chain first

Endpoint exists?
  Check: does the backend service function exist for this UI?
  If NO and intent is BUILD frontend → add dev-backend-endpoint to chain first

Tests written?
  Check: does a .spec.ts file exist for this module?
  If NO → ensure dev-backend-test or dev-tdd is in chain
─────────────────────────────────────────────────────
```

If a blocking prerequisite is found that cannot be added to the chain (e.g. blueprint approved flag missing, or design not done and user has not run it):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : BLOCKED at step [N/N]
Reason : [what caused the block]
Fix    : [what the user needs to do]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 3.5 — Task Graph Resume Check (FULL intent only)

When intent is FULL, before building the chain, check if a task graph already exists:

```
CHECK: does ai/task-graph.json exist?
  If YES:
    Read it. Check feature name matches current request.
    If same feature → offer to resume:
      "Task graph found for '[feature]' — [N/total] tasks done.
       Resume from where we stopped? [Y/n]"
      If YES → skip to STEP 5, load chain from pending/blocked nodes in graph
      If NO  → continue to build new chain (will overwrite graph)
    If different feature → continue to build new chain
  If NO:
    Continue to generate graph in STEP 4
```

---

## STEP 4 — Save Feature + Generate Task Graph

Before showing the plan or running anything:

### 4A — Save to orchestrator

If orchestrator is running (`GET http://localhost:7391/health` returns 200):

```
POST http://localhost:7391/features
{
  "name": "[user's feature description — 3-6 words]",
  "project": "[read from package.json name field or ai/context/metadata.json]",
  "intentType": "[PLAN|DESIGN|BUILD|FIX|FULL|REVIEW|TEST|DEPLOY|IMPROVE]",
  "steps": [
    { "skillName": "[skill-name]", "skillArgs": "[args if any]", "description": "[what it produces]" },
    ...one entry per step in the chain...
  ]
}
```

Save the returned `feature.id` in memory — use it throughout execution to mark steps
in_progress and done as the chain runs.

If orchestrator is NOT running: skip silently — do not block execution.
Output one line: `⚠️  Orchestrator offline — progress not tracked this session.`

### 4B — Generate task graph (FULL intent only)

When intentType is FULL: call `/cortex-task-graph feature "[feature name]"` internally.

This generates `ai/task-graph.json` with all work nodes, their dependencies, and parallel groups.

The task graph makes this FULL chain:
- **Resumable** — next session reads the graph, skips done nodes
- **Parallelizable** — independent nodes can run in separate agents simultaneously
- **Trackable** — `/cortex-task-graph status` shows progress at any time

For non-FULL intents (BUILD, FIX, DESIGN etc.): skip graph generation — chain is short enough to track inline.

---

## STEP 5 — Execution Plan Output

Present the plan clearly. ALWAYS show this before running anything:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX INTENT — EXECUTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:       "[user's original words]"
Intent:        [TYPE]
Target:        [feature/module/screen]

ENGINE CHAIN
─────────────────────────────────────────────────────
Step 1:  /[skill-name] [args]     → [what this produces]
Step 2:  /[skill-name] [args]     → [what this produces]
Step 3:  /[skill-name] [args]     → [what this produces]
[...]
─────────────────────────────────────────────────────
Prerequisites already done:  [list or "none needed"]
Prerequisites missing:       [list or "none"]

Estimated scope:
  Files to create/modify: ~[N]
  Tests to write: ~[N]
  Approximate sessions: [1 / 2 / 3+]

PARALLEL POSSIBLE?
  [Yes — Steps X and Y can run in parallel via /cortex-parallel]
  [No — sequential only]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type CONFIRM to execute. Or ask to modify the chain.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 6 — Execute (after confirmation)

On CONFIRM:
1. Mark Step 1 in_progress in orchestrator (if feature_id saved):
   `POST http://localhost:7391/features/{feature_id}/steps/1/start`

2. Run Step 1 fully — wait for completion, check for BLOCKED verdict

3. If BLOCKED:
   - Mark step blocked: `POST .../steps/1/block`
   - Halt, show blocker, ask user how to resolve

4. If PASS:
   - Mark step done with summary: `POST .../steps/1/complete { "outputSummary": "..." }`
   - Run Step 2 with output of Step 1 as context
   - Repeat for each step

5. Continue until chain complete.

If `--auto` flag was provided: skip confirmation, run immediately.
If `--dry-run` flag: output plan only, do not run any step.

---

## STEP 7 — Summary Report

After full chain completes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Intent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE | BLOCKED at step [N]
Request: [original request]
Intent : [TYPE]
Steps  : [N] run · [N] passed · [N] blocked

WHAT WAS BUILT
─────────────
[bullet list of files created/modified]
[tests written]
[endpoints added]
[screens added]

WHAT STILL NEEDS DOING
──────────────────────
[any remaining steps blocked or deferred | none]

Next   : /cert-commit — if all steps passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Common Pattern Examples

### "Design the order tracking page for customers"
```
Intent: DESIGN
Chain:
  Step 1: /cortex-design feature "order tracking page" actor customer
  Step 2: /dev-frontend-component OrderStatusTimeline
  Step 3: /dev-frontend-component DeliveryCard
  Step 4: /dev-frontend-page web /orders/[id] "order tracking"
```

### "Add a coupon validation endpoint"
```
Intent: BUILD (backend only)
Chain:
  Step 1: /dev-backend-endpoint POST /coupons/validate
  Step 2: /dev-backend-test coupon validation
  Step 3: /cortex-verify
  Step 4: /cortex-commit
```

### "Build the full wishlist feature"
```
Intent: FULL (end-to-end)
Chain:
  Step 1: /cortex-design feature "wishlist" actor customer
  Step 2: /dev-backend-endpoint POST/DELETE /wishlist (parallel with design)
  Step 3: /dev-frontend-service wishlist
  Step 4: /dev-frontend-page web /wishlist "wishlist page"
  Step 5: /cortex-verify
  Step 6: /cortex-commit
```

### "Fix the cart total not updating"
```
Intent: FIX
Chain:
  Step 1: /dev-fullstack-debug "cart total not updating"
  Step 2: [frontend fix OR backend fix based on debug output]
  Step 3: /cortex-verify
  Step 4: /cortex-commit
```

---

## Learning log

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="INTENT: [type] · target=[feature] · chain=[N steps] · parallel=[yes/no]"
```

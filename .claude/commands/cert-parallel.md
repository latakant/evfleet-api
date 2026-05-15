╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-parallel  |  v1.0  |  TIER: 5  |  BUDGET: HIGH      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L4 · L5 · L6                                   ║
║ AUTHORITY     ║ ORCHESTRATOR                                         ║
║ CAN           ║ - Spawn up to 4 parallel sub-agents                  ║
║               ║ - Read all src/ files for context bundling           ║
║               ║ - Write via delegated agents (not directly)          ║
║ CANNOT        ║ - Exceed 4 parallel agents (context/cost limit)      ║
║               ║ - Merge conflicting changes automatically            ║
║ WHEN TO RUN   ║ - 3+ independent domains to build simultaneously     ║
║               ║ - Large feature that touches multiple modules        ║
║               ║ - Parallel code review across multiple files         ║
║ OUTPUTS       ║ - Coordinated execution plan · per-agent results     ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Parallel agent orchestration. Splits work into independent tasks and
runs them simultaneously. Reduces build time on multi-domain features.
Use when 3+ skills need to run and they don't depend on each other.

$ARGUMENTS

Parse from $ARGUMENTS:
- `graph` — read ai/task-graph.json, run all NEXT-ready nodes in parallel  ← PRIMARY MODE
- `map <skill> <d1> <d2> <d3>` — run same skill on multiple domains
- `build <d1> <d2> <d3>` — build multiple domains in parallel
- `review` — parallel code review (by file group)
- `verify` — run all verification phases in parallel
- `perspectives <topic>` — multi-perspective analysis (security + quality + architecture)

---

## MODEL HINT

Orchestrator (this): **Sonnet** — planning and coordination.
Sub-agents: **Haiku** for verification/search/review. **Sonnet** for builds.
Never use Opus for parallel tasks — too slow, context too large.

---

## WHEN TO USE PARALLEL vs SEQUENTIAL

| Use parallel | Use sequential |
|---|---|
| Domains are independent (auth ≠ orders) | B depends on A's output |
| Building 3+ domains of same type | Running migrations (order matters) |
| Reviewing different file groups | Fixing a chain of bugs |
| Verifying independent test suites | Schema change → migration → redeploy |

**Rule of thumb:** If task 2 needs to read task 1's output → sequential.
If task 2 is completely unaware of task 1 → parallel.

---

## MODE 0 — graph (task-graph-aware parallel execution) ← PRIMARY

Reads `ai/task-graph.json` and runs all nodes that are NEXT-ready simultaneously.
This is the primary way to execute a FULL feature after `/cortex-blueprint` or `/cortex-task-graph`.

```
/cert-parallel graph
```

**Step 1 — Read graph**
Read `ai/task-graph.json`. Find all nodes where:
- `status == "pending"` AND
- all `dependsOn` nodes have `status == "done"`

These are the NEXT-ready nodes. They are safe to run in parallel.

**Step 2 — Show parallel groups**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READY TO RUN IN PARALLEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[node-id]  [name]  ([type])  → skill: [skill] [skillArgs]
[node-id]  [name]  ([type])  → skill: [skill] [skillArgs]
[node-id]  [name]  ([type])  → skill: [skill] [skillArgs]

All [N] above can run simultaneously (no shared dependencies).

Still waiting (deps not met):
  [node-id]  [name]  — waiting for: [dep-ids]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run all [N] in parallel? [Y/n]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Step 3 — Mark in-progress**
For each node about to run:
- Set `status: "in_progress"` in ai/task-graph.json
- Set `assignedSession: "session-[date]-[N]"`
- Update summary counts

**Step 4 — Spawn agents (max 4)**
Build context bundle for each node (its skill + skillArgs + required context).
Spawn one agent per node simultaneously.

**Step 5 — Collect results**
For each completed agent:
- If success: set node `status: "done"`, `completedAt: [ISO timestamp]`
- If blocked: set node `status: "blocked"`, `blockedReason: [reason]`
- Update summary counts in task-graph.json

**Step 6 — Check for newly unlocked nodes**
After each node completes, re-check the graph.
Nodes whose `dependsOn` are now all done → become NEXT-ready.
Output: "Step N complete. [M] new nodes unlocked."

**Step 7 — Offer next round**
If more NEXT-ready nodes exist: offer to run next parallel group.
If all done: show completion.
If some blocked: show blockers and stop.

---

## MODE 1 — map (same skill, multiple domains)

Run the same skill on N domains simultaneously:

```
/cortex-parallel map cortex-build auth products categories
```

**Step 1 — Dependency check**
For each domain pair, verify independence:
- Do they share DB tables? (check schema.prisma relations)
- Do they import each other's services?
- Would building both simultaneously cause merge conflicts?

If any pair is dependent → split into groups, run groups sequentially.

**Step 2 — Build context bundles**
For each domain, prepare a focused context bundle:
```
Bundle for <domain>:
  - src/modules/<domain>/ (full directory)
  - Relevant schema models
  - Relevant domain skill (ecom-orders, ecom-payments, etc.)
  - INVARIANT_MEMORY.md Quick Reference block
  - TRANSACTION_MEMORY.md (if financial domain)
```

Keep each bundle under 50K tokens. Drop non-essential files.

**Step 3 — Spawn agents**
Launch all agents simultaneously (max 4):
```
Agent 1: Task(subagent_type="general-purpose", prompt=bundle_auth)
Agent 2: Task(subagent_type="general-purpose", prompt=bundle_products)
Agent 3: Task(subagent_type="general-purpose", prompt=bundle_categories)
```

**Step 4 — Collect and merge**
Wait for all agents to complete. For each:
- Review output for conflicts with other agents
- Check no two agents modified the same file
- If conflict: apply one, manually merge the other

---

## MODE 2 — build (shorthand for map cortex-build)

```
/cortex-parallel build orders payments invoices
```

Equivalent to `map cortex-build orders payments invoices`.
Additional check: verify migration order (payments before invoices if FK dependency).

---

## MODE 3 — review (parallel file group review)

Split changed files into groups by module, review in parallel:

```
/cortex-parallel review
```

**Step 1:** `git diff --name-only HEAD` → list changed files
**Step 2:** Group by module (`src/modules/<name>/`)
**Step 3:** Spawn one reviewer agent per module (max 4 groups)
**Step 4:** Collect all findings, deduplicate, sort by severity

Each reviewer agent runs the `cortex-review` checklist on its file group.
Faster than reviewing all files sequentially for large PRs.

---

## MODE 4 — verify (parallel verification phases)

Run phases 1-4 of `cortex-verify` simultaneously instead of sequentially:

```
/cortex-parallel verify
```

**Parallel:**
- Agent A: `npx tsc --noEmit` (Phase 1)
- Agent B: `npx jest --affected` (Phase 2)
- Agent C: secret scan on changed files (Phase 3)
- Agent D: invariant grep on changed files (Phase 4)

**Sequential after all complete:**
- Phase 5: diff review (needs all other results)
- Verdict: combine results

Saves ~40% of verify time on large codebases.

---

## MODE 5 — perspectives (multi-perspective analysis)

For complex problems, run split-role sub-agents simultaneously:

```
/cortex-parallel perspectives "Should we add optimistic locking to cart?"
```

**Spawn simultaneously:**
- Agent A (security lens): security implications, attack vectors, race conditions
- Agent B (quality lens): code quality, maintainability, test coverage impact
- Agent C (architecture lens): system design, scalability, consistency trade-offs

**Merge results:**
1. Identify consensus (strong signal — all three agree)
2. Identify divergence (needs weighing — agents disagree)
3. Apply domain authority: security concerns override quality concerns on auth/payment code

This produces richer analysis than a single agent for architectural decisions.
Use for: complex design choices, pre-launch reviews, major refactors.

---

## ITERATIVE CONTEXT REFINEMENT

When a sub-agent reports "missing context" or produces wrong output:

**Round 1:** Send focused context bundle (as above)
**Round 2:** If agent fails — add adjacent modules' interfaces only
**Round 3:** If agent fails again — add shared utilities + types
**Max 3 rounds,** then escalate: run the task conversationally instead.

```
Round 1: src/modules/<domain>/  + invariants
Round 2: Round 1 + src/modules/<dep1>/  (interfaces only, not full service)
Round 3: Round 2 + src/shared/  + src/common/
```

This prevents context overflow while ensuring the agent has what it needs.

---

## CONFLICT RESOLUTION

If two parallel agents modify the same file:

1. Apply the agent that wrote less (smaller change = easier to verify)
2. Read the other agent's diff carefully
3. Manually integrate the non-conflicting parts
4. Run `cortex-verify` after merging

**Prevention:** always check file overlap before spawning.
Any file touched by 2+ agents → assign it to only one agent.

---

## COMPLETION

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-parallel                COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode        {graph/map/build/review/verify}
Agents      {N} spawned · {N} completed · {N} failed
Graph       {N/total} nodes done · {N} newly unlocked
Output      {summary of what each agent produced}
Conflicts   {NONE / list files with conflicts}
Next        /cert-parallel graph       (run next ready nodes)
            /cortex-task-graph status  (see full graph state)
            /cortex-verify             (after parallel build)
            /cortex-commit             (after parallel review passes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

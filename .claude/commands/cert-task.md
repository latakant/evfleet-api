# /cortex-task — Skill 49
# LOAD WHEN: multi-module builds | 3+ sequential skills | parallel execution
# Atomic task isolation — each skill runs in a fresh sub-agent with minimal context
# Prevents context rot. Enables parallel builds. Improves precision.

$ARGUMENTS

---

## Usage

```
cortex task <skill> [args]              → isolated single task
cortex task parallel <s1> <s2>         → two tasks in parallel (max 2)
cortex task chain <s1> <s2> <s3>       → sequential, result feeds next
cortex task status                     → list running background tasks
```

### Examples

```bash
cortex task cortex-build orders
cortex task cortex-extract invoices
cortex task parallel cortex-build auth cortex-build categories
cortex task chain cortex-build orders cortex-build payments cortex-build invoices
```

---

## TOKEN BUDGET
Load before starting: MASTER.md (was: EXECUTION_PROTOCOL.md — merged) (Rule 2 — context bundle spec)
This skill itself is lean — it delegates; it does not execute build logic.

---

## Execution Protocol

### Step 1 — Classify the task

Read MASTER.md (was: EXECUTION_PROTOCOL.md — merged) Rule 1:
- 1-2 builds → recommend going conversational (no isolation needed)
- 3+ builds → proceed with isolation
- Always: full bootstrap / extract → proceed with isolation

### Step 2 — Build context bundle for sub-agent

For `cortex task <skill> <domain>`, bundle:

```
ALWAYS INCLUDE in sub-agent prompt:
  1. Contents of: ai/spec/policies/CRITICAL.yaml
  2. Contents of: .claude/commands/<skill>.md
  3. Relevant domain skill file (if exists): ai/memory/<domain>.skill.md

INCLUDE IF EXISTS:
  4. ai/spec/domain/entities/<domain>.yaml
  5. ai/spec/contracts/api/<domain>-api.yaml

TELL sub-agent to read (not pre-load):
  6. src/modules/<domain>/<domain>.service.ts
  7. src/modules/<domain>/<domain>.controller.ts
  8. Relevant prisma schema lines
```

### Step 3 — Write sub-agent prompt

```
You are executing: /<skill> <args>
Project: Exena India (Indian e-commerce API — NestJS/Prisma/TypeScript)

CRITICAL POLICIES (must not violate):
<paste CRITICAL.yaml contents>

SKILL INSTRUCTIONS:
<paste skill file contents>

DOMAIN CONTEXT (if available):
<paste entity.yaml if exists>
<paste api contract yaml if exists>

YOUR TASK:
Execute the skill above for domain: <domain>
Read only what you need. Write forward. Return a TASK RESULT block.

TASK RESULT format:
═══════════════════════════════════════
Status:       COMPLETE | PARTIAL | FAILED
Files:        <list>
Rules found:  <list with confidence>
Issues found: <list>
Feeds into:   <dependent tasks>
═══════════════════════════════════════
```

### Step 4 — Spawn sub-agent

Use the Task tool with:
- subagent_type: general-purpose
- run_in_background: false (wait for result unless parallel)
- isolation: worktree (optional — use if the task writes files)

For PARALLEL: send both Task tool calls in same message.

### Step 5 — Process result

When sub-agent returns TASK RESULT block:
1. Extract `Files:` → log to LAYER_LOG
2. Extract `Rules found:` → note for spec review if new rules
3. Extract `Issues found:` → add to TRACKER if severity ≥ MEDIUM
4. Extract `Feeds into:` → pass as context to next task in chain
5. Do NOT re-read sub-agent's written files — trust the result

### Step 5.5 — Emit completion block (MASTER.md)

After processing the result, ALWAYS output to the user:

If sub-agent returned Status: COMPLETE:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-task <skill> <args>         COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files      <n from result block>
Issues     <from Issues found: in result, or NONE>
Logged     LAYER_LOG · <today>
Next       <from Feeds into: or logical next step>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If sub-agent returned Status: PARTIAL:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-task <skill> <args>         PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done       <completed items>
Skipped    <skipped items + reason>
Issues     <from result block>
Logged     LAYER_LOG · <today>
Next       <what to complete the gap>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If sub-agent returned Status: FAILED:
- Log to LAYER_LOG first (TYPE: ERROR, see MASTER.md (RESPONSE_PROTOCOL merged))
- Then output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-task <skill> <args>         FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error      <from result block>
Cause      <from result block>
Logged     LAYER_LOG (TYPE: ERROR) · <today>
Fix        <exact command to resolve>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For PARALLEL tasks: show one block per task, then a summary:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-task parallel               COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks      2 complete · 0 partial · 0 failed
  [1] <skill-1>: <status> — <files count>
  [2] <skill-2>: <status> — <files count>
Issues     <combined issues from both, or NONE>
Logged     LAYER_LOG · <today>
Next       <next in chain or logical next step>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6 — Chain (if chain mode)

For `cortex task chain <s1> <s2> <s3>`:
- Run s1 → get result
- Append `Feeds into` findings to s2 prompt as: `FINDINGS FROM PRIOR TASK: <findings>`
- Run s2 → get result
- Repeat

---

## Parallel Execution Rules

Read MASTER.md (was: EXECUTION_PROTOCOL.md — merged) Rule 4 before launching parallel tasks.

Safe parallel pairs for Exena:
```
auth + categories          ← safe (no shared schema)
auth + users               ← safe
categories + settings      ← safe
products + cart            ← safe (products read-only in cart context)
reviews + wishlist         ← safe (@@unique different tables)
```

Unsafe pairs:
```
orders + payments          ← unsafe (shared Order state)
cortex-spec + cortex-build ← unsafe (spec version conflict)
```

---

## When cortex-task gives maximum value

| Task | Conversational | Isolated | Gain |
|---|---|---|---|
| Single fix | ✅ fine | overkill | none |
| 1 module build | ✅ fine | slight gain | low |
| 3+ module builds | context rot risk | ✅ optimal | HIGH |
| Full bootstrap (10+ modules) | significant drift | ✅ optimal | VERY HIGH |
| cortex-extract all | manageable | ✅ optimal | HIGH |
| Parallel auth+categories | impossible | ✅ 2x speed | VERY HIGH |

---

## Rollback

If sub-agent returns Status: FAILED:
1. Log failure to LAYER_LOG (TYPE: ANALYSIS, DETAIL: task-failed reason)
2. Do NOT run dependent tasks
3. Fix root cause (missing spec? wrong entity.yaml? schema gap?)
4. Re-run with cortex-task (fresh sub-agent — no memory of failure)

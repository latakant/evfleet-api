╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-sync  |  v10.0  |  TIER: 0  |  BUDGET: LEAN      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Orchestration)                                  ║
║ AUTHORITY     ║ WRITE — closes session, queues next tasks           ║
║ WHEN TO RUN   ║ End of every session (after cert-commit)            ║
║ OUTPUTS       ║ Session record · queued tasks · score updated       ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Sync session state back to the Cortex Orchestrator.
Run this at the end of every session to preserve state for next time.

$ARGUMENTS: [session-id] [--score N] [--decision ALLOW|WARN|BLOCK]

---

## Step 1 — Gather session summary

Before writing anything, construct the session summary:

```
WHAT HAPPENED THIS SESSION:
- [What was built/fixed/reviewed]
- [Key decisions made]
- [Blockers encountered]

FILES CHANGED:
- [list of modified files]

TASKS COMPLETED:
- [list of task IDs if tasks were tracked]

SCORE: [current score if cert-verify was run, else 'unchanged']
```

---

## Step 2 — Check if orchestrator is running

```bash
curl -sf http://127.0.0.1:7391/health
```

If offline: write summary to MEMORY.md manually instead, then stop.

---

## Step 3 — Close the session record

Use session ID from `/cortex-connect` (sess_xxx).
If you don't have it, skip to Step 5.

```bash
curl -sf -X POST http://127.0.0.1:7391/sessions/[SESSION_ID]/end \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "[1-2 sentence summary of what was done]",
    "tasksDone": ["task_id1", "task_id2"],
    "filesChanged": ["src/module/file.ts", "..."],
    "scoreBefore": [score at session start or null],
    "scoreAfter": [score now or null],
    "blockers": ["blocker 1", "blocker 2"]
  }'
```

---

## Step 4 — Record score (if cert-verify was run this session)

```bash
curl -sf -X POST http://127.0.0.1:7391/scores \
  -H "Content-Type: application/json" \
  -d '{
    "score": [N],
    "decision": "[ALLOW|WARN|BLOCK]",
    "breakdown": {"security": 14, "financial": 14, "typeSafety": 14},
    "blockers": [],
    "warnings": [],
    "source": "cortex-verify"
  }'
```

Only run this if the score actually changed or was computed this session.

---

## Step 5 — Queue tasks for next session

For any work that was started but not finished, or identified as next steps:

```bash
curl -sf -X POST http://127.0.0.1:7391/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "title": "[task title]",
        "description": "[what needs to be done]",
        "priority": [1-9],
        "phase": "[Phase N — optional]",
        "blueprintId": "[bp_xxx — if linked to blueprint]"
      }
    ]
  }'
```

Only queue real next-session work. Do NOT queue vague or maybe items.

---

## Step 6 — Mark completed tasks as done

For any tasks from `/cortex-connect` that were completed:

```bash
curl -sf -X POST http://127.0.0.1:7391/tasks/[TASK_ID]/complete \
  -H "Content-Type: application/json" \
  -d '{"notes": "[brief note on what was done]"}'
```

---

## Step 7 — Update blueprint if phase completed

If a blueprint phase was completed this session:

```bash
curl -sf -X PATCH http://127.0.0.1:7391/blueprints/[BP_ID] \
  -H "Content-Type: application/json" \
  -d '{"status": "code_unlocked"}'
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-sync                                COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session         [sess_id] closed
Score           [score]/100 recorded
Tasks done      [N] marked complete
Tasks queued    [N] for next session
Next session    Run /cortex-connect to resume
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

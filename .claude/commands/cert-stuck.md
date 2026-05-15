<!-- Load ai/core/MASTER.md before executing this skill -->
Document a blocker cleanly and produce a handoff brief. STUCK is correct system behavior — never abandon a session without invoking this if the task is unresolved.

$ARGUMENTS

Provide a description of what was being attempted and what blocked progress.

---

## STEP 1 — Capture State

Before logging, record all of the following:

1. **Task** — what was being attempted (task type: BUG / FEATURE / SCHEMA / OTHER)
2. **Attempts** — all attempts made, in order (what each tried and what happened)
3. **Last exact error** — the exact error output or failure state at the point of stopping
4. **Unblock path** — what would allow progress (if known)
5. **Partial files** — any files that are in an incomplete or modified state right now

---

## STEP 2 — Append to FIX_LOG

Append to `ai/fixes/applied/FIX_LOG.md` (append only — never edit existing entries):

```
[YYYY-MM-DD] STUCK — [one line: what task hit a wall]
  Task-Type:    BUG | FEATURE | SCHEMA | OTHER
  Attempts:
    1. [attempt description and result]
    2. [attempt description and result]
  Last-Error:   [exact error output or failure state]
  Blocker-Type: UNCLEAR_ROOT_CAUSE | NEEDS_HUMAN_DECISION | NEEDS_ACCESS | NEEDS_EXTERNAL_SERVICE
  Unblock-Path: [what needs to happen — or UNKNOWN]
  Partial-Files: [list of files in incomplete state — or NONE]
  Status: STUCK
```

---

## STEP 3 — TRACKER + Lifecycle

Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] STUCK — [module or task] — [blocker type] — Unblock: [path or UNKNOWN]
```

Run: `node scripts/lifecycle.js log --action=INSIGHT --module=<module> --detail="STUCK: [task description] — blocked on [blocker-type] — unblock: [path or UNKNOWN]"`

---

## STEP 4 — Handoff Output

```
STUCK STATE LOGGED
══════════════════════════════════════════════
Task:          [description]
Blocker type:  [UNCLEAR_ROOT_CAUSE | NEEDS_HUMAN_DECISION | NEEDS_ACCESS | NEEDS_EXTERNAL_SERVICE]
Logged in:     FIX_LOG ✅   TRACKER ✅   Lifecycle ✅

HANDOFF BRIEF
──────────────────────────────────────────────
Attempted:     [summary of all attempts]
Stopped at:    [last known state]
Try next:      [specific suggestion — or UNKNOWN]
Partial files: [list — or NONE]
──────────────────────────────────────────────
⚠️  If files are partially changed: run git diff before next attempt.
    Consider /cortex-rollback if partial changes should be discarded.
    Start next session with /start to reload full context.
══════════════════════════════════════════════
```

---

## Guardrails

- Never leave a session without invoking this skill if the task is unresolved.
- Never mark any task COMPLETE if it required stopping here.
- STUCK is a handoff, not a failure. The next session will have full context.
- If the blocker is a real code bug → resume with /cortex-bug in the next session.
- If the blocker is an architectural decision → wait. Never guess on ARCH decisions.
- If partial files exist and are risky → strongly recommend /cortex-rollback before leaving.

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-stuck                   PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done       Blocker documented + handoff brief written
Skipped    {original task} — not completed
Issues     {blocker type: BUG | ARCH | UNKNOWN}
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       Next session: /start → resume task from handoff brief
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

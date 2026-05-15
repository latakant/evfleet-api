╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /end  |  v1.0  |  TIER: 1  |  BUDGET: LEAN               ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ REPLACES      ║ /cert-end · /cortex-end (both deprecated)           ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Sync session state to orchestrator               ║
║               ║ - Append TRACKER entry                             ║
║               ║ - Log SESSION_END lifecycle event                  ║
║               ║ - End lifecycle trace                              ║
║               ║ - Surface next session primer                      ║
║ CANNOT        ║ - Write code · Modify source files                 ║
║               ║ - Run git operations                               ║
║ WHEN TO RUN   ║ - Last command of every session                    ║
║               ║ - Before closing Claude Code                       ║
║ PAIRED WITH   ║ /start — run at session open                      ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/end — One command to close any session on any project.

The symmetrical pair to /start. Syncs everything, logs the session,
surfaces exactly where to start next time. Always the same.

---

## STEP 1 — Collect Session Facts

**What was done this session:**
From conversation context — list commits made, features touched, bugs fixed.
If unsure, run:
```bash
git log --oneline --since="8 hours ago"
```

**Files changed:**
```bash
git diff --name-only HEAD~3..HEAD 2>/dev/null | head -20
```

**Open state:**
Read `ai/state/session-state.json` → active_role, pending_pa_reviews.
Read `ai/state/open-issues.json` → count of open issues (if exists).

---

## STEP 2 — Sync to Orchestrator (session close)

```bash
# Step 2a: find the open session
curl -sf http://localhost:7391/sessions/latest --max-time 2
```

Parse the response:
- If session exists AND `endedAt` is null → it's open, close it:
  ```bash
  curl -sf -X POST http://localhost:7391/sessions/[id]/end \
    -H "Content-Type: application/json" \
    -d '{
      "summary":      "[one-line: what was done — not how, what]",
      "tasksDone":    [N],
      "filesChanged": [N],
      "scoreBefore":  [score at session start],
      "scoreAfter":   [score now — from ai/STATUS.md],
      "blockers":     "[any open blockers, or null]"
    }' --max-time 3
  ```
- If no open session → create + close immediately:
  ```bash
  curl -sf -X POST http://localhost:7391/sessions/start \
    -H "Content-Type: application/json" \
    -d '{"type": "claude"}' --max-time 2
  # then close it with the same end call above
  ```

If orchestrator offline → skip silently. TRACKER.md is the local fallback.

**Why this matters:** The session summary written here is what `/start` STEP 3.5 shows next session.
"Last session: fixed payment webhook race condition in exena-api" — that one line is session continuity.

---

## STEP 3 — Append TRACKER

Append one line to `ai/tracker/CORTEX-TRACKER.md` OR `ai/TRACKER.md` (whichever exists):

```
[YYYY-MM-DD] — [what was done] — [N commits] — next: [next action]
```

Keep it one line. Terse. Future sessions read only the last entry.

---

## STEP 4 — Close Session State + Log SESSION_END

```bash
# Close the Cortex session lifecycle (opened by cortex-executor at cert-feature Step 0.5)
node $CORTEX_ROOT/scripts/session-state.js close
```

Parse output:
- `session closed` → state persisted to `ai/state/session-state.json`
- `no active session` → feature was never started (normal for read-only sessions)
- Script not found → skip silently

```bash
node scripts/lifecycle.js log --action=SESSION_END --module=cortex \
  --detail="[summary] · commits=[N] · files=[N]"

node scripts/lifecycle.js trace end
```

If `scripts/lifecycle.js` not found → skip silently.

---

## STEP 5 — Output Close Brief (always same format)

The dominant signal is "what changed + score delta." Warnings (uncommitted work,
score drop) come BEFORE the next-session line — they are blockers to a clean close.

**Clean close:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session closed · [YYYY-MM-DD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done     [what changed — one sentence, what not how]
Commits  [N] · [hash] [message]
Score    [X]/100  [▲ +N | ▼ −N | unchanged]  [ALLOW/WATCH/BLOCK]
Synced   [✅ orchestrator | ⚠️ local only]
─────────────────────────────────────────────────
Next → /start  ·  Pick up: [exact first action next session]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Close with warnings — warnings before the next line:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session closed · [YYYY-MM-DD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done     [what changed]
Commits  [N] · [hash]
Score    [X]/100  ▼ −N  ⚠️ WATCH
─────────────────────────────────────────────────
⚠️  Score dropped — run /cert-score before next session
⚠️  [N] pending approvals — review before next session
─────────────────────────────────────────────────
Next → /start  ·  Pick up: [exact first action]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Rules:
- "Done" = one sentence. What changed. Not how.
- "Pick up" = the exact first action next session — not a topic, an action.
- Score delta: show ▲/▼/unchanged. Always show the gate (ALLOW/WATCH/BLOCK).

---

## IN_PROGRESS Guard (runs before Uncommitted Work Guard)

Before checking git status, check TRACKER for unresolved in-progress work:
```bash
grep -n "IN_PROGRESS" ai/TRACKER.md 2>/dev/null
```

If any `IN_PROGRESS` entries exist:
```
⚠️ In-progress work detected — context not safe to close:
   [list IN_PROGRESS lines]

Run /cert-checkpoint handoff to commit WIP and write HANDOFF.md,
then close. This prevents losing context between sessions.

Run handoff now? → type HANDOFF
Close anyway (work will be lost)? → type CLOSE-UNSAFE
```

- **HANDOFF**: execute `cert-checkpoint handoff` fully, then continue to Uncommitted Work Guard
- **CLOSE-UNSAFE**: skip, note the risk in the close brief, continue

Do not output the close brief until this is resolved.

---

## Uncommitted Work Guard

Before outputting the close brief, check:
```bash
git status --short
```

If modified files exist:
```
⚠️ You have uncommitted changes:
   [list files]

Commit now? → /cert-commit
Skip and close anyway? → type CLOSE
```

Wait for response. Do not close without acknowledging uncommitted work.

---

## What Gets Deprecated

`/cert-end` and `/cortex-end` are deprecated as of v11.2.
`/end` is the single replacement for both.

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Closed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Synced  : [✅ | ⚠️ local]
Logged  : SESSION_END · [date]
Next    : /start → [project]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## MUST-VERIFY (before declaring /end complete)

```
☐ Pre  — IN_PROGRESS guard: "No IN_PROGRESS entries" OR "HANDOFF.md written" OR "CLOSE-UNSAFE acknowledged"
☐ Pre  — Uncommitted work guard: "No uncommitted changes" OR "/cert-commit ran" OR "CLOSE acknowledged"
☐ Step 1  — Session facts collected: at least commit count or "0 commits"
☐ Step 2  — Orchestrator sync: "✅ session closed · id=[sess_*]" OR "⚠️ offline — TRACKER.md fallback used"
☐ Step 3  — TRACKER entry appended: "[YYYY-MM-DD] — [summary] — [N commits] — next: [action]"
☐ Step 4  — SESSION_END logged: "SESSION_END logged" OR "lifecycle not found — skipped"
☐ Step 5  — Close brief rendered: Done · Commits · Score delta · Synced · Next line
```

If IN_PROGRESS guard fires → DO NOT output close brief until HANDOFF or CLOSE-UNSAFE.
If uncommitted work guard fires → DO NOT output close brief until human responds CLOSE or /cert-commit runs.
If Step 2 and Step 3 both fail → session not recorded anywhere. Warn human explicitly.

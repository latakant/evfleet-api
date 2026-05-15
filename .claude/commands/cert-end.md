╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-end  |  v8.0  |  TIER: 5  |  BUDGET: LEAN          ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L9                                             ║
║ AUTHORITY     ║ OBSERVER                                            ║
║ CAN           ║ - Read session-state.json, LAYER_LOG.md, TRACKER.md ║
║               ║ - Append SESSION_END entry to LAYER_LOG.md          ║
║               ║ - Update session-state.json (last_session_date)     ║
║               ║ - Append session summary to ai/TRACKER.md           ║
║ CANNOT        ║ - Modify any source code                            ║
║               ║ - Run git operations                                ║
║               ║ - Create or delete files (only append/update)       ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - Nothing (read + append only)                     ║
║ OUTPUTS       ║ - Session summary · Next session primer             ║
║               ║ - Completion block (COMPLETE)                       ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Close the current session. Log what was done, update session state, surface the next session's starting point.

$ARGUMENTS

---

**STEP 1 — Collect session facts**

Read:
- `ai/state/session-state.json` — what role was active, pending PA reviews
- `ai/TRACKER.md` — last 5 lines (today's entries only)
- `ai/state/open-issues.json` — current open issue count

Run: `git log --oneline --since="midnight" 2>/dev/null | head -10`
This shows commits made during this session.

---

**STEP 2 — Derive session summary**

From what you've read and done this session, fill in:

```
Session date:    [today]
Duration:        [estimate if possible, else "unknown"]
Domains touched: [list modules/domains worked on]
Commits:         [N commits — from git log above, or "0 (no commits)"]
Skills used:     [list skills invoked this session]
Issues closed:   [N — from tracker entries]
Issues opened:   [N — new issues added]
PA reviews:      [N pending from session-state.json]
```

If $ARGUMENTS contains a summary or note, include it verbatim in the log entry.

---

**STEP 3 — Write SESSION_END to LAYER_LOG**

Append this block to `ai/lifecycle/LAYER_LOG.md`:

```
[{ISO timestamp}]
TYPE: SESSION_END
SESSION_DATE: {today YYYY-MM-DD}
DOMAINS_TOUCHED: {comma-separated list}
COMMITS: {N}
SKILLS_USED: {comma-separated list}
ISSUES_CLOSED: {N}
PA_REQUIRED: {YES if pending_pa_reviews > 0, else NO}
DETAIL: {one-sentence summary of what was accomplished}
```

---

**STEP 4 — Update session-state.json**

Write back `ai/state/session-state.json` with:
```json
{
  "session_date": "{today}",
  "last_session_domains": ["{domain1}", "{domain2}"],
  "role_activations_this_session": [],
  "pending_pa_reviews": {carry forward from current value},
  "last_handoff": "{one-sentence: what was done, what's next}"
}
```

---

**STEP 5 — Append to TRACKER.md**

Append one entry to `ai/TRACKER.md`:

```markdown
## {today YYYY-MM-DD} — Session End
- Domains: {list}
- Commits: {N}
- {Key thing accomplished}
- {Key thing accomplished if applicable}
- Open issues: {N total}
```

---

**STEP 6 — Output next session primer**

Print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED — {today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done today
  {bullet: what was accomplished}
  {bullet: if applicable}

Open ({N} issues)
  {top 1-2 open issues by priority}

Next session — start with:
  /start
  {next most logical task, e.g. "then: cortex-build auth"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**COMPLETION**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-end                     COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session     {today}
Commits     {N}
Logged      LAYER_LOG · TRACKER.md · session-state.json
Next        /start  (next session)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

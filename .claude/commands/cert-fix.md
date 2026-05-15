Execute the FIX: protocol — resolving a known issue from the TRACKER or open-issues list.

$ARGUMENTS

FIX: is different from BUG: — the issue is already identified, documented, and has a fix plan.
No diagnosis needed. Go straight to the fix with full context from the tracker.

---

**STEP 1 — Load the issue**
Parse the issue ID from $ARGUMENTS (e.g., ERR-02, TYPE-01, DB-03, QUAL-01).

Read: `ai/state/open-issues.json` — find the issue entry (severity, file, fix instructions)
Read: `ai/STATUS.md` — confirm this issue is still open (not already fixed)
Read: `ai/governance/ENGINEERING_WORKLOAD_PLAN.md` — find the exact code steps if documented

If issue not found in open-issues.json: it may already be fixed. Check `ai/fixes/applied/FIX_LOG.md`.
If already fixed: report the fix date and what was done. Do not re-apply.

---

**STEP 2 — Classify the fix**
From the issue details:
- TRIVIAL (1-3 lines, no schema) → proceed directly
- FEATURE (new logic, new file) → present plan, wait for "OK"
- ARCH (schema change, new module) → present plan, wait for "approved"

---

**STEP 3 — Ground + Read target**

**Run /cert-ground "<issue description>"** before touching any file.

- 🔴 BLOCKED → stop (e.g. file missing, TypeScript baseline broken) — resolve first
- ⚠ REVIEW NEEDED → issue may already be partially fixed or affect different files — check
- ✅ GROUNDED → Ground Truth block is your verified snapshot for the fix session

If cert-ground finds the issue is already fixed → verify with the fix test, close the issue, stop.
Otherwise: use the verified file/symbol snapshot from cert-ground as the base. Do not re-read
files that cert-ground already read — trust the snapshot.

---

**STEP 4 — Apply the fix**
Follow the exact fix instructions from `ENGINEERING_WORKLOAD_PLAN.md` if available.
Otherwise:
- No `any` — use `unknown` + type guards
- Minimal change — only what fixes the issue
- No refactoring of surrounding code
- Apply the enterprise 8-question check to confirm the fix doesn't introduce a new issue

---

**STEP 5 — Verify**
- Run: `npx tsc --noEmit` — 0 errors required
- Run: `npx jest --testPathPattern=<module> --passWithNoTests` — tests pass

---

**STEP 6 — Close the issue**

Update `ai/state/open-issues.json` — mark the issue as resolved (remove it or set status=fixed).
Update `ai/STATUS.md` — remove the issue from the open items list.
Append to `ai/fixes/applied/FIX_LOG.md`:
```
[YYYY-MM-DD] [ISSUE-ID] [module] — [what was fixed] — files: [file:line]
```
Run enterprise checker to confirm score improved:
`node scripts/enterprise-checker.js --check`
Update `ai/state/current-score.json` if score changed.

---

**STEP 7 — Update TRACKER**
Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] FIX [ISSUE-ID] — [module] — [issue description] — CLOSED
```

---

**STEP 8 — Log lifecycle event**
Run: `node scripts/lifecycle.js log --action=BUG_FIXED --module=<module> --detail="[ISSUE-ID] closed: <what was fixed>"`

---

**LAYER LOG — append to `ai/lifecycle/LAYER_LOG.md`:**

```
[<ISO timestamp>]
TYPE: FIX
PROJECT: <exena-api|exena-web|exena-admin>
ROLE: <active_role from ai/state/session-state.json>
LAYER_ORIGIN: <layer where the issue originated>
LAYER_FIXED: <layer where the fix was applied>
LAYERS_TOUCHED: <comma-separated list>
LAYER_VIOLATED: <violation rule name or NONE>
FRONTEND_IMPACT: <NONE|LOW|MEDIUM|HIGH>
PA_REQUIRED: NO
CONTRACT: UNCHANGED
MODULE: <module>
FILES: <files modified>
SYMPTOM: <one-line: HTTP status + what the error looked like>
ROOT_CAUSE: <from open-issues.json or ENGINEERING_WORKLOAD_PLAN.md>
FIX_APPLIED: <one-line: what class of fix solved it>
PREVENTION: <one-line: how to prevent this class of bug>
TIER_USED: N/A
RESOLUTION_TIME: <e.g. 5m|15m|45m>
DETAIL: [ISSUE-ID] closed: <what was fixed>
```

---

---

## Cycle Mode — close the learning loop (add `--cycle` to activate)

After the fix is verified, immediately close the learning loop on the pattern captured in
`ai/learning/pending-patterns.json` without running the full `/cert-learn` 10-step cycle.

**Step C1 — Read what cert-bug captured**
Find the most-recent entry in `pending-patterns.json` (`captured` timestamp).
Note: `root_cause_category`, `module`, `fix_pattern`, `verification.status`.
If `verification.status = FAIL` → skip graduation, output: `⚠️ Fix verification FAIL — pattern flagged unreliable.`

**Step C2 — Check for prior matches**
Count entries in `pending-patterns.json` with same `root_cause_category` + `module`.
Also check `ai/learning/instincts.json` and `scripts/diagnose.js` for the same trigger.

**Step C3 — Act on match result**
- Already in `diagnose.js` → `✅ KNOWN PATTERN — already graduated. No action.`
- In `instincts.json` → increment `confidence +0.1`, `evidence_count +1`, update `last_triggered`
- 1–2 prior matches → add instinct entry with `confidence: 0.4`, `graduated: false`
- 3+ matches AND confidence ≥ 0.8 → run `node scripts/learn.js promote [pattern-id]`
  → Output: `🎓 PATTERN GRADUATED — [id] — future occurrences resolve in ~30s`

**Step C4 — Backlog check**
If `pending-patterns.json` has 5+ unreviewed entries → `⚠️ Run /cert-learn now.`

When to use `--cycle`: any bug that took >5 min to diagnose. Patterns earned through real debugging are the most valuable thing Cortex learns.

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-fix                     COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Issue      {ISSUE-ID} — {module} — CLOSED
Files      {n modified}
Score      {before} → {after} (or unchanged)
Logged     LAYER_LOG (TYPE: FIX) · {date}
Next       npx tsc --noEmit → /cortex-commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If issue not found or already closed:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-fix                     PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done       Issue not found — may already be fixed
Skipped    No code changes made
Issues     Check FIX_LOG.md for prior resolution
Logged     LAYER_LOG · {date}
Next       /cortex-status to verify current score
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

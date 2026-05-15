<!-- Load ai/core/MASTER.md before executing this skill -->
Safely undo a fix. Always confirm with user before executing. Never auto-rollback.

$ARGUMENTS

If $ARGUMENTS contains a FIX-ID, target that specific entry. Otherwise target the most recent FIX entry.

---

## STEP 1 — Identify the Target Fix

Read: `ai/fixes/applied/FIX_LOG.md` — find the most recent fix entry or the entry matching $ARGUMENTS.

Extract and present to the user:

```
ROLLBACK TARGET
══════════════════════════════════════════════
Fix:           [date + one-line description from FIX_LOG]
Files changed: [list from FIX_LOG entry]
Commit hash:   [hash if logged — or "not recorded"]
══════════════════════════════════════════════
Roll this back? Type Y to proceed or N to cancel.
```

**Wait for user confirmation. Do NOT proceed without an explicit Y.**

---

## STEP 2 — Execute Rollback

**If commit hash exists:**
Run: `git revert <hash> --no-commit`
Explain what changes this produces before staging anything.

**If no commit hash but files are known:**
For each file listed in the FIX_LOG entry:
Run: `git checkout HEAD -- <file>`
List each file being restored before running.

**If no git history at all:**
Output:
```
MANUAL ROLLBACK REQUIRED
══════════════════════════════════════════════
No git history found for this fix.
Files that need manual review: [list from FIX_LOG]
Do NOT force any changes — review each file manually.
══════════════════════════════════════════════
```
STOP.

**If merge conflicts appear during revert:**
Output: "MANUAL RESOLUTION REQUIRED — revert produced conflicts. Do not force."
STOP.

---

## STEP 3 — Verify

Run: `npx tsc --noEmit`
Must pass with 0 errors. If errors appear: explain them. Ask user what to do — do NOT auto-fix.

---

## STEP 4 — Append to FIX_LOG

Append to `ai/fixes/applied/FIX_LOG.md` (never edit existing entries):

```
[YYYY-MM-DD] ROLLBACK — [original fix description] — Reason: [user stated reason] — Method: [git revert | manual restore] — Status: ROLLED_BACK
```

---

## STEP 5 — Lifecycle + TRACKER

Run: `node scripts/lifecycle.js log --action=ROLLBACK --module=<module> --detail="Reverted [fix description] — reason: [reason]"`

Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] ROLLBACK — [module] — [what was reverted and why]
```

---

## STEP 6 — Output Summary

```
ROLLBACK COMPLETE
══════════════════════════════════════════════
Reverted:    [fix description]
Files:       [list restored]
Method:      git revert | manual restore
tsc:         ✅ 0 errors
FIX_LOG:     ✅ ROLLBACK entry appended
Lifecycle:   ✅ logged
TRACKER:     ✅ updated
══════════════════════════════════════════════
Next: Run /cortex-bug fresh to diagnose the root cause properly.
      Run git diff before making any new changes.
```

---

## Guardrails

- Never delete or edit existing FIX_LOG entries. Append only.
- Never rollback more than one fix per invocation without per-fix confirmation.
- Merge conflicts → STOP. Never force-resolve.
- "Rollback everything" requests → ask user to specify one fix at a time.
- If rollback itself fails → invoke /cortex-stuck with the blocker details.

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-rollback                COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reverted   {fix description}
Method     git revert {hash} | manual restore
Files      {n files restored}
Logged     LAYER_LOG (TYPE: FIX) + FIX_LOG · {date}
Next       /cortex-bug to diagnose root cause properly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If merge conflict stops the rollback:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-rollback                FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error      Merge conflict — rollback incomplete
Cause      git revert produced conflicts in {files}
Logged     LAYER_LOG (TYPE: ERROR) · {date}
Fix        Resolve conflicts manually → /cortex-stuck to document
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

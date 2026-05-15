╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-checkpoint  |  v1.0  |  TIER: 2  |  BUDGET: LEAN   ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L3                                              ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Run git commands (stash, log, diff)                ║
║               ║ - Read/write .claude/checkpoints.log                 ║
║               ║ - Run tsc + jest on current state                    ║
║ CANNOT        ║ - Modify source files                                ║
║ WHEN TO RUN   ║ - Start of a feature branch                          ║
║               ║ - Between implementation phases                      ║
║               ║ - Before a risky refactor                            ║
║ OUTPUTS       ║ - Named checkpoint · comparison report               ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Named workflow snapshots. Create at phase boundaries so you can
compare state before/after or roll back to a clean point.

$ARGUMENTS

Parse from $ARGUMENTS:
- `create <name>` — create a named checkpoint
- `verify <name>` — compare current state vs checkpoint
- `list` — list all checkpoints with SHA + status

---

## MODE: create

```bash
# 1. Run quick verification
npx tsc --noEmit 2>&1 | head -5
npx jest --no-coverage --passWithNoTests 2>&1 | tail -5

# 2. Record checkpoint
CHECKPOINT_NAME="$1"
SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "$TIMESTAMP | $CHECKPOINT_NAME | $SHA" >> .claude/checkpoints.log

# 3. Optional: create stash or commit
git stash push -m "checkpoint: $CHECKPOINT_NAME" --include-untracked
```

Report:
```
Checkpoint created: <name>
SHA: <short-sha>
TypeScript: PASS / N errors
Tests: X/Y passed
```

---

## MODE: verify

Compare current state against a named checkpoint:

```bash
CHECKPOINT_LINE=$(grep "$CHECKPOINT_NAME" .claude/checkpoints.log | tail -1)
CHECKPOINT_SHA=$(echo $CHECKPOINT_LINE | cut -d'|' -f3 | xargs)

# Files changed since checkpoint
git diff --name-only $CHECKPOINT_SHA HEAD

# Test delta
git stash show $CHECKPOINT_SHA --stat 2>/dev/null
```

Report:
```
CHECKPOINT COMPARISON: <name>
==============================
Checkpoint SHA:   <sha>
Current SHA:      <sha>
Files changed:    N
Tests now:        X passing / Y failing
Types now:        PASS / N errors
Coverage:         X% (was Y%)
```

---

## MODE: list

```bash
cat .claude/checkpoints.log 2>/dev/null || echo "No checkpoints yet"
```

Output each checkpoint with:
- Name, timestamp, SHA
- Status: current (on this SHA), behind (commits exist after), ahead (SHA no longer in history)

---

## MODE: handoff

Run when context is 70%+ or before closing a session with in-flight work.
Flushes all partial state so the next session can resume without guessing.

**STEP 1 — Scan for partial state**
```bash
# Find any IN_PROGRESS entries (bugs started but not committed)
grep -n "IN_PROGRESS" ai/TRACKER.md 2>/dev/null

# Find uncommitted work
git status --short
git stash list | head -5
```

**STEP 2 — Run tsc (must pass before handoff)**
```bash
npx tsc --noEmit 2>&1 | tail -10
```
If errors exist: fix them before proceeding. A handoff with broken types is not safe.

**STEP 3 — Commit all uncommitted work**
```bash
git add -A
git commit -m "wip(handoff): context-limit snapshot — [module or 'session']

Work in progress — not complete. Resume from ai/session/HANDOFF.md.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
If nothing to commit → skip this step.

**STEP 4 — Write HANDOFF.md**

Write `ai/session/HANDOFF.md` (create `ai/session/` dir if needed):

```markdown
# Session Handoff — [YYYY-MM-DD HH:MM UTC]

## Status at handoff
- Git SHA: [git rev-parse --short HEAD]
- Uncommitted at close: [YES/NO — committed in Step 3 if YES]
- TypeScript: [PASS / N errors]

## In-progress work (from TRACKER)
[paste any IN_PROGRESS lines, or "none"]

## What was being worked on
[one paragraph: what was being tested/fixed, where in the flow, what was next]

## Files modified this session
[git diff --name-only HEAD~5..HEAD | head -20]

## Next session: start here
1. Read this file
2. Run: `git log --oneline -5` to see what landed
3. [exact first action — e.g. "continue cert-bug on auth/refresh — fix is in api-client.ts line 112"]
4. Run: `npx tsc --noEmit` to confirm clean state
```

**STEP 5 — Update TRACKER**

If any IN_PROGRESS entries exist in TRACKER, mark them as INCOMPLETE (not lost):
```
[YYYY-MM-DD] INCOMPLETE — [module] — context limit reached mid-fix — resume from ai/session/HANDOFF.md
```
Remove the IN_PROGRESS line for the same module.

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-checkpoint handoff       COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Committed  [SHA] — wip(handoff): [module]
TypeScript PASS
HANDOFF.md ai/session/HANDOFF.md written
Resume     next session → read HANDOFF.md → git log → continue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Safe to close this session.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## TYPICAL WORKFLOW

```
[Start] → /cortex-checkpoint create "feature-start"
   ↓
[Implement Phase 1] → /cortex-checkpoint create "phase-1-done"
   ↓
[Implement Phase 2] → /cortex-checkpoint verify "phase-1-done"
   ↓
[Ready to ship] → /cortex-checkpoint verify "feature-start"
   ↓
/cortex-verify → /cortex-commit
```

---

## COMPLETION

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-checkpoint             COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode        {create/verify/list}
Name        {checkpoint-name}
Result      {checkpoint created / comparison complete}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<!-- Load ai/core/MASTER-v*.md before executing this skill -->
Execute the full BUG: protocol.

$ARGUMENTS

Steps — execute in strict order, do not skip any:

---

**STEP 1 — Load context**
- Read `ai/context/invariants.md` (L1–L5 business invariants)
- Read `ai/context/forbidden.md` (absolute prohibitions)
- Read `ai/fixes/applied/FIX_LOG.md` — has this area been touched before? Is this a regression?

---

**STEP 2 — Diagnose**
- Run: `node scripts/diagnose.js --summary` (recent pattern activity, last 7 days)
- If requestId is in $ARGUMENTS: run `node scripts/diagnose.js --id=<requestId>`
- If date is in $ARGUMENTS: add `--date=YYYY-MM-DD`
- Note: KNOWN (30s resolution) or UNKNOWN (requires investigation)?

---

**STEP 3 — Identify root cause**
- Read the relevant source file(s) for the affected module
- Apply the 8-question enterprise framework:
  1. Money — rupee mutation inside `$transaction`? DB CHECK constraint?
  2. Race conditions — concurrent requests see stale state? Unique constraint as last guard?
  3. Queue — processor re-throws? DLQ exists? Side-effects queued not inlined?
  4. Error mapping — P2002→409, P2025→404? No raw 500s for expected failures?
  5. Security — secrets timing-safe? Rate-limited? Never hardcoded?
  6. Observability — failure logged with context? requestId propagated?
  7. Types — `any` used? Wrong type reaching DB silently?
  8. DB health — index on every FK and high-traffic field?
- Determine path: TRIVIAL (1-3 line, no schema) / FEATURE / ARCH

---

**STEP 3.5 — Structural Safety Check (auto — fires before any code change)**

Using the root cause identified in Step 3 + files already read, output:

```
STRUCTURAL CHECK — [bug id / module / symptom]
────────────────────────────────────────────────────────
Access Control  : [does this fix touch any guard, role, or @Public decorator?
                   Name the specific guard/decorator. Flag if fix weakens auth]
State Integrity : [does the fix touch a multi-table write? is $transaction present?
                   Name the tables. Flag UNGUARDED if transaction missing]
Side Effects    : [could this fix introduce duplicate events, retries, or double-sends?
                   E.g. moving a mailer call — is it still queued?]
Sensitive Data  : [does the fix change a response shape or log statement?
                   Could it now expose tokens, OTPs, or payment secrets?]
Invariant Match : [which CLAUDE.md §2 rule caused this bug or is at risk from the fix?
                   State the rule. Confirm the fix restores — not weakens — it]
────────────────────────────────────────────────────────
Layers touched  : [e.g. L3_DTO · L4_SERVICE · L1_CONTROLLER]
Schema change   : [YES → requires db push | NO]
Risk: LOW ✅  → proceed to Step 4
      MEDIUM ⚠ → proceed, add regression test for this specific risk
      HIGH 🚫  → STOP — explain risk, wait for explicit PROCEED
```

If HIGH → do not write code. Explain the structural risk and wait for human confirmation.

---

**STEP 3.9 — Mark in-progress + score snapshot (crash-safety — mandatory before touching any file)**

First, check for an existing `IN_PROGRESS` for this same module:
```bash
grep "IN_PROGRESS.*\[module\]" ai/TRACKER.md 2>/dev/null
```
If found → **do not create a second IN_PROGRESS**. Instead read the existing line, check `git diff` to see if the previous fix was applied or not:
- `git diff` shows the change → fix was applied but not committed. Jump to Step 7 (update TRACKER) then Step 8.7 (commit).
- `git diff` is clean → fix was not applied. Continue from Step 4 with the existing IN_PROGRESS line as-is.

If NOT found → append to `ai/TRACKER.md` under today's date:
```
[YYYY-MM-DD] IN_PROGRESS — [module] — [one-line: what fix is being applied]
```

Then snapshot score **before** the fix (skip silently if score-diff.js not found):
```bash
node $CORTEX_HOME/scripts/score-diff.js --snapshot "before [module] fix" 2>/dev/null || true
```

**Why this step exists:** If context dies between here and Step 7, the next session opens TRACKER, sees `IN_PROGRESS`, checks `git diff`, and knows exactly where to resume — no duplicate work, no lost context. Step 7 updates this line to `BUG_FIXED`. The score snapshot captures the baseline so the delta is traceable.

Do not skip this step even for trivial fixes. The cost is one line. The recovery value is full.

---

**STEP 4 — Fix**
- Apply the minimal fix only — no cleanup beyond the bug scope
- Never use `any` — use `unknown` + type guards
- Follow: Controller (HTTP only) → Service (business logic) → PrismaService (DB)
- DTOs with class-validator for all new inputs
- Prisma transactions for multi-table mutations

---

**STEP 5 — Verify**
- Run: `npx tsc --noEmit`
- Must pass with 0 errors before continuing. If errors: fix them first.

---

**STEP 6 — Log the fix**
Append to `ai/fixes/applied/FIX_LOG.md`:
```
[YYYY-MM-DD] [module-name] — [what was fixed] — files: [file1.ts, file2.ts]
```

---

**STEP 7 — Update TRACKER + score snapshot**
Update the IN_PROGRESS line written at Step 3.9 — replace it with BUG_FIXED:
```
[YYYY-MM-DD] BUG_FIXED — [module] — [one-line description]
```
(Remove the IN_PROGRESS line for this module — it is now resolved.)

Then snapshot score **after** the fix to capture the delta:
```bash
node $CORTEX_HOME/scripts/score-diff.js --snapshot "BUG_FIXED [module]" 2>/dev/null || true
```

---

**STEP 8 — Log lifecycle event**
Detect active role from file scope:
- Bug in `exena-api/src/` → BACKEND_DEV
- Bug in `exena-web/src/` → FRONTEND_DEV_WEB
- Bug in `exena-admin/src/` → FRONTEND_DEV_ADMIN
- Bug spanning multiple repos → SENIOR_FULLSTACK

Update `ai/state/session-state.json`: set `active_role` = detected role, `session_date`.

Run: `node scripts/lifecycle.js log --action=BUG_FIXED --module=<module> --detail="<what was fixed>" --role=<ROLE>`

---

**STEP 8.5 — Auto-capture pattern (mandatory — never skip)**

If `ai/learning/pending-patterns.json` does not exist, create it now:
```json
{ "pending": [] }
```

Append to the `"pending"` array:
```json
{
  "captured": "<ISO 8601 timestamp>",
  "bug_id": "<module>-<YYYY-MM-DD>",
  "module": "<affected NestJS module name>",
  "root_cause_category": "validation | auth | db-query | state | config | race-condition | type-mismatch | missing-guard | other",
  "symptom": "<one line: HTTP status + what the error looked like>",
  "fix_pattern": "<one line: what class of fix solved it>",
  "verification": {
    "expected": ["<key signal expected in logs/output after fix>"],
    "observed": ["<what actually appeared — from Step 8.6>"],
    "status": "PASS | FAIL | SKIP"
  },
  "watchpoints": ["<area 1 to watch in future>", "<area 2 if any>"],
  "promoted": false
}
```

Output: `PATTERN CAPTURED → pending-patterns.json`
If `pending` array now has > 3 unpromoted entries: output `⚠️ 3+ patterns pending — run /cortex-learn to promote.`

---

**STEP 8.6 — Verify the fix + extract watchpoints (mandatory)**

This is what separates a trusted pattern from a guess.

**Verification:**
Look at the actual output, logs, or test result after the fix was applied.
- What signals confirm the fix worked? (e.g. "200 OK", "Redis connected", "test passed", "no tsc errors")
- What did you actually observe?
- Set `status`:
  - `PASS` — observed matches expected
  - `FAIL` — fix did not resolve the issue (go back to Step 3)
  - `SKIP` — no observable signal available (log it honestly)

**Watchpoints:**
From this bug, what areas of this module are risky going forward?
These are forward-looking risk indicators — things to check first next time this area is touched.
Examples: "Redis availability on startup", "route ordering in controller", "DTO missing new field"

If a new watchpoint is worth persisting:
- Append to `ai/memory/watchpoints.md` using the format already in that file
- ID: `WP-<next-number>` · module · risk (HIGH/MEDIUM/LOW) · what to check first

Run: `node scripts/lifecycle.js log --action=BUG_FIXED --module=<module> --detail="<fix>" --category=VERIFY --verdict=<PASS|FAIL>`

---

**LAYER LOG — append to `ai/lifecycle/LAYER_LOG.md`:**

```
[<ISO timestamp>]
TYPE: FIX
PROJECT: <exena-api|exena-web|exena-admin — from file scope>
ROLE: <active_role from ai/state/session-state.json>
LAYER_ORIGIN: <layer where the bug originated, e.g. L4_SERVICE>
LAYER_FIXED: <layer where the fix was applied>
LAYERS_TOUCHED: <comma-separated, e.g. L3_DTO, L4_SERVICE>
LAYER_VIOLATED: <violation rule name from LAYER_LOG.md quick reference, or NONE>
FRONTEND_IMPACT: <NONE|LOW|MEDIUM|HIGH>
PA_REQUIRED: NO
CONTRACT: UNCHANGED
MODULE: <module>
FILES: <files modified>
SYMPTOM: <one-line: HTTP status + what the error looked like>
ROOT_CAUSE: <one-line: root cause category + description>
FIX_APPLIED: <one-line: what class of fix solved it>
PREVENTION: <one-line: how to prevent this class of bug>
TIER_USED: <Tier1|Tier2|Tier3>
RESOLUTION_TIME: <e.g. 5m|15m|45m>
DETAIL: <one-line description of what was fixed>
```

---

**STEP 8.7 — Micro-commit (crash-safety — mandatory)**

Commit this fix immediately. Do not batch with other fixes.

```bash
git add -p   # stage only files changed by this fix
git commit -m "fix(<module>): <one-line description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**Why:** Each committed fix is a recovery point. If context dies during a multi-bug session, `git log --oneline` in the next session shows exactly what landed. Uncommitted fixes are invisible to the next session.

If `git add -p` is ambiguous (many unrelated changes staged), use `git add <specific-files>` instead.

---

**STEP 9 — Pattern intelligence check**
- Was diagnose.js result KNOWN or UNKNOWN?
- If UNKNOWN: run `node scripts/learn.js analyze`
- If this error class has 2+ occurrences: flag it in `ai/learning/pattern-proposals.md` for promotion
- Run: `node scripts/learn.js health` to check if this module is trending degrading

---

---

## HUMAN MODE (fires if `--human` in arguments)

After fix is complete, output a plain English summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG FIXED — Plain English Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What was broken:   [one sentence — what users would have experienced]
Why it happened:   [one sentence — root cause in plain English]
What was fixed:    [one sentence — what changed]
Risk if not fixed: [what would have broken in production]
Score impact:      [score before] → [score after]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Write to: terminal + `ai/reports/human-summary.md`

---

## MUST-VERIFY (hard gate — fill ALL before outputting COMPLETE)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUST-VERIFY — fill every line before COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ TRACKER.md   IN_PROGRESS → BUG_FIXED  (paste line)
☐ tsc          npx tsc --noEmit exit 0  (paste: "0 errors")
☐ jest         module tests pass        (paste: "N passed")
☐ pattern      pending-patterns.json entry appended (paste id)
☐ FIX_LOG.md   entry appended          (paste: date + module)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All 5 filled → COMPLETE
Any ☐ unchecked → INCOMPLETE (resume from first unchecked item)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Completion block

COMPLETE (all 5 verified):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-bug                       COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files      {n modified}
Pattern    KNOWN: {name} | UNKNOWN → pending-patterns.json | NEW-PROPOSAL
Verified   tsc ✅ · jest ✅ · TRACKER ✅ · pattern ✅ · FIX_LOG ✅
Logged     LAYER_LOG (TYPE: FIX) · {date}
Next       /cert-commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

INCOMPLETE (one or more items not verified):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-bug                     INCOMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Still needed  {list unchecked items}
Resume        complete the listed items then re-output this block
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If TypeScript check fails before fix is applied:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-bug                       FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error      TypeScript errors — fix blocked
Cause      {tsc error summary}
Logged     LAYER_LOG (TYPE: ERROR) · {date}
Fix        npx tsc --noEmit → fix all errors → re-run /cortex-bug
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

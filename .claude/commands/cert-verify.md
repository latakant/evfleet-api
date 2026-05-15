╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-verify  |  v1.1  |  TIER: 3  |  BUDGET: LEAN        ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L3 · L4 · L7                                   ║
║ AUTHORITY     ║ OBSERVER + WRITE (STATUS.md only)                   ║
║ CAN           ║ - Run: tsc --noEmit                                  ║
║               ║ - Run: jest on affected files only                   ║
║               ║ - Run: secret scan on changed files                  ║
║               ║ - Read: git diff, invariants                         ║
║               ║ - Write: ai/STATUS.md (metrics sync only)            ║
║ CANNOT        ║ - Modify any source files                            ║
║               ║ - Commit or push                                     ║
║ WHEN TO RUN   ║ - After every cortex-build / cortex-fix / cortex-feature ║
║               ║ - Before every cortex-commit                         ║
║               ║ - Before cortex-prelaunch                            ║
║ OUTPUTS       ║ - PASS / FAIL per phase · actionable error list      ║
║               ║ - STATUS.md test counts synced (always)              ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Post-build verification gate. Run after every code change to catch errors
before they compound. 7 phases — stop at first FAIL, fix it, re-run.

HARD RULE — NO LOOSE ENDS:
  Verified numbers must propagate to ALL reference points in the same
  operation. Phase 6 is non-negotiable — it runs even if other phases warn.

$ARGUMENTS

Parse from $ARGUMENTS:
- `fast` — skip test phase (tsc + secrets + diff only)
- `full` — run full test suite instead of affected files only

---

## MODEL HINT

This skill is read-only and runs shell commands. Use **Haiku** if routing
is available — verification doesn't need Sonnet-level reasoning.

---

## PHASE 0 — Score Gate (always run first)

Read current score:
```bash
cat ai/state/current-score.json 2>/dev/null | grep '"overall"' | head -1
```

Read baseline (score at last commit):
```bash
cat ai/state/score-baseline.json 2>/dev/null | grep '"overall"' | head -1
```

Apply 3-tier gate in order:

| Gate | Condition | Decision |
|------|-----------|----------|
| FLOOR | current score < 80 | BLOCK — project health too low for any work |
| REGRESSION | dropped > 5 pts from baseline | BLOCK — recent changes degraded quality, fix before proceeding |
| FEATURE UNLOCK | current score < 95 | WARN — new features blocked (fixes, tests, and refactors OK) |

If `ai/state/current-score.json` does not exist → skip this phase silently (first run).
If `ai/state/score-baseline.json` does not exist → skip regression check only.

Output:
```
Phase 0  Score Gate    PASS ✔  [score]/100  (floor OK · no regression · feature-unlocked)
Phase 0  Score Gate    WARN ⚠  [score]/100  (< 95 — new features blocked)
Phase 0  Score Gate    FAIL ✖  [score]/100  BLOCK reason: [floor/regression]
```

If BLOCK → stop. Output:
```
SCORE GATE BLOCKED
  Score:     [current]/100  (baseline: [baseline]/100)
  Reason:    [FLOOR < 80 | REGRESSION: dropped [N] pts]
  Required:  Fix score issues first → run /cert-score to diagnose
  Override:  Not available — score gate is non-negotiable
```

---

## PHASE 0.5 — Critical env vars (always run)

Check that the critical env vars required to start the app are present. Read the project's `.env.example` or the CLAUDE.md env section for the required list.

```bash
# Check if .env file exists and contains critical vars
cat .env 2>/dev/null | grep -c "DATABASE_URL\|JWT_SECRET\|NODE_ENV" || echo "0"
```

Apply this rule:
- If `.env` does not exist → WARN (may be CI/Docker-injected — not a hard fail)
- If `.env` exists but critical vars are missing (empty or absent) → FAIL

For Cortex-governed projects, the critical vars are listed in `ai/pre-delivery-checklist.md` if it exists, otherwise use the CLAUDE.md env section.

Output:
```
Phase 0.5  Env Vars      PASS ✔  [N]/[N] critical vars present
Phase 0.5  Env Vars      WARN ⚠  .env not found — assuming CI injection
Phase 0.5  Env Vars      FAIL ✖  [N] missing: DATABASE_URL · JWT_SECRET
```

---

## PHASE 0.3 — Language Rules Scan (TypeScript projects only · skip if `fast` flag)

Grep changed TypeScript files for language-level violations from `adapters/language/typescript/core.md`.
Catches patterns tsc won't catch (any usage, missing return types, unsafe casts).

```bash
# Get changed TS/TSX files (not specs, not node_modules)
git diff --name-only HEAD 2>/dev/null | grep -E "\.(ts|tsx)$" | grep -v "\.spec\." | grep -v "node_modules"
```

For each file returned, run:
```bash
grep -n ": any"    <file> | grep -v "//.*any"   # TS-001 — any in signatures
grep -n "as any"   <file>                        # TS-002 — unsafe casts
grep -n "catch (e)" <file> | grep -v ": unknown" # TS-006 — untyped catch
```

Output format per violation:
```
Phase 0.3  Language     WARN ⚠  TS-001  src/orders/orders.service.ts:45  `: any` in signature
```

- This phase is always **WARN** — never FAIL (advisory, not blocking)
- 0 violations → `Phase 0.3  Language     PASS ✔  no language violations in changed files`
- Skip entirely if `fast` flag passed or no TypeScript files changed

---

## PHASE 1 — TypeScript (always run)

```bash
npx tsc --noEmit 2>&1
```

- PASS: zero errors, exit 0
- FAIL: list every error with file:line. Stop here. Fix before continuing.

---

## PHASE 1B — Lint (skip if `fast` flag)

```bash
npx eslint . --ext .ts,.tsx --max-warnings 0 2>&1 | tail -20
```

- PASS: zero errors, zero warnings (or eslint not configured — skip silently)
- FAIL: list every error with file:line. Stop. Fix before continuing.
- SKIP condition: no `.eslintrc*` or `eslint.config.*` in project root → skip silently, log `no eslint config found`

Output:
```
Phase 1B  Lint          ✔  [N] files clean (0 warnings)
Phase 1B  Lint          ✖  [N] errors — fix before committing
Phase 1B  Lint          —  skipped (no eslint config)
```

---

## PHASE 2 — Affected tests (skip if `fast` flag)

Get changed files:
```bash
git diff --name-only HEAD 2>/dev/null
```

**Branch check — auto-upgrade to full on main/master:**
```bash
git rev-parse --abbrev-ref HEAD 2>/dev/null
```
If branch is `main` or `master` → treat as if `full` flag was passed.
Reason: main-branch merges must verify the full suite, not just the changed files.

Map changed source files to test files:
- `src/modules/auth/auth.service.ts` → `src/modules/auth/auth.service.spec.ts`
- `src/modules/orders/*.ts` → `src/modules/orders/*.spec.ts`
- If no matching spec file exists → **FAIL** with:
  ```
  Phase 2  Tests  ✖  MISSING TEST — src/modules/<module>/<file>.ts has no .spec.ts
    This endpoint/service has no test coverage.
    Required: write at least one unit test before committing.
    Waiver:   add `// TEST-EXEMPT: <reason>` comment in the source file to skip this check.
  ```
  **Do not silently skip untested code.** The absence of a test file is itself a failure.

Run affected tests only (or full suite on main/master or `full` flag):
```bash
# Affected only
npx jest --testPathPattern="<affected-module>" --no-coverage 2>&1 | tail -20

# Full suite
npx jest --no-coverage 2>&1 | tail -20
```

- PASS: 0 failures
- FAIL: list failing tests with error messages. Fix before continuing.

---

## PHASE 3 — Security scan (always run)

**3.1 — Secret scan (changed files only):**
```bash
git diff --name-only HEAD | xargs grep -l "sk-ant-\|sk-\|AIza\|AKIA" 2>/dev/null
git diff --name-only HEAD | xargs grep -lE "(apiKey|secret|password)\s*=\s*['\"][^$'\"]{8,}" 2>/dev/null
```

- PASS: no matches
- FAIL: list files + line numbers. HARD STOP — do not proceed. Run `/cortex-secrets`.

**3.2 — Dangerous code patterns (changed files only):**
```bash
git diff --name-only HEAD | xargs grep -lE "eval\(|innerHTML\s*=|dangerouslySetInnerHTML|\\\$queryRaw\`?.*\+.*\`?\|\\\$executeRaw\`?.*\+.*\`?" 2>/dev/null
```

- `eval(` → FAIL (code injection vector)
- `innerHTML =` → WARN (XSS risk — use textContent or sanitize)
- `dangerouslySetInnerHTML` → WARN (XSS risk — ensure content is sanitized)
- `$queryRaw` / `$executeRaw` with string concat → FAIL (SQL injection)

**3.3 — Dependency audit (run if package.json or package-lock.json changed):**
```bash
git diff --name-only HEAD | grep -q "package.*json" && npm audit --audit-level=high 2>&1 | tail -10 || echo "package.json unchanged — skip"
```

- PASS: 0 critical/high vulnerabilities (or package.json unchanged)
- WARN: moderate vulnerabilities only → note them, do not block
- FAIL: critical or high vulnerabilities found → list them. HARD STOP.

Output:
```
Phase 3  Security       ✔  secrets clean · patterns clean · audit clean
Phase 3  Security       ⚠  [N] innerHTML usages — ensure sanitized
Phase 3  Security       ✖  [reason] — HARD STOP
```

---

## PHASE 4 — Invariant spot-check (always run)

Read the Quick Reference block from `ai/memory/INVARIANT_MEMORY.md` (if present)
or from the project's equivalent invariant file.

For each changed file, verify the relevant invariant still holds:

| Changed module | Invariant to check |
|---|---|
| `orders/` `payments/` `coupons/` | `prisma.$transaction` wraps multi-table writes |
| `payments/` controller | `createHmac` present for webhook verification |
| Any `*.controller.ts` | No direct `prisma.` calls — must go through service |
| Any service | No `any` type returned from DB queries |

**PAT-013 — Service Contract Violation scan (runs on ALL changed `*.service.ts` files in frontend):**

NestJS returns `{ success, data: T, message }`. Axios gives `response.data` = that envelope.
A frontend service that does `const { data } = await apiClient.get(...)` has `data` = the envelope.
`return data` ships the envelope to the UI. `return data.data` ships the actual entity.

```bash
# Find frontend service files changed in this diff
git diff --name-only HEAD | grep -E "services/.*\.service\.(ts|js)$" | grep -v "spec\."

# In each matched file, find return data; that is NOT return data.data
grep -n "return data;" <file> | grep -v "return data\.data"
```

For each hit found:
```
⚠ PAT-013 — Service Contract Violation
  File:    <file>:L<N>
  Found:   return data;
  Risk:    Returns Axios response envelope {success, data, message} — not the entity
  Fix:     return data.data;  (non-paginated)
         OR return data.data  (paginated — shape: {data:[], meta:{}})
  Exempt:  Only if return type is explicitly typed as the raw Axios response shape
```

This is a WARN by default. Escalate to FAIL if the file touches payments, orders, or auth.

Method: `grep` the changed files for the required pattern.

**Execution Refusal Contract (Cortex repo — always check when skills/do.md or skills/fix.md changed):**

```bash
grep -l "HARD RULE" skills/do.md skills/fix.md 2>/dev/null
grep -l "DO NOT ROUTE" skills/do.md skills/fix.md 2>/dev/null
```

Both markers must be present in both files. If either is missing:
```
INVARIANT VIOLATED — Execution Refusal Contract
  File:    [skills/do.md | skills/fix.md]
  Missing: ["HARD RULE" | "DO NOT ROUTE"]
  Meaning: Step 0 Execution Refusal Gate has been softened or removed.
  Action:  Restore the gate before committing. This is a governance invariant.
```

This is how progressive softening is caught before it ships.

- PASS: all relevant invariants found in changed code
- FAIL: list which invariant is missing and in which file. Fix before committing.

---

## PHASE 5 — Diff review (always run)

---

## PHASE 6 — Metrics Sync (always run — even if phases 1–5 warn)

**Purpose:** Verified numbers must never exist in only one place.
STATUS.md is the single source of truth. All reports read from it — they never hold their own counts.

### Step 6.1 — Get real test counts (run BOTH suites, always both)

```bash
# Unit / integration
npx jest --no-coverage --forceExit 2>&1 | grep "^Tests:"

# E2E (only if jest-e2e.config.js exists)
npx jest --config test/jest-e2e.config.js --no-coverage --forceExit 2>&1 | grep "^Tests:"
```

Record:
- `unit_total` — number after "Tests:" from first run
- `e2e_total`  — number after "Tests:" from second run (0 if no e2e config)
- `grand_total` = unit_total + e2e_total

### Step 6.2 — Sync to STATUS.md

Update the Test Coverage table in `ai/STATUS.md`:

```
| exena-api | {unit_total} unit ({N} suites) + {e2e_total} E2E ({N} suites) = {grand_total} total | ✅ DB-live verified {today} |
```

**HARD RULE:** Only write numbers you just ran and read from terminal output.
Never copy numbers from memory, previous reports, or previous sessions.

### Step 6.3 — Check downstream references

Scan for any file that holds a test count:
```bash
grep -rl "passing\|tests\|assertions\|test suites" ai/ *.md 2>/dev/null | grep -v STATUS.md
```

For each file found: verify its count matches STATUS.md.
If it doesn't → update it now. Do not leave the session with stale counts anywhere.

Output:
```
Phase 6  Metrics Sync   PASS ✔  unit={N} · e2e={N} · total={N} · STATUS.md updated
Phase 6  Metrics Sync   WARN ⚠  {file} count stale → updated
Phase 6  Metrics Sync   FAIL ✖  Could not run test suite — manual count required
```

---

```bash
git diff --stat HEAD 2>/dev/null
git diff HEAD 2>/dev/null | head -100
```

Check for:
- [ ] Files changed that weren't expected (scope creep)
- [ ] `console.log` / `console.error` left in source (not test files)
- [ ] TODO / FIXME / HACK comments introduced
- [ ] Commented-out code blocks

For each issue found: flag it. These are warnings, not failures (unless console.log in production path).

---

## OUTPUT FORMAT

**CLEAN path** — verdict on line 1, phases below:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLEAN ✔  {N}/{N} phases · ready to commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 0  Score Gate    ✔  {score}/100 · ALLOW
Phase 0.5 Env Vars    ✔  {N}/{N} critical vars present
Phase 1  TypeScript    ✔  {N} files checked
Phase 1B Lint         ✔  {N} files clean
Phase 2  Tests         ✔  {N}/{N} passing
Phase 3  Security      ✔  secrets · patterns · audit clean
Phase 4  Invariants    ✔  {N}/{N} checked
Phase 5  Diff review   ✔  no issues
Phase 6  Metrics Sync  ✔  unit={N} · e2e={N} · STATUS.md synced
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next → /cert-commit
```

**FAIL path** — blocked output leads with the failure:
```
╔══════════════════════════════════════════════╗
║  ✖  BLOCKED — {phase name}: {reason}         ║
╚══════════════════════════════════════════════╝

  {specific error · file:line}
  {second error if any}

Fix this first. Re-run /cert-verify after.
─────────────────────────────────────────────
Phase 0  Score Gate    ✔  {score}/100
Phase 1  TypeScript    ✖  {N} errors        ← failing phase
Phase 2  Tests         —  skipped
...
```

**WARN path** (phases pass, non-blocking issues):
```
CLEAN ✔  {N}/{N} phases · 1 warning
─────────────────────────────────────────────
Phase 5  Diff review   ⚠️  {N} console.log in modified files
         → remove before shipping to production
─────────────────────────────────────────────
Next → /cert-commit  (or fix warning first)
```

**SCORE GATE BLOCKED:**
```
╔══════════════════════════════════════════════╗
║  🚫  SCORE GATE — cannot proceed             ║
╚══════════════════════════════════════════════╝

  Score:    {current}/100  (baseline: {baseline}/100)
  Reason:   {FLOOR < 80 | REGRESSION: dropped {N} pts}

Fix: /cert-score to diagnose → fix issues → re-run
```

---

## DECISION SUMMARY (always append after OUTPUT FORMAT — CLEAN path only)

After a CLEAN or WARN result, append this block. Generate the content from the
actual verification results above — never use generic placeholder text.

```
────────────────────────────────────────────
DECISION SUMMARY
────────────────────────────────────────────
Why valid:
  · {specific reason 1 — e.g. "all 240 tests pass including payment webhook path"}
  · {specific reason 2 — e.g. "no type errors in changed modules"}
  · {1–3 bullets max — only what actually matters for this diff}

What could break:
  · {real risk 1 specific to the current diff — e.g. "cart context not covered by E2E"}
  · {real risk 2 if any — e.g. "DB migration not tested against prod schema"}
  · {omit if nothing credible — do not fabricate risks}

Watchpoints:
  · {what to monitor after deploy — e.g. "Razorpay webhook latency under load"}
  · {omit if clean and no gaps}

Confidence:    HIGH | MEDIUM | LOW
  → HIGH:   full test coverage of changed paths + E2E green
  → MEDIUM: unit tests pass but changed path has no E2E coverage
  → LOW:    tests pass but significant untested surface in this diff

Verdict:       READY | WATCH | BLOCK
  → READY:  all phases CLEAN, confidence HIGH or MEDIUM, no watchpoints
  → WATCH:  CLEAN but confidence LOW or watchpoints present
  → BLOCK:  any phase FAIL (this block should not appear in FAIL path)
────────────────────────────────────────────
```

**Rules for generating this block:**
- Content must be specific to the current diff — not copied from a template
- "Why valid" = what the passing phases actually proved for *this* change
- "What could break" = real untested surfaces in *this* diff, not generic risks
- Omit a field entirely if there is nothing honest to say
- Confidence and Verdict must be consistent with each other

---

## BUSINESS RULES CHECK (fires automatically if ai/context/business-rules.md exists)

```bash
cat ai/context/business-rules.md 2>/dev/null
```

If file exists: read the modules changed in this diff (from `git diff --name-only`).
Find all rules where `module:` matches a changed module.
For each matching rule:

```
RULE CHECK — BL-XX · [module] · [BLOCK|WARN]
  Rule:    [description from business-rules.md]
  In plain English: [human: field from business-rules.md]
  Status:  ✅ Not affected by this diff  |  ⚠️ Potentially affected — review manually
```

If severity = BLOCK and rule is violated → add to FAIL findings.
If severity = WARN and rule is affected → add to WATCH findings.
If no business-rules.md → skip silently.

---

## HUMAN MODE (fires if `--human` in arguments)

After all phases complete, translate findings to plain English using
`skills/common/human-mode.md` protocol.

Write to: terminal + `ai/reports/human-summary.md`

---

## MUST-VERIFY (before declaring /cert-verify complete)

```
☐ Phase 0   — Score read: "[X]/100 · [ALLOW|WATCH|BLOCK]" (BLOCK = stop here)
☐ Phase 0.3 — Language scan run: "[N] TS violations found" OR "skipped (fast flag or non-TS)"
☐ Phase 0.5 — Env vars checked: "[N] missing vars found" OR "all required vars present"
☐ Phase 1   — tsc output shown: "0 errors" OR list of errors
☐ Phase 2   — Test counts shown: "[N] unit · [N] E2E"
☐ Phase 3   — Security scan: "CLEAN" OR list of findings
☐ Phase 4   — Diff reviewed: at least one sentence about what changed
☐ Phase 6   — STATUS.md synced: "metrics synced" OR "no STATUS.md found"
☐ Final     — PASS/WATCH/FAIL verdict rendered with confidence score
```

If Phase 1 shows errors → STOP. Do not proceed to cert-commit.
If Phase 0 is BLOCK → STOP immediately.

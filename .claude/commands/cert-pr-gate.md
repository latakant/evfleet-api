╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-pr-gate  |  v1.0  |  TIER: 1  |  BUDGET: LEAN       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L3 (Contract) · L7 (Impl) · L8 (Runtime)            ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Run tsc --noEmit                                   ║
║               ║ - Run jest --passWithNoTests                         ║
║               ║ - Read ai/state/current-score.json                  ║
║               ║ - Post verdict as PR comment (via GitHub Action)    ║
║ CANNOT        ║ - Modify source files                                ║
║               ║ - Block merges (advisory only in v1.0)              ║
║               ║ - Access .env values                                 ║
║ WHEN TO RUN   ║ - Automatically on every PR (GitHub Action)         ║
║               ║ - Manually: /cert-pr-gate before pushing a branch   ║
║ OUTPUTS       ║ - PR comment with PASS/WARN/FAIL verdict             ║
║               ║ - Exit code 0 (PASS/WARN) or 1 (FAIL) for CI       ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-pr-gate — Automated quality gate on every pull request.

Runs at merge time, not just at commit time. Closes the session→merge gap:
a developer can pass /cert-verify locally but regressions can still land
if another session introduced a conflict. This gate runs clean on the full
branch, not just local state.

v1.0 is advisory (non-blocking). All checks run, verdict posted as PR comment.
Promote to blocking (exit 1 on FAIL) after 2+ weeks of false-positive monitoring.

$ARGUMENTS

Parse from $ARGUMENTS:
- `--strict` → exit 1 on WARN as well as FAIL (blocking mode)
- `--skip-tests` → skip jest (for PRs touching only docs/config)
- `--report` → output full report to stdout (for local use)

---

## STEP 1 — TypeScript check

```bash
npx tsc --noEmit 2>&1
```

- PASS: exit 0, 0 errors
- WARN: exit 0 but deprecation warnings present
- FAIL: exit non-0, type errors present → list first 10 errors

---

## STEP 2 — Test suite

```bash
npx jest --passWithNoTests --forceExit --silent 2>&1 | tail -20
```

- PASS: all tests pass
- WARN: tests pass, coverage dropped > 5% from last run
- FAIL: test failures → list failing test names

Skip if `--skip-tests` flag present. Note skip in verdict.

---

## STEP 3 — Governance score

Read `ai/state/current-score.json` → `enterpriseScore`.

- PASS: score ≥ 95
- WARN: score 85–94
- FAIL: score < 85 → list which domains are below threshold

If file does not exist: WARN (score not tracked for this project yet).

---

## STEP 4 — Secret scan

```bash
grep -r "sk-ant-\|AIza\|AKIA" src/ --include="*.ts" -l 2>/dev/null
grep -rE "(apiKey|secret|password)\s*=\s*['\"][^$'\"]{8,}" src/ --include="*.ts" -l 2>/dev/null
```

- PASS: no matches
- FAIL: list files → always FAIL, never WARN (secrets are never advisory)

---

## STEP 5 — Compile verdict

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX PR GATE — [repo-name] · [branch] → [base]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TypeScript   [PASS ✅ | WARN ⚠️ | FAIL ❌]   [detail]
  Tests        [PASS ✅ | WARN ⚠️ | FAIL ❌]   [N passed · N failed · SKIP]
  Score        [PASS ✅ | WARN ⚠️ | FAIL ❌]   [N/100]
  Secrets      [PASS ✅ | FAIL ❌]              [files or "clean"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT: [PASS ✅ | WARN ⚠️ | FAIL ❌]
Mode   : ADVISORY (v1.0 — non-blocking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Verdict rules:
- Any FAIL → overall FAIL
- Any WARN, no FAIL → overall WARN
- All PASS → overall PASS

---

## STEP 6 — Post or output

**When running as GitHub Action (default):**
Post verdict as PR comment via `gh pr comment`.

**When running locally (`--report` flag):**
Print verdict to stdout. Exit 0 on PASS/WARN, exit 1 on FAIL.

**When running with `--strict`:**
Exit 1 on WARN as well as FAIL.

---

## MUST-VERIFY

```
☐ Step 1 — TypeScript verdict recorded (PASS/WARN/FAIL)
☐ Step 2 — Test verdict recorded (PASS/WARN/FAIL/SKIP)
☐ Step 3 — Score verdict recorded (PASS/WARN/FAIL)
☐ Step 4 — Secret scan verdict recorded (PASS/FAIL)
☐ Step 5 — Overall verdict computed
☐ Step 6 — Verdict posted (PR comment) or printed (--report)
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS   : COMPLETE
Skill    : /cert-pr-gate
Verdict  : [PASS ✅ | WARN ⚠️ | FAIL ❌]
Checks   : TypeScript · Tests · Score · Secrets
Mode     : ADVISORY
Next     : Address any FAIL items before merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

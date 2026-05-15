╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-qa-report  |  v1.0  |  TIER: 2  |  BUDGET: LEAN  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ SERVICE       ║ SERVICE 4 — QA / TESTING (closing gate)            ║
║ AUTHORITY     ║ ANALYST                                             ║
║ CAN           ║ - Read test output + cert-verify score             ║
║               ║ - Read ai/state/qa-state.json                      ║
║               ║ - Read ai/qa/QA-PLAN-[date].md                    ║
║               ║ - Produce client-readable QA report                ║
║               ║ - Set verdict: PASS → cert-staging | FAIL → fix   ║
║ CANNOT        ║ - Fix failing tests                                ║
║               ║ - Modify source files                              ║
║ REQUIRES      ║ - /cortex-qa-start must have run (qa-state.json)  ║
║ OUTPUTS       ║ - ai/reports/QA-REPORT-[date].md                  ║
║ FEEDS         ║ - cert-staging (if PASS)                          ║
║               ║ - cert-bug (if FAIL — targeted fix cycle)         ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Closes the QA service loop. Run after all tests have been executed.
Produces a client-readable report. Routes to staging or bug fix.

$ARGUMENTS

---

## STEP 1 — Load QA state

Read `ai/state/qa-state.json`.

If missing → STOP:
```
🚫 No QA state found.
   Run /cortex-qa-start first to generate a test plan.
```

Extract: planFile, totalCases, sprint, date.

Read the QA plan file referenced in qa-state.json.
Count: checked cases (passing) vs unchecked cases (not yet run or failing).

---

## STEP 2 — Read test results

Run:
```bash
npm test -- --json 2>/dev/null | tail -5
```

Or read the most recent test output from `ai/qa/test-output-[date].txt` if stored.

Extract:
- Unit tests: [N] passing · [N] failing
- E2E tests: [N] passing · [N] failing · [N] skipped
- Coverage: [X]% overall

If test runner not available → ask human to provide results manually.

---

## STEP 3 — Read non-functional results

Check if cert-security was run recently:
```bash
git log --oneline -20 | grep "cert-security\|security"
```

Check cert-score output from STATUS.md.

Extract:
- Security: PASS/FAIL (from cert-security output or last known run)
- Score: [N]/100
- TypeScript: `npx tsc --noEmit` — PASS/FAIL

---

## STEP 4 — Compute verdict

```
PASS verdict requires ALL of:
  ✅ P1 test cases: 100% passing (zero P1 failures)
  ✅ Unit tests: 0 failing
  ✅ E2E tests: 0 failing (skipped OK)
  ✅ Coverage: ≥ 80%
  ✅ TypeScript: no errors
  ✅ Security: 0 critical findings (cert-security)
  ✅ Score: ≥ 95/100

WATCH verdict (proceed with caveats):
  ⚠️ P2/P3 cases failing (not P1)
  ⚠️ Coverage 70–79%
  ⚠️ 1–2 non-critical security findings

FAIL verdict (do not proceed):
  🚫 Any P1 case failing
  🚫 Any unit or E2E test failing
  🚫 TypeScript errors
  🚫 Critical security finding
  🚫 Score < 90
```

---

## STEP 5 — Write QA report

Write `ai/reports/QA-REPORT-[date].md`:

```markdown
# QA REPORT — [project name] · [date]
# Sprint: [N] | Verdict: [PASS ✅ | WATCH ⚠️ | FAIL 🚫]

## Results

| Area          | Result       | Detail                             |
|---------------|--------------|-------------------------------------|
| Unit tests    | [N] passing  | [N] failing                        |
| E2E tests     | [N] passing  | [N] failing · [N] skipped          |
| Coverage      | [X]%         | Target: 80%                        |
| TypeScript    | PASS/FAIL    | npx tsc --noEmit                   |
| Security      | PASS/FAIL    | cert-security: [N] critical        |
| Score         | [N]/100      | Threshold: 95                      |

## Test Plan Coverage

P1 Critical: [N passed] / [N total]
P2 Regression: [N passed] / [N total]
P3 UI smoke: [N passed] / [N total]

## Failures (if any)

[For each failing test or case:]
- [test name] — [what failed] — [suggested fix]

## Verdict

[PASS: All gates green. Proceed to staging → /cert-staging]
[WATCH: Proceed with known gaps — document below]
[FAIL: Fix required before staging — see failures above]

## Next

[PASS]  → /cert-staging
[WATCH] → /cert-staging with known-gap note
[FAIL]  → /cert-bug "[specific failing test]" for each P1 failure
```

If `ai/reports/` doesn't exist → create it.

---

## STEP 6 — Docker teardown (if Docker was used for E2E)

If Docker was used to run E2E tests (i.e., a `docker compose` stack was started for this test run):

```bash
# Run from the project root that has docker-compose.yml
docker compose down
```

**Rule:** Always kill Docker after any E2E run — pass or fail.
The stack has served its purpose. Leaving it running wastes resources and causes port conflicts on the next run.

**Exception:** Skip only if actively debugging a specific failure IN THIS SAME SESSION and need to inspect live container logs or re-run a subset of tests immediately.

---

## STEP 7 — Update QA state + route

Update `ai/state/qa-state.json`:
```json
{
  "status": "REPORT_READY",
  "verdict": "[PASS|WATCH|FAIL]",
  "reportFile": "ai/reports/QA-REPORT-[date].md",
  "passedCases": [N],
  "failedCases": [N],
  "unitPassing": [N],
  "unitFailing": [N],
  "e2ePassing": [N],
  "e2eFailing": [N],
  "coverage": [X],
  "score": [N]
}
```

Route output:
- PASS → "Ready for staging. Run /cert-staging."
- WATCH → "Proceed with caveats. Document gaps. Run /cert-staging."
- FAIL → "Fix P1 failures first. Run /cert-bug for each. Re-run /cortex-qa-report."

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QA REPORT — [project name]                     [date]
════════════════════════════════════════════════════════════
Unit tests:    [N] passing · [N] failing
E2E tests:     [N] passing · [N] failing · [N] skipped
Coverage:      [X]% (target: 80%)
Security:      [PASS | FAIL — N critical]
Score:         [N]/100
————————————————————————————————————————————————————————————
VERDICT: [✅ PASS — ready for staging | ⚠️ WATCH | 🚫 FAIL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report     ai/reports/QA-REPORT-[date].md
Next       [/cert-staging | /cert-bug "[test name]"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

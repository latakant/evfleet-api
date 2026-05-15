```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-hotfix  |  v8.0  |  TIER: 6  |  BUDGET: MODERATE    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L4 · L7 · L8 · L9                             ║
║ AUTHORITY     ║ GOVERNOR                                             ║
║ CAN           ║ - Read any src/ file                                ║
║               ║ - Write fix to src/ file (surgical — stated lines)  ║
║               ║ - Run npx tsc --noEmit                              ║
║               ║ - Run npx jest --testPathPattern=<module>           ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (HOTFIX)          ║
║               ║ - Write ai/fixes/applied/FIX_LOG.md (append)        ║
║ CANNOT        ║ - Modify schema.prisma (PA Phase 2 required)        ║
║               ║ - Add new features or refactor (scope: bug fix only) ║
║               ║ - Skip TypeScript check                             ║
║               ║ - Push to remote without explicit user approval     ║
║ REQUIRES      ║ - MASTER-v*.md loaded                               ║
║               ║ - Symptom described by user                         ║
║ ESCALATES     ║ - Schema change needed → HARD HALT → PA Phase 2    ║
║               ║ - Can't reproduce in unit test → route to           ║
║               ║   /cert-load-test (race/concurrency) or             ║
║               ║   /cert-staging (env-specific) — not PARTIAL        ║
║               ║ - Fix breaks other tests → HARD HALT               ║
║ OUTPUTS       ║ - Surgical code fix                                 ║
║               ║ - FIX_LOG entry                                     ║
║               ║ - Completion block: COMPLETE or HARD HALT           ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Emergency production fix — fast path, surgical, no new features. Use for live incidents only.

$ARGUMENTS

Parse: `symptom` (required) · `file` (optional, if known) · `severity` (P1=production down | P2=degraded | P3=wrong behavior)

---

## STEP 0 — SEVERITY GATE

Assess the severity immediately:

```
P1 — Production DOWN: payments failing, auth broken, API returning 500 on all requests
P2 — Degraded: one feature broken, elevated errors, performance regression
P3 — Wrong behavior: incorrect output, UI glitch, minor data issue
```

P1 → skip to STEP 2 (no deep analysis — fix first)
P2/P3 → run all steps in order

**Hotfix scope:** This skill ONLY fixes the stated symptom. No refactoring. No adjacent "while I'm in here" changes.

---

## STEP 1 — LOCATE

Read the file most likely to contain the bug based on the symptom.

Identify:
- Exact function/method that contains the bug
- The specific logic failure (not the symptom — the cause)
- Whether a schema change is required (if YES → HARD HALT, open PA Phase 2)

---

## STEP 2 — REPRODUCE (P2/P3 only, skip for P1)

Write the minimal test case that would fail:
```typescript
it('should [expected behavior]', async () => {
  // Current: [what it does wrong]
  // Expected: [what it should do]
})
```

If you cannot write a failing test → diagnose why before choosing path:

```
Cannot reproduce because...          → Route to
────────────────────────────────────────────────────────
race condition / concurrency bug     → /cert-load-test (load test env)
only happens in production env       → /cert-staging (live env check)
non-deterministic / timing-sensitive → /cert-load-test
logic bug but can't isolate it yet   → go back to STEP 1 — read more code
```

Do NOT output PARTIAL and proceed. A fix without reproduction is a guess — it will fail in production and you will be back here again.

---

## STEP 3 — FIX (surgical)

Apply the minimum change that resolves the symptom.

Rules:
- Change only the lines that are wrong
- Do NOT add error handling that isn't related to the bug
- Do NOT rename variables or refactor while fixing
- If fix requires > 20 lines changed: pause, explain scope to user, get confirmation

---

## STEP 4 — VERIFY

```bash
# TypeScript must be clean
npx tsc --noEmit

# Run the affected module's tests
npx jest --testPathPattern=<module> --verbose

# Run full suite — confirm no regressions
npx jest --verbose 2>&1 | tail -10
```

If any test fails after fix → do NOT push. Diagnose the regression. Output HARD HALT if you broke something.

---

## STEP 5 — LOG

Append to `ai/fixes/applied/FIX_LOG.md`:
```
[{date}] HOTFIX — <module> — <symptom in one line>
  Severity: P[1|2|3]
  File: <path>:<line range>
  Fix: <what changed>
  Verified: tsc ✅ · tests ✅ · regression: NONE
```

Append to `ai/lifecycle/LAYER_LOG.md`:
```
TYPE: HOTFIX | SEVERITY: P[N] | MODULE: <module> | FILE: <file>
DETAIL: <symptom> → <fix summary>
```

---

## STEP 6 — COMMIT

Use `/cortex-commit`:
```
fix(<module>): [symptom in imperative] — P[N] hotfix
```

Do NOT use `/cortex-commit` if P1 — user decides when to deploy. Output the commit command instead.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-hotfix                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Severity   P[N]
Fixed      [file]:[lines] — [what changed]
Verified   tsc ✅ | tests ✅ | regressions: NONE
Logged     FIX_LOG · LAYER_LOG · {date}
Next       [/cortex-commit — ready to ship | monitor for 15 min before commit]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

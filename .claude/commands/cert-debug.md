# /cert-debug — Disciplined Debugging Protocol
# skill: cert-debug | domain: dev | version: 1.0 | added: 2026-04-30
# Structured diagnosis loop for hard bugs and regressions: feedback loop → reproduce → classify → hypothesise → instrument → fix → regression-test.
# Core principle: build a fast, deterministic, agent-runnable pass/fail signal first. Everything else is mechanical.
# Absorbed from: mattpocock/skills diagnose (Layer 1) → converted to Cortex-certified (Layer 4).

---

## TRIGGER

Use when:
- A bug cannot be fixed in one obvious attempt
- A performance regression has appeared and the source is unknown
- A test is flaky (non-deterministic failure)
- "It works on my machine" / environment-dependent failure
- A bug was fixed once and has returned

Do NOT use for:
- One-line obvious fixes (typo, missing null check — just fix it)
- Compile errors or type errors (read the message, fix it)
- Bugs with a clear stack trace pointing to a single line

---

## THE CORE PRINCIPLE

```
Most debugging fails because the developer skips to Step 4 (instrument) without Steps 1–3.
Result: random log.debug() calls that generate noise, not signal.

The discipline is sequential and non-negotiable:
  Step 1: Feedback loop first — can you reliably reproduce it?
  Step 2: Reproduce — does it match the reported symptom?
  Step 3: Classify — what KIND of bug is this?
  Step 4: Hypothesise — 3 ranked candidates BEFORE touching code
  Step 5: Instrument — one probe per hypothesis, not a logging spree
  Step 6: Fix — root cause, not symptom
  Step 7: Regression test — write the test that would have caught this
  Step 8: Cleanup — remove all debug instrumentation, post-mortem

Skip a step → you are guessing, not debugging.
```

---

## EXECUTION

### STEP 0 — Intake

```
Bug description:    [exact symptom — error message, wrong output, performance number]
Reproducibility:    [always / intermittent / environment-specific]
First appeared:     [after which change, or unknown]
Impact:             [blocking / degraded / cosmetic]
```

---

### STEP 1 — Build the Feedback Loop

**This is the skill.** Everything else is mechanical.

Objective: a fast, deterministic, agent-runnable signal — PASS or FAIL — for the bug.

Build the loop using these techniques, in priority order:

```
1. Failing unit test at the bug's seam (fastest signal)
2. Failing integration test that reproduces the flow
3. curl / HTTP script against a running dev server
4. CLI invocation with fixture input, diffing stdout against snapshot
5. Playwright/Puppeteer headless script (for UI bugs)
6. Replay a captured trace from disk
7. Throwaway harness isolating the specific code path
8. Property/fuzz loop for intermittent failures (raise reproduction to 50%+)
9. Bisection harness for regressions (git bisect or manual binary search)
10. Human-in-the-loop bash script (last resort)
```

**Non-deterministic bugs:** Do not proceed until reproduction rate is ≥ 50%.
Use looping, stress, artificial timing, or concurrency pressure to raise the rate.

**If no loop can be built:** Stop. State explicitly what was attempted.
Request environment access, logs, or captured artifacts before proceeding.

Output:
```
Feedback loop:      [technique chosen + why]
Signal:             [FAIL confirmed / cannot reproduce — blocked by X]
Reproduction rate:  [100% / ~N% / cannot reproduce]
```

---

### STEP 2 — Reproduce & Confirm

Run the feedback loop and confirm:
```
□ Failure matches the reported symptom (not a nearby unrelated bug)
□ Exact symptom captured (error text, wrong value, timing delta)
□ Reproducible across multiple runs (or rate documented for non-deterministic)
```

If the reproduced failure differs from the report: stop and clarify with the user before proceeding.

---

### STEP 3 — Classify

Classify the bug type before hypothesising. The type narrows the hypothesis space.

```
LOGIC BUG          → wrong algorithm, wrong condition, off-by-one
DATA BUG           → wrong input shape, corrupted state, missing field
ENVIRONMENT BUG    → works locally, fails in CI/prod — config, secrets, ports
RACE CONDITION     → timing-dependent, concurrency, async ordering
REGRESSION         → worked before change X, fails after — bisect to X
INTEGRATION BUG    → two systems interact incorrectly at a boundary
PERFORMANCE        → correct output, wrong speed — establish baseline first
```

Output: `Bug type: [classification]`

---

### STEP 4 — Hypothesise

Generate 3–5 ranked hypotheses before touching any code.

Each hypothesis must be falsifiable:
```
"If [X] is the cause, then [Y action] will make the bug [disappear / worsen / change]."
```

Example:
```
H1 (most likely): The JWT middleware is not running on this route — auth guard missing.
   Prediction: Adding the guard explicitly will make the 401 reproduce on all routes.

H2: The token expiry is set to 0 in the test environment.
   Prediction: Setting JWT_EXPIRY=3600 in .env.test will make the test pass.

H3: The user's role is not being seeded correctly.
   Prediction: Logging user.role before the guard will show undefined.
```

**Show the ranked hypothesis list before proceeding.** User domain knowledge may immediately eliminate or elevate candidates.

---

### STEP 5 — Instrument

Map each probe to a specific hypothesis from Step 4.

Rules:
```
□ Change ONE variable per probe — never instrument multiple things simultaneously
□ Tool hierarchy:
    1. Debugger / REPL inspection (no code change)
    2. Targeted log at a boundary point
    3. NEVER log everything indiscriminately
□ Tag every debug log with a unique prefix: [DEBUG-xxxx]
   Example: console.log('[DEBUG-a4f2] user.role:', user.role);
   (Prefix makes cleanup mechanical — grep and delete)
□ For performance regressions: establish baseline measurement first,
   then bisect — do not add logs until the regression commit is identified
```

After each probe: does the result confirm or refute the hypothesis?
- Confirmed → proceed to Step 6
- Refuted → move to next hypothesis, do not abandon the list

---

### STEP 6 — Fix

Apply the minimal fix that addresses the root cause — not the symptom.

```
Root cause fix:     [what actually changed and why]
Symptom fix avoided: [what would have been the wrong fix]
```

If the fix is larger than expected (touches 3+ files): stop and verify with the user before applying. A large fix often means the wrong root cause was identified.

---

### STEP 7 — Regression Test

Write the regression test **before** applying the fix when possible.

```
1. Turn the minimised reproduction into a failing test
2. Confirm it fails (RED)
3. Apply the fix
4. Confirm it passes (GREEN)
5. Re-run the Step 1 feedback loop against the original scenario
```

Only skip the regression test if no suitable seam exists at the call site.
Document the reason for skipping in the commit message.

---

### STEP 8 — Cleanup + Post-Mortem

Required before this skill is complete:

```
□ Original reproduction no longer reproduces (run feedback loop one final time)
□ Regression test passes (or absence documented with reason)
□ All [DEBUG-xxxx] tags removed (grep for [DEBUG- to confirm)
□ Throwaway harnesses deleted
□ Root cause stated in commit message (not just "fixed the bug")
```

**Post-mortem question:** What architectural change would have prevented this bug?
If the answer is meaningful → hand findings to `/cert-refactor`.

---

## OUTPUT FORMAT

```
CERT-DEBUG COMPLETE
──────────────────────────────────────────
Bug classified:        [type from Step 3]
Root cause:            [one sentence — the actual cause]
Correct hypothesis:    [H1 / H2 / H3 — which one was right]
Fix applied:           [what changed, file + line]
Regression test:       [test name / skipped: reason]
Debug tags removed:    YES / N/A
Post-mortem:           [architectural improvement opportunity, or "none"]
──────────────────────────────────────────
STATUS: RESOLVED ✅
```

---

## HARD INVARIANTS

```
NEVER fix symptoms without confirming the root cause.
  A symptom fix makes the bug invisible; the root cause stays and resurfaces.
  If you cannot state the root cause in one sentence, you have not found it.

NEVER skip Step 1 (feedback loop).
  Debugging without a reproducible signal is guessing.
  "I think it's X" without a pass/fail loop is not debugging — it is speculation.

NEVER instrument multiple things simultaneously.
  One probe per hypothesis. Multiple changes simultaneously destroy causality.
  You will not know which change revealed the bug.

NEVER leave [DEBUG-xxxx] tags in the codebase after resolution.
  Debug instrumentation in production code is noise.
  Tag all debug logs at insertion; grep-remove at completion.

NEVER write the regression test AFTER the fix when a seam exists.
  Test-first regression testing confirms the fix actually targets the right cause.
  Test-after-fix means you might be testing the wrong thing.
```

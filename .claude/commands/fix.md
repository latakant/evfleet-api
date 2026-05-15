╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /fix  |  v1.2  |  TIER: 1  |  BUDGET: LEAN                ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ PURPOSE       ║ Debug entry. Describe the error — Cortex fixes it.  ║
║ DELEGATES TO  ║ cert-bug (full engine — unchanged)                  ║
║ WHEN TO USE   ║ Any bug, error, broken behavior, failing test.      ║
║ REPLACES      ║ Nothing removed. This is the public face.           ║
╚═══════════════╩══════════════════════════════════════════════════════╝

The developer doesn't need to know about cert-bug, diagnose.js, or report-bug.js.
/fix is the front door. cert-bug runs the full engine behind it.
The route is always visible. The system is never a black box.

$ARGUMENTS — error description, module name, or symptom (required)

## SCHEMA

```yaml
skill: fix
version: "1.2"
input:
  $ARGUMENTS:
    type: string
    required: true
    description: "Error description, module name, or symptom"
    validation: "Must contain error signal (message|trace|status) OR location signal (module|file|endpoint)"
    min_signals: 1
output:
  type: action
  format: "completion block: /fix complete → ran: cert-bug | [outcome]"
  feeds_into:
    - cert-bug
runtime:
  tier: 1
  budget: LEAN
  temperature: 0
  token_class: LOW
  delegates_to: cert-bug
```

---

## EXECUTION

### Step 0 — Execution Refusal Gate · Minimum Input Contract (before anything runs)

Evaluate $ARGUMENTS for at least ONE of:
- **Error signal** — an error message, stack trace, failing test name, HTTP status code
- **Location signal** — a module, file, endpoint, or specific behavior name

**If NEITHER is present** (e.g., `/fix "payment failed"` · `/fix "it's broken"`) → DO NOT ROUTE. Output:
```
⚠️ /fix — needs more context before cert-bug can diagnose
  Provide at least one of:
    • Error message or stack trace
    • Which module / file / endpoint is affected
    • Failing test name or HTTP status
```

**Minimum viable input to proceed:**
- `"payment failed"` alone → ❌ BLOCKED (no error, no location)
- `"payment webhook 500 error"` → ✅ (status code = error signal)
- `"cart total wrong after coupon in cart.service.ts"` → ✅ (behavior + location)
- `"TypeError: Cannot read property 'id' of undefined"` → ✅ (stack trace = error signal)

**HARD RULE:** cert-bug must diagnose from signals, not guesses.
An incomplete fix harms more than no fix — it creates false confidence.

When STOP fires, log the refusal before outputting the message:
```bash
node scripts/lifecycle.js log --action=REFUSAL_GATE --module=fix \
  --detail="reason: [no_error_signal|no_location] · input: [first 60 chars]" 2>/dev/null || true
```

Proceed to Step 1 only when input contains at least one actionable signal.

---

### Step 1 — Announce route (before anything runs)

Output immediately:

```
┌─ /fix "[truncated description, max 60 chars]"
│  → Routing to: cert-bug
```

### Step 2 — Execute

Pass $ARGUMENTS directly to cert-bug. Run cert-bug's full flow unchanged:

1. Load context (invariants · fix history — regression check)
2. Diagnose via `node scripts/diagnose.js` — KNOWN (30s fix) or UNKNOWN
3. Identify root cause — 8-question enterprise framework
4. Risk check → surface to human BEFORE any code change
5. Apply minimal fix only
6. Verify — `npx tsc --noEmit` must pass
7. Log to FIX_LOG.md + TRACKER.md
8. Auto-capture pattern to pending-patterns.json
9. Verify fix via signals (PASS/FAIL/SKIP) + extract watchpoints

No new logic. /fix is a clean alias — all intelligence lives in cert-bug.

### Step 3 — Confirm completion (after execution)

Output exactly:

```
└─ /fix complete  →  ran: cert-bug  |  [brief outcome, 1 line]
```

Examples:
```
└─ /fix complete  →  ran: cert-bug  |  root cause: missing @HttpCode · fixed · CLEAN ✔
└─ /fix complete  →  ran: cert-bug  |  UNKNOWN bug — diagnosis logged · human review needed
└─ /fix complete  →  ran: cert-bug  |  3 tests fixed · no regression · pattern captured
```

---

## EXAMPLES

```
/fix "ECONNREFUSED Redis on startup"
/fix "cart total shows wrong amount after coupon"
/fix "auth guard returns 401 on valid token"
/fix payments — webhook not confirming order
/fix "TypeScript error in orders.service.ts line 84"
```

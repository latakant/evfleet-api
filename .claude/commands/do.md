╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /do  |  v1.2  |  TIER: 1  |  BUDGET: LEAN                 ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ PURPOSE       ║ Primary entry. Say what you want — Cortex routes it. ║
║ DELEGATES TO  ║ cortex-intent (full engine — unchanged)              ║
║ WHEN TO USE   ║ Any task. Build · Fix · Design · Plan · Review.      ║
║ REPLACES      ║ Nothing removed. This is the public face.            ║
╚═══════════════╩══════════════════════════════════════════════════════╝

The user doesn't need to know about cortex-intent.
/do is the front door. cortex-intent is the engine behind it.
The route is always visible. The system is never a black box.

$ARGUMENTS — free-form task description (required)

## SCHEMA

```yaml
skill: do
version: "1.2"
input:
  $ARGUMENTS:
    type: string
    required: true
    description: "Free-form task description"
    validation: "Must contain intent verb (fix|build|add|review|plan|refactor) AND bounded scope (module|file|feature)"
    min_signals: 2
output:
  type: action
  format: "completion block: /do complete → ran: [skill] | [outcome]"
  feeds_into:
    - cortex-intent
    - cert-bug
    - cert-verify
    - cert-commit
runtime:
  tier: 1
  budget: LEAN
  temperature: 0
  token_class: LOW
  delegates_to: cortex-intent
```

---

## EXECUTION

### Step 0 — Execution Refusal Gate · Minimum Input Contract (before anything runs)

Evaluate $ARGUMENTS for two signals:
- **Intent verb** — a clear action word (fix, build, add, review, plan, refactor, etc.)
- **Bounded scope** — a specific module, file, feature, or endpoint

**If BOTH are missing** (e.g., `/do "make it better"`) → DO NOT ROUTE. Output:
```
⚠️ /do — intent unclear
  What do you want to do, and where?

  Try instead:
    /do "fix the cart total not updating after coupon"
    /do "add email notification to the order confirmation flow"
    /do "review the auth module for security issues"
```

**If intent exists but scope is unbounded** (e.g., `/do "optimize my backend"` / `/do "improve performance"`) → DO NOT ROUTE. Output:
```
⚠️ /do — scope too broad to route safely
  Which module or feature specifically?

  Try instead:
    /do "optimize the products listing query — slow on large categories"
    /do "improve auth token refresh — currently expires mid-session"
    /do "refactor the payments service — too many responsibilities"
```

**HARD RULE:** Do not guess. Do not assume. Do not route under ambiguity.
Cortex is judged on what it refuses as much as what it executes.

When STOP fires, log the refusal before outputting the message:
```bash
node scripts/lifecycle.js log --action=REFUSAL_GATE --module=do \
  --detail="reason: [ambiguous_intent|unbounded_scope] · input: [first 60 chars]" 2>/dev/null || true
```

Proceed to Step 1 only when input has: clear intent + bounded scope.

---

### Step 1 — Announce route (before anything runs)

Classify intent from $ARGUMENTS, then output immediately:

```
┌─ /do "[truncated task, max 60 chars]"
│  → Intent: [INTENT CLASS]  →  routing to [skill name]
```

Intent classes and their routes:

| Intent | Routes to |
|--------|-----------|
| FIX / BUG / ERROR / BROKEN / FAILING | /fix → cert-bug |
| BUILD / ADD / CREATE / FEATURE | cortex-intent → BUILD chain |
| PLAN / DESIGN / ARCHITECT | cortex-intent → PLAN chain |
| REVIEW / AUDIT / CHECK | cortex-intent → REVIEW chain |
| TEST | cortex-intent → TEST chain |
| DEPLOY / SHIP / COMMIT | /ship → cert-verify + cert-commit |
| IMPROVE / REFACTOR | cortex-intent → IMPROVE chain |
| LEARN / EXPLAIN | cortex-intent → LEARN chain |

### Step 2 — Execute

Pass $ARGUMENTS directly to cortex-intent. Run its full flow unchanged:
- Score complexity (0–3 INLINE · 4–6 SINGLE-AGENT · 7–10 FULL-CHAIN)
- Check prerequisites
- Show execution plan with engine chain
- Wait for CONFIRM before running any step

No new logic. No new routing. /do is a clean alias — all intelligence lives in cortex-intent.

### Step 3 — Confirm completion (after execution)

Output exactly:

```
└─ /do complete  →  ran: [skill(s) executed]  |  [brief outcome, 1 line]
```

Examples:
```
└─ /do complete  →  ran: cert-bug             |  2 files fixed · tests PASS · CLEAN ✔
└─ /do complete  →  ran: cortex-intent BUILD  |  feature scaffolded · ready to review
└─ /do complete  →  ran: cert-verify + cert-commit  |  100/100 · committed ✔
```

---

## EXAMPLES

```
/do "build the user profile page"
/do "add coupon validation to checkout"
/do "fix the cart total not updating"
/do "review the auth module security"
/do "plan the full notifications feature"
```

All of these route through the same cortex-intent engine.
The developer only needs to remember one command.

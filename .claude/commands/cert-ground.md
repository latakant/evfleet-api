╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cert-ground  |  v1.0  |  TIER: 1  |  BUDGET: LEAN          ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Pre-work verification gate)                     ║
║ AUTHORITY     ║ ANALYST                                             ║
║ POSITION      ║ After cert-enforce · Before cert-build/fix/feature  ║
║ CAN           ║ - Read any file in the project                      ║
║               ║ - Grep for functions, classes, endpoints            ║
║               ║ - Run tsc --noEmit or project health check          ║
║               ║ - Read git log for recent changes to target files   ║
║ CANNOT        ║ - Write or modify any file                          ║
║               ║ - Make implementation decisions                     ║
║               ║ - Fix discrepancies it finds (flag only)            ║
║               ║ - Block work — it is advisory, not a hard gate      ║
║ REQUIRES      ║ - Task description (what is about to be built/fixed)║
║               ║ - Target module or file list                        ║
║ OUTPUTS       ║ - Ground truth snapshot of current code state       ║
║               ║ - Discrepancy report (assumption vs reality)        ║
║               ║ - Baseline health status (TypeScript, last tests)   ║
║               ║ - GROUNDED or REVIEW NEEDED verdict                 ║
╚═══════════════╩══════════════════════════════════════════════════════╝

---

## ROLE

cert-ground answers one question before any code is written:

> **"Is what Claude believes about the code actually true right now?"**

Claude's biggest failure mode in coding sessions is acting on **assumed state** —
believing a function exists when it was renamed, thinking a file is at a path it
was moved from, assuming a test passes when it was recently broken, or planning
to build something that already exists.

cert-ground closes this gap by forcing a verified snapshot of reality before
the first line of code is touched. It is the difference between building on
solid ground and building on quicksand.

---

## SCOPE

cert-ground is narrow by design. It does **three things only**:

1. **Read** — the files that will be touched
2. **Verify** — the functions/classes/endpoints that will be referenced
3. **Check** — the baseline health of the project (TypeScript, recent test state)

It does NOT plan. It does NOT fix. It does NOT decide.
Its only output is truth — what is actually in the code right now.

**When to run:**
- Before every cert-build session (mandatory)
- Before every cert-fix session (mandatory)
- Before every cert-feature session (mandatory)
- Before cert-refactor (strongly recommended)
- Standalone: `/cert-ground <task description>` to audit before committing to an approach

---

## STEP 1 — Parse Task

Extract from `<task>`:
- **Target files** — which modules/files will be modified
- **Key symbols** — function names, class names, endpoints, DTOs that will be touched or referenced
- **Assumptions** — anything the task description implies about current code state
  (e.g. "add X to Y" assumes Y exists; "fix Z" assumes Z is broken in a specific way)

If task is vague → make the symbols explicit before proceeding:
```
Task: "fix the coupon validation"
Extracted:
  Files:    src/modules/coupons/*.ts · src/services/coupons.service.ts (frontend)
  Symbols:  validateCoupon() · CouponsController.validate() · CouponValidationResult
  Assumes:  validateCoupon exists · endpoint is /coupons/validate · result has .valid field
```

---

## STEP 2 — Read Target Files

Read every file that will be touched. Do not rely on memory.

```
For each target file:
  → Read the actual file
  → Note: last ~5 lines of git log for this file (recent changes)
  → Flag if file content differs from what the task assumed
```

```bash
# Recent changes to target files
git log --oneline -5 -- <file-path>
```

Mark each file:
- `✅ READ` — file exists, content matches expectations
- `⚠ DIFFERS` — file exists but content differs from task assumption (describe how)
- `❌ MISSING` — file does not exist (task assumed it would)

---

## STEP 3 — Verify Key Symbols

For every function, class, endpoint, DTO referenced in the task:

```bash
# Verify symbol exists at expected location
grep -rn "functionName\|ClassName" src/modules/<module>/

# For frontend services
grep -rn "methodName" src/services/

# For API endpoints
grep -rn "@Get\|@Post\|@Patch\|@Delete" src/modules/<module>/<module>.controller.ts
```

Mark each symbol:
- `✅ FOUND` — exists at expected file:line
- `⚠ FOUND ELSEWHERE` — exists but at different path than assumed
- `⚠ ALREADY IMPLEMENTED` — task plans to build this but it already exists
- `❌ NOT FOUND` — does not exist anywhere (task assumed it would)

---

## STEP 4 — Baseline Health Check

Run the project's health check to confirm the baseline compiles and tests are
in known state BEFORE the work begins.

**TypeScript:**
```bash
npx tsc --noEmit
```
- 0 errors → `✅ CLEAN`
- N errors → `⚠ BASELINE HAS ERRORS` — list them. Work may need to fix these first.

**Recent test state (from git log, no re-run needed):**
```bash
git log --oneline -3
```
Check if last commit message mentions test failures or broken state.

**Do NOT re-run the full test suite** — that is cert-verify's job. Just establish
whether the baseline is known-good or known-broken before touching anything.

---

## STEP 5 — Discrepancy Report

Collate everything found in Steps 2–4. Output:

```
⚡ CERT-GROUND — [module] — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK:  [one-line description of what is about to be built/fixed]

FILES READ:
  ✅ src/modules/orders/orders.service.ts
  ✅ src/modules/orders/orders.controller.ts
  ⚠  src/types/order.ts  [DIFFERS — idempotencyKey already added in last commit]

SYMBOLS VERIFIED:
  ✅ cancelOrder()             orders.service.ts:234
  ✅ OrdersController          orders.controller.ts:15
  ⚠  findOneAdmin()           ALREADY EXISTS at orders.service.ts:788
  ❌ refundOrder()             NOT FOUND — task references this, does not exist

BASELINE HEALTH:
  ✅ tsc --noEmit: 0 errors
  ✅ Last commit: "fix(checkout): coupon validation + idempotency" — no broken state

DISCREPANCIES:
  1. [⚠ DUPLICATE]  findOneAdmin() already implemented — task may be rebuilding existing work
  2. [⚠ STALE]      idempotencyKey already in order.ts — task description is behind current code
  3. [❌ MISSING]   refundOrder() does not exist — clarify scope before building

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUND STATUS:  ⚠ REVIEW NEEDED  (1 critical · 2 advisory)
RECOMMENDATION: Resolve critical discrepancies before proceeding.
                Advisory items noted — adjust plan accordingly.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Verdicts:**

| Status | Meaning | Action |
|--------|---------|--------|
| `✅ GROUNDED` | Reality matches plan. Zero discrepancies. | Proceed to cert-build/fix |
| `⚠ REVIEW NEEDED` | Advisory differences found. No blockers. | Adjust plan, then proceed |
| `🔴 BLOCKED` | Critical mismatch — building on this assumption will cause real harm | Stop. Resolve with human before proceeding. |

**Critical (🔴 BLOCKED) triggers:**
- A file the task depends on does not exist
- A function the task calls does not exist
- TypeScript baseline has errors that will multiply with new code
- Task plans to build something that already exists (would create duplicates)

---

## STEP 6 — Inject Ground Truth into Session

After grounding, state explicitly what is true NOW — the verified snapshot
that all subsequent work in this session must be anchored to:

```
SESSION GROUND TRUTH (verified [date])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files read and confirmed:
  · orders.service.ts — [brief description of current state]
  · orders.controller.ts — [brief description of current state]

Confirmed symbols:
  · cancelOrder() at orders.service.ts:234 — [signature]
  · OrdersController at orders.controller.ts:15

Adjusted plan (based on discrepancies):
  · findOneAdmin already exists — skip creation, only extend if needed
  · refundOrder scope unclear — building only what task explicitly specifies

TypeScript: clean baseline ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This ground truth block is the ANCHOR for the rest of the session.
Any time Claude is about to reference a file or function: check this block first.

---

## HOW IT FITS IN THE WORKFLOW

```
/cert-enforce  →  Load guardrails (what patterns to follow)
      ↓
/cert-ground   →  Verify current state (what the code actually is)
      ↓
/cert-build    →  Write code (anchored to verified reality)
/cert-fix      →
/cert-feature  →
      ↓
/cert-verify   →  Confirm output (tests pass, TypeScript clean)
      ↓
/cert-commit   →  Ship
```

cert-enforce answers: *"What rules apply?"*
cert-ground answers: *"What is actually true right now?"*
Together they eliminate the two biggest sources of Cortex failure:
wrong patterns and wrong assumptions.

---

## USAGE EXAMPLES

```bash
# Before building a new feature
/cert-ground "add search filter to admin orders list"

# Before fixing a bug
/cert-ground "fix coupon validation returning undefined in checkout"

# Before a refactor
/cert-ground "refactor delivery zone endpoints to use admin guard"

# Standalone audit — no work follows, just want to know current state
/cert-ground --audit orders
```

---

## Completion Block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:        cert-ground
STATUS:       COMPLETE
MODULE:       [module]
FILES READ:   [N]
SYMBOLS:      [N verified · N missing · N already-exists]
BASELINE:     [CLEAN | N errors]
DISCREPANCIES:[N critical · N advisory]
VERDICT:      [✅ GROUNDED | ⚠ REVIEW NEEDED | 🔴 BLOCKED]
NEXT:         cert-build | cert-fix | cert-feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

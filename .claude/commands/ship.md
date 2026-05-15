╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /ship  |  v1.1  |  TIER: 1  |  BUDGET: LEAN               ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ PURPOSE       ║ Closure command. Verify clean → commit safely.      ║
║ DELEGATES TO  ║ cert-verify → cert-commit (both unchanged)          ║
║ WHEN TO USE   ║ When work is done and you're ready to commit.       ║
║ REPLACES      ║ Nothing removed. This is the public face.           ║
╚═══════════════╩══════════════════════════════════════════════════════╝

The developer doesn't need to remember to run verify before commit.
/ship does both. In the right order. Every time.
The route is always visible. The system is never a black box.

$ARGUMENTS — optional commit message (passed to cert-commit if provided)

## SCHEMA

```yaml
skill: ship
version: "1.1"
input:
  $ARGUMENTS:
    type: string
    required: false
    description: "Optional commit message passed to cert-commit"
    default: "derived from git diff"
output:
  type: action
  format: "completion block: /ship complete → ran: cert-verify + cert-commit | [outcome]"
  feeds_into:
    - cert-verify
    - cert-commit
runtime:
  tier: 1
  budget: LEAN
  temperature: 0
  token_class: LOW
  delegates_to: "cert-verify → cert-commit"
```

---

## EXECUTION

### Step 1 — Announce route (before anything runs)

Output immediately:

```
┌─ /ship
│  → Running: cert-verify (7 phases) → cert-commit
```

### Step 2 — cert-verify

Run all 7 phases. Output each phase result as it completes:

```
│  Phase 0  Score Gate    PASS ✔ / WARN ⚠ / FAIL ✖  [score]/100
│  Phase 1  TypeScript    PASS ✔ / FAIL ✖
│  Phase 2  Tests         PASS ✔ / FAIL ✖
│  Phase 3  Secrets       PASS ✔ / FAIL ✖
│  Phase 4  Invariants    PASS ✔ / FAIL ✖
│  Phase 5  Diff review   PASS ✔ / WARN ⚠
│  Phase 6  Metrics Sync  PASS ✔  unit=[N] · e2e=[N] · total=[N]
```

If cert-verify FAIL on any phase:
```
│  BLOCKED — fix required:
│    1. [specific error · file:line]
│
└─ /ship blocked  →  fix the above, then /ship again
```
Stop. Do not proceed to commit.

### Step 3 — cert-commit (only if cert-verify PASS)

Run cert-commit with $ARGUMENTS as the commit message (if provided).
cert-commit handles: conventional message · selective staging · lifecycle log · TRACKER.md update.

### Step 4 — Confirm completion

Output exactly:

```
└─ /ship complete  →  ran: cert-verify + cert-commit  |  [outcome, 1 line]
```

Examples:
```
└─ /ship complete  →  ran: cert-verify + cert-commit  |  Score 100/100 · committed ✔
└─ /ship complete  →  ran: cert-verify + cert-commit  |  Score 98/100 · committed ✔ · 3 files
```

---

## EXAMPLES

```
/ship
/ship "add wishlist feature"
/ship "fix Redis connection on startup"
```

One command. Done right.

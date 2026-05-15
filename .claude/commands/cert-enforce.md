╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cert-enforce  |  v11.3  |  TIER: 1  |  BUDGET: LEAN        ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Pre-build gate)                                 ║
║ AUTHORITY     ║ ANALYST                                             ║
║ CAN           ║ - Read Cortex adapter patterns (stack + domain)     ║
║               ║ - Read ai/learning/instincts.json (local extensions)║
║               ║ - Filter by module, domain, confidence              ║
║               ║ - Inject active constraints into current session     ║
║               ║ - Surface violations found in staged code           ║
║ CANNOT        ║ - Write code or modify source files                 ║
║               ║ - Modify instincts.json                             ║
║               ║ - Block a build (advisory only — flag, not halt)   ║
║ REQUIRES      ║ - CLAUDE.md (stack detection)                       ║
║               ║ - Module or task description (from $ARGUMENTS)      ║
║ ESCALATES     ║ - Confidence ≥ 0.9 violation → flag as HIGH RISK   ║
║               ║ - Invariant conflict → route to cert-diagnose       ║
║ OUTPUTS       ║ - Active guardrail block for current session        ║
║               ║ - Violation flags if staged code is provided        ║
║               ║ - ENFORCING summary consumed by cert-build/fix      ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Close the learning loop: instincts are written by cert-learn, diagnosed by cert-diagnose,
and now **enforced** here — before the first line of code is written.

Run at the start of every cert-build, cert-fix, or cert-feature session.
Can also run standalone: `/cert-enforce <module>` to preview active guardrails.

$ARGUMENTS

Parse from $ARGUMENTS:
- `<module>`               → filter instincts for this module/domain
- `<module> --scan`        → filter + scan staged/recently modified files for violations
- `--all`                  → show all graduated instincts regardless of module
- (blank)                  → load all instincts, ask which module to scope to

---

## STEP 0.5 — Load Language Core (ALWAYS FIRST — before framework and domain adapters)

Language rules are foundations. Load them before any framework adapter.
Framework rules layer on top. Domain rules layer last.

Detect language from CLAUDE.md `Stack:` line or module list:

```
TypeScript project (any framework — NestJS · Next.js · Express · React Native · Bun · Deno):
  → read `C:\luv\Cortex\adapters\language\typescript\core.md`
  → extract SCAN RULES table (TS-001 through TS-007) into language_rules[]
  → maturity = SEED → rules active

Go project (any framework — Gin · net/http · Fiber):
  → adapters/language/go/core.md is STUB → skip, no rules yet

Python / Java / Dart:
  → all STUB → skip silently
```

If language adapter is STUB or file not found → `language_rules[] = []` — continue.
If SEED or FULL → extract rules and add to enforcement set.

`language_rules[]` enters `all_patterns[]` FIRST — highest priority in the enforcement set.

---

## STEP 1 — Load Patterns (Two sources — Cortex first, local second)

**SOURCE 1 — Cortex adapter patterns (universal, stack + domain specific)**

Read CLAUDE.md to detect stack and domain. Then load matching Cortex adapter files:

Stack detection → load if exists:
- NestJS project  → read `C:\luv\Cortex\adapters\stack\typescript\backend\nestjs\nestjs-patterns.md`
- NestJS + Prisma → also read `C:\luv\Cortex\adapters\stack\typescript\backend\nestjs\prisma-patterns.md`
- Next.js project → read `C:\luv\Cortex\adapters\stack\typescript\frontend\nextjs\nextjs-patterns.md`

Domain detection → load if exists (check CLAUDE.md §1 TOPOLOGY or module list):
- ecom / orders / payments → read `C:\luv\Cortex\adapters\domains\ecom-india\ecom-payments.md`
- ecom / tax / invoices    → read `C:\luv\Cortex\adapters\domains\ecom-india\ecom-tax.md`
- ecom / coupons           → read `C:\luv\Cortex\adapters\domains\ecom-india\ecom-coupons.md`
- ecom / orders / cart     → read `C:\luv\Cortex\adapters\domains\ecom-india\ecom-orders.md`
- fintech                  → read `C:\luv\Cortex\adapters\domains\fintech\fintech-ledger.md`
- saas / subscriptions     → read `C:\luv\Cortex\adapters\domains\saas\saas-subscriptions.md`

Extract all LAW blocks and anti-pattern tables from adapter files into `adapter_patterns[]`.
These are Cortex-sourced, pre-validated, always active. Confidence = 1.0.

**Loading order enforced:**
`all_patterns[] = language_rules[] + adapter_patterns[] + graduated[] + high_confidence[]`
Language violations always surface first.

If no adapter files found: note "No adapter patterns loaded" — continue.

---

**SOURCE 2 — Local project instincts (project-specific, not yet in Cortex)**

Read `ai/learning/instincts.json`.

If file does not exist: `local_instincts[] = []` — continue (adapter patterns still active).

Parse all instincts. Build working set:
- `local_instincts[]` — every entry in the file
- `graduated[]` — where `graduated: true`
- `high_confidence[]` — where `confidence ≥ 0.8` (graduated or not)

**HARD RULE:** instincts.json is for patterns NOT already in Cortex adapters.
If an instinct duplicates an adapter pattern → it is redundant (harmless, but flag it).

---

**Merge into single enforcement set:**
`all_patterns[] = adapter_patterns[] + graduated[] + high_confidence[]`

---

## STEP 2 — Filter by Scope

If `<module>` provided, filter working set:

Match instinct to module if ANY of these are true:
- `instinct.module` contains `<module>` (partial match ok)
- `instinct.tags[]` contains `<module>` or a related domain keyword
- `instinct.applies_to[]` is present and includes `<module>`
- Instinct has `scope: global` → always include regardless of module

Confidence thresholds for inclusion:
- `confidence ≥ 0.9` → **CRITICAL guardrail** — always include
- `confidence ≥ 0.7` → **ACTIVE guardrail** — include
- `confidence 0.5–0.69` → **ADVISORY** — include but mark as low-signal
- `confidence < 0.5` → exclude (too noisy, not yet reliable)

---

## STEP 3 — Display Active Guardrails

Output the enforcement block:

```
⚡ CORTEX ENFORCE — [module | ALL] — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL guardrails [confidence ≥ 0.9]:
  ✖ [instinct-id] — [title]
    Rule:    [what must never happen, in one line]
    Pattern: [code smell or anti-pattern to watch for]
    Fix:     [the correct approach]

ACTIVE guardrails [confidence 0.7–0.89]:
  ⚠ [instinct-id] — [title]
    Rule:    [what must never happen]
    Fix:     [the correct approach]

ADVISORY [confidence 0.5–0.69]:
  · [instinct-id] — [title] (low-signal — verify applicability)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENFORCING: [N] critical · [N] active · [N] advisory
These constraints are ACTIVE for this session.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If zero instincts match the filter:
```
⚡ CORTEX ENFORCE — [module]
  No instincts found for this module.
  Build freely — but run /cert-learn after if bugs emerge.
ENFORCING: NONE
```

---

## STEP 4 — Scan (if --scan flag provided)

Scan has two scan sources — **adapter rules** (structural) and **instinct rules** (project-learned).
Both run. Neither overrides the other.

### STEP 4A — Adapter SCAN RULES (always active when adapter loaded)

The adapter files loaded in STEP 1 each contain a `## SCAN RULES` table.
Load those tables now. Each row has: `rule-id | pattern | severity | catches | false-positive notes`.

Get changed files:
```bash
git diff --name-only HEAD 2>/dev/null
# or if no git changes:
git diff --name-only HEAD~1 HEAD 2>/dev/null
```

For each changed file, determine which adapter applies:
- `.controller.ts` / `.service.ts` / `.module.ts` in NestJS → apply NestJS + Prisma scan rules
- `.tsx` / Next.js `page.tsx` / `services/*.service.ts` → apply Next.js scan rules
- Files matching both → apply both

For each FAIL-severity rule in the table: run the grep pattern against the file.
For each WARN-severity rule: run the grep pattern, flag as advisory.

**Output per violation:**
```
🔴 VIOLATION — [rule-id]  (FAIL)
   File:    [path]:[line]
   Found:   [matched text]
   Catches: [what this rule detects]
   Fix:     [correct pattern from the LAW]
   Action:  Fix before commit → /cert-fix "[violation description]"

⚠  WARNING  — [rule-id]  (WARN)
   File:    [path]:[line]
   Found:   [matched text]
   Risk:    [what could go wrong]
   Fix:     [correct pattern]
```

**Output per clean file:**
```
✅ [rule-id] — no violation in [file]
```

**Summary line:**
```
ADAPTER SCAN: [N] FAIL violations · [N] WARN advisories · [N] files clean
```

If FAIL violations found → state clearly:
```
SCAN BLOCKED — [N] adapter rule violation(s) must be fixed before proceeding.
```

---

### STEP 4B — Instinct scan (local project-learned patterns)

Using active `local_instincts[]` from STEP 1, scan for known project-specific patterns.
Legacy reference table (always included regardless of instinct list):

| Instinct | What to grep for |
|----------|-----------------|
| `prisma-any-type-elimination` | `: any` near Prisma calls, `findMany\(` with `any` typed result |
| `wrap-order-create-in-transaction` | multi-table writes (`prisma.order.create` + `prisma.payment.create`) NOT inside `$transaction` |
| `p2002-to-conflict-exception` | `catch` blocks that don't check `e.code === 'P2002'` |
| `shiprocket-webhook-signature` | webhook handler methods missing HMAC verification |
| `prisma-queryraw-typed-interface` | `$queryRaw` without explicit return type interface |

For each active instinct with a detectable pattern (from instincts.json `pattern` field if present):
- Run the grep
- Report violation using same format as STEP 4A

For clean files:
```
✅ [instinct-id] — no violation found in scanned files
```

---

## STEP 5 — Session Injection

State clearly which guardrails are now ACTIVE for this session.
These must be treated as hard constraints in any code written during cert-build/fix/feature:

```
SESSION GUARDRAILS ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━
The following rules are enforced for ALL code written in this session:

[For each CRITICAL instinct:]
  ✖ NEVER [anti-pattern] — [instinct title]

[For each ACTIVE instinct:]
  ⚠ ALWAYS [correct pattern] — [instinct title]

Violation of a CRITICAL guardrail = flag before committing.
Violation of an ACTIVE guardrail  = warn + suggest fix.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 6 — Structural Safety Check (auto — runs every time)

Using context already loaded in Steps 1–5 (patterns, CLAUDE.md, instincts), output:

```
STRUCTURAL CHECK — [module | scope of upcoming change]
────────────────────────────────────────────────────────
Access Control  : [read actual controller file — are guards present on every non-public route?
                   Name the specific guards or flag MISSING if absent]
State Integrity : [read actual service file — are multi-table writes inside $transaction?
                   Name the specific operations or flag UNGUARDED if not]
Side Effects    : [could this produce duplicate events, retry loops, or double-sends?
                   Check queue usage — flag if inline instead of queued]
Sensitive Data  : [any risk of secrets/tokens appearing in logs or API responses?
                   Check logger.log() calls and response shapes]
Invariant Match : [which rules from CLAUDE.md §2 CRITICAL BUSINESS RULES apply here?
                   State the rule and whether this change respects or risks it]
────────────────────────────────────────────────────────
Risk: LOW ✅  → proceed
      MEDIUM ⚠ → proceed, add inline comment flagging the risk
      HIGH 🚫  → STOP — type PROCEED to override with explicit reason
```

**Precision rule:** Each line must contain a specific finding from reading actual files — not a generic question.
Wrong: `Access Control: might be missing`
Right: `Access Control: JwtAuthGuard present on all routes except POST /contact (@Public correct)`

If no code exists yet (greenfield): base check on the contract defined so far.

---

## Completion Block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cert-enforce
STATUS:     COMPLETE
MODULE:     [module | ALL]
CRITICAL:   [N] guardrails active
ACTIVE:     [N] guardrails active
ADVISORY:   [N] instincts loaded
VIOLATIONS: [N found | NONE]
NEXT:       cert-build | cert-fix | cert-feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## MUST-VERIFY (before declaring /cert-enforce complete)

```
☐ STEP 0.5 — Language rules loaded: "TS-001..TS-011 loaded (11 rules)" OR "[lang] not TypeScript — skip"
☐ STEP 1   — Active adapters listed: at least one framework adapter named
☐ STEP 2   — Instincts loaded: "[N] instincts loaded" (0 is valid if none exist)
☐ STEP 3   — Violations table shown OR "VIOLATIONS: NONE"
☐ STEP 4   — Completion block rendered with ADVISORY + VIOLATIONS + NEXT
```

If VIOLATIONS > 0: do not proceed to cert-verify. Fix violations first.
If any box cannot be checked → the step did not run — diagnose before proceeding.

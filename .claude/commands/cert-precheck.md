╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-precheck  |  v1.0  |  TIER: 1  |  BUDGET: LEAN      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Pre-work Gate)                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ PIPELINE      ║ cert-blueprint → cert-enforce  (sequential, atomic)  ║
║ CAN           ║ - Run full pre-work gate in a single command         ║
║               ║ - Load blueprints (WHAT) + enforce patterns (HOW)   ║
║               ║ - Produce unified SESSION CONSTRAINTS block          ║
║ CANNOT        ║ - Write code or modify source files                  ║
║               ║ - Skip either stage (both must run — no shortcuts)   ║
║ WHEN TO RUN   ║ - Before every feature, fix, or refactor session     ║
║               ║ - Replaces manually running cert-blueprint then      ║
║               ║   cert-enforce as two separate commands              ║
║ REPLACES      ║ /cert-blueprint + /cert-enforce run separately       ║
║ STACKS WITH   ║ /start (before) · /ship (after)                     ║
║ OUTPUTS       ║ - Active blueprint decisions (WHAT)                  ║
║               ║ - Active guardrails (HOW)                            ║
║               ║ - Unified SESSION CONSTRAINTS block                  ║
╚═══════════════╩══════════════════════════════════════════════════════╝

**The pre-work gate — one command, two layers.**
cert-blueprint tells you WHAT decisions apply (upstream intelligence, 163 decisions).
cert-enforce tells you HOW to apply them (stack patterns + local instincts).
They must always run together. This skill makes that impossible to forget.

Usage:
  /cert-precheck <module> "<task description>"
  /cert-precheck orders "add coupon discount endpoint"
  /cert-precheck auth "fix OTP expiry check"
  /cert-precheck --scan <module>   ← also scan staged files for violations

---

## WHY THIS EXISTS

Before v1.0, the standard pre-work flow was:
```
/cert-blueprint "add coupon endpoint"    ← WHAT decisions (must run)
/cert-enforce orders                     ← HOW decisions (must run)
```
Two commands. Both mandatory. Often one was skipped under time pressure.
cert-blueprint without cert-enforce = decisions without guardrails.
cert-enforce without cert-blueprint = guardrails without upstream context.
They are only meaningful together. This skill enforces that invariant.

---

## STAGE 1 — cert-blueprint

Run the full cert-blueprint flow for the provided task description.

**1A — Identify relevant blueprints**

Read the task description from $ARGUMENTS. Match against the blueprint map:

```
Task involves...              → Load blueprint
─────────────────────────────────────────────────
API endpoint design           → blueprint-api-design.md
Schema / Prisma model         → blueprint-database.md
Authentication / tokens / OTP → blueprint-auth.md
Any user input / webhooks     → blueprint-security.md
New module / service design   → blueprint-architecture.md
Docker / deploy / env config  → blueprint-deployment.md
Slow endpoint / optimization  → blueprint-performance.md
Bug investigation             → blueprint-debugging.md
Restructuring existing code   → blueprint-refactoring.md
Writing / reviewing tests     → blueprint-testing.md
Starting a new project        → blueprint-app-type.md + /cert-app-type
UI / visual work              → design-aesthetic.md
Full feature (design → ship)  → dev-blueprint.md (Phase 0→6)
```

All blueprints: `C:\luv\Cortex\adapters\blueprints\`

**1B — Surface active blueprint decisions**

For each loaded blueprint, output its critical NEVER/ALWAYS constraints.
Format follows cert-blueprint STEP 2 output block (concise — violations only, no padding).

---

## STAGE 2 — cert-enforce

Run the full cert-enforce flow for the provided module scope.

**2A — Load Cortex adapter patterns**

Detect stack from CLAUDE.md. Load matching patterns:
- NestJS project  → `C:\luv\Cortex\adapters\stack\typescript\backend\nestjs\nestjs-patterns.md`
- NestJS + Prisma → also `C:\luv\Cortex\adapters\stack\typescript\backend\nestjs\prisma-patterns.md`
- Next.js project → `C:\luv\Cortex\adapters\stack\typescript\frontend\nextjs\nextjs-patterns.md`

Detect domain from CLAUDE.md and module name. Load matching domain adapter:
- orders / cart / payments → `C:\luv\Cortex\adapters\domains\ecom-india\ecom-orders.md` + `ecom-payments.md`
- coupons               → `C:\luv\Cortex\adapters\domains\ecom-india\ecom-coupons.md`
- tax / invoices        → `C:\luv\Cortex\adapters\domains\ecom-india\ecom-tax.md`

**2B — Load local project instincts**

Read `ai/learning/instincts.json`.
Filter by: module match + confidence ≥ 0.7 + graduated: true.

**2C — Build enforcement set**

```
all_patterns[] = adapter_patterns[] + graduated[] + high_confidence[]
```

Filter to current module scope.

---

## UNIFIED OUTPUT

```
⚡ CERT-PRECHECK — [module] — [task] — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STAGE 1 — BLUEPRINT LAYER (WHAT to decide, and WHY)
────────────────────────────────────────────────────
Blueprints loaded: [N]  Active decisions: [N]

[BLUEPRINT: api-design]   ← if relevant
  ✖ NEVER [critical violation]
  ✔ ALWAYS [critical requirement]

[BLUEPRINT: security]   ← if relevant
  ✖ NEVER [critical violation]
  ✔ ALWAYS [critical requirement]

[... all loaded blueprints ...]

STAGE 2 — GUARDRAIL LAYER (HOW to write it correctly)
────────────────────────────────────────────────────
Adapter patterns: [N]  Local instincts: [N]

CRITICAL guardrails [confidence ≥ 0.9]:
  ✖ [instinct-id] — [title]
    Rule:    [what must never happen]
    Fix:     [correct approach]

ACTIVE guardrails [confidence 0.7–0.89]:
  ⚠ [instinct-id] — [title]
    Rule:    [what must never happen]
    Fix:     [correct approach]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CONSTRAINTS ACTIVE — [module]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALL code written this session must comply with:

From blueprints:
  ✖ NEVER [blueprint violation 1]
  ✖ NEVER [blueprint violation 2]
  ✔ ALWAYS [blueprint requirement 1]
  ✔ ALWAYS [blueprint requirement 2]

From guardrails:
  ✖ NEVER [instinct rule 1]
  ⚠ ALWAYS [instinct rule 2]

VIOLATIONS: [N found | NONE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT: Write code · /do "<task>" · /fix "<error>"
      All code written is now constrained by the above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SCAN MODE (--scan flag)

If `--scan` provided: after both stages, grep recently modified files for violations
from both the blueprint scan table AND the cert-enforce pattern table.

Output violations in unified format — source labeled (BLUEPRINT or GUARDRAIL):
```
🔴 VIOLATION [BLUEPRINT: database] — Float money type detected
   File:    src/modules/orders/orders.service.ts  Line: ~42
   Pattern: `price: Float` in Prisma schema
   Fix:     Use Decimal(10,2) — never Float for money

🔴 VIOLATION [GUARDRAIL: wrap-order-create-in-transaction]
   File:    src/modules/orders/orders.service.ts  Line: ~87
   Pattern: prisma.order.create + prisma.payment.create NOT in $transaction
   Fix:     Wrap both writes in prisma.$transaction([...])
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:       cert-precheck v1.0
STATUS:      COMPLETE
MODULE:      [module]
BLUEPRINTS:  [N loaded] — [N] active decisions
GUARDRAILS:  [N critical] · [N active] · [N advisory]
VIOLATIONS:  [N found | NONE]
NEXT:        Build with session constraints active.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## INSTALL

```bash
# Tier 1 — install to all Cortex projects
cp C:\luv\Cortex\skills\cert-precheck.md [project]\.claude\commands\cert-precheck.md
```

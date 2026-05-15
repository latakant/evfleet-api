╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cert-physics  |  v1.0  |  TIER: 1  |  BUDGET: FOCUSED      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ Phase 0 — Physics Validation (pre-blueprint)        ║
║ AUTHORITY     ║ ARCHITECT                                           ║
║ CAN           ║ - Read PRD, BOUNDARY.md, gaps.md, ai/, MASTER.md   ║
║               ║ - Produce CPED (Cortex) or PED (projects)          ║
║               ║ - Write output to ai/CPED.md or ai/PED.md          ║
║               ║ - Run Layer Contract Check against existing blueprint║
║               ║ - Propose MASTER.md patches (never write directly)  ║
║ CANNOT        ║ - Modify PRD, BOUNDARY.md, or MASTER.md directly   ║
║               ║ - Skip any of the 6 checks                         ║
║               ║ - Write vague laws (see LAW VALIDITY TEST)          ║
║               ║ - Promote a law without a measurable consequence    ║
║               ║ - Write MASTER.md without human governance review   ║
║ WHEN TO RUN   ║ - On Cortex itself first (ADR-PHYSICS-001)         ║
║               ║ - Before cert-blueprint on any new project          ║
║               ║ - Retroactively on existing projects for diagnosis  ║
║ OUTPUTS       ║ - ai/CPED.md (Cortex self-audit)                   ║
║               ║   ai/PED.md (project audits)                       ║
║               ║ - Layer Maturity Score — Physics column             ║
║               ║ - MASTER.md patch proposals (not direct writes)    ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Physics Validation. Runs before domain extraction and blueprint.
Purpose: ensure causal laws of the domain are formally declared before
a state machine is designed. Blueprint precision on wrong physics is expensive.
Governance without self-physics is doctrine without causality.

ADR: knowledge/ADR-PHYSICS-001-cortex-self-physics.md

---

## LAW VALIDITY TEST

Before writing any law, it must pass all four tests. Fail any one → discard.

  TEST 1 — Observable:    Verifiable from domain knowledge alone, without building
  TEST 2 — Causal:        "X causes Y" — NOT "X is important"
  TEST 3 — Measurable:    Systemic consequence traceable to a metric, state, or entity
  TEST 4 — Falsifiable:   A scenario exists where this law could be violated

Reject immediately:
  ✗ "Trust is important"               — fails TEST 2 (not causal)
  ✗ "Quality should be high"           — fails TEST 2 + TEST 3
  ✗ "Customers expect transparency"    — fails TEST 1 + TEST 3

Accept:
  ✓ LAW-P1: Fabric cut is irreversible → cutting without verified measurements
             destroys fabric permanently. System consequence: explicit gate required.
  ✓ LAW-P4: False-positive governance destroys adoption faster than false-negative
             → one unjustified block trains permanent bypass behavior.
             System consequence: BLOCK reserved for invariants only.

---

## LAW DELTA REQUIREMENT

A valid cert-physics run MUST produce at least one law not already obvious
from the PRD title or domain name alone.

If every law could have been written by anyone who read the product name,
cert-physics has produced description, not physics.

Delta test: Cover the PRD. Can you still derive this law from first principles?
  Yes → potential real law.
  No  → PRD paraphrase. Discard.

Failure (food delivery):
  ✗ "Delivery takes time" — obvious, not causal, not a law

Valid (food delivery):
  ✓ "Cold-chain breach after 45 minutes creates exponential refund risk
     because perceived freshness degrades non-linearly → a system without
     time-stamped handoff records cannot attribute responsibility or prevent
     dispute escalation at scale"

If delta = 0 after a full run:
  Document null result. Do not force laws to justify the tool.
  cert-physics may be unnecessary overhead for this project at this stage.

---

## STEP 0 — LOAD SOURCE

For Cortex self-audit:
  Read: core/MASTER.md · HEALTH.md · skills/ directory · ai/ · docs/instinct-system.md
  Domain: AI governance itself
  Output target: ai/CPED.md

For project audit:
  Read (in priority order):
    1. ai/idea-brief.md     (if cortex-intake ran)
    2. PRD.md
    3. BOUNDARY.md
    4. ai/gaps.md           (compare cert-physics output against this for delta)
    5. schema.prisma        (if exists — for CHECK 5)
    6. $ARGUMENTS           (raw idea text if no files exist)
  Output target: ai/PED.md

If none exist: ask "Describe the domain in 2–3 sentences."

---

## STEP 1 — CHECK 1: Finite & Irreversible Resources

"What resources in this domain cannot be recovered once consumed?"

Resource types to examine:
  Physical:  fabric, raw materials, appointments, physical inventory
  Economic:  cash margin, advance payments, refund capacity, credit
  Trust:     first impressions, customer goodwill, professional reputation
  Time:      deadlines, SLA windows, regulatory periods, session context

For each resource found:
  → Which action consumes it?
  → Is consumption reversible or terminal?
  → Write LAW-P[N] if terminal consumption can happen without an explicit system gate

---

## STEP 2 — CHECK 2: Time Decay & Trust Vectors

"Where does the passage of time erode value, quality, or trust?"

Look for:
  - States where idle time increases anxiety or dispute probability
  - Delays that raise escalation probability non-linearly
  - SLA breaches that trigger multiplied support cost
  - Information or pricing that becomes stale and misleads decisions

For each decay vector:
  → State the trigger (state, event, or inaction)
  → State the decay shape: linear / threshold / exponential
  → Write LAW-P[N] if the system has no mechanism to detect or surface the decay

---

## STEP 3 — CHECK 3: Human Variance Compounding

"Where does human skill variance compound across sequential steps?"

Look for:
  - Same actor correcting their own error (anchored to the original mistake)
  - Manual inputs with no reference validation (measurements, pricing, estimates)
  - Judgment calls made under time pressure or incomplete information
  - Role handoffs that introduce interpretation variance

For each compounding point:
  → State actor, action, compounding mechanism
  → Write LAW-P[N] if the system allows compounding without a guard or circuit breaker

---

## STEP 4 — CHECK 4: Failure Economics

"What is the actual cost of each major failure mode?"

For each failure mode (from PRD or domain derivation):
  → Direct cost:    refund, redo, material loss, penalty
  → Indirect cost:  ops time, investigation, delay to next unit of work
  → Trust cost:     customer churn probability × estimated lifetime value
  → Classify:       SURVIVABLE vs CATASTROPHIC at operational scale

Write LAW-P[N] for each CATASTROPHIC failure mode where the system has
no prevention mechanism AND no cost-attribution mechanism.

---

## STEP 5 — CHECK 5: Pricing & Economic Consistency

"What economic laws must hold for the business model to remain solvent?"

For each economic invariant:
  → State the law (e.g. "per-order margin must be computable")
  → Is it computable from the current data model (even if not built yet)?
  → If not: which field or entity is missing?

Write LAW-P[N] for each law where the data model cannot support computation.
A business model whose economics are not computable is pre-rational, not pre-scale.

---

## STEP 6 — CHECK 6: Irreversibility Map

"Which state transitions cannot be undone, and are they properly gated?"

For each irreversible transition:
  → What makes it irreversible? (resource consumed, obligation created, signal sent)
  → Is there an explicit approval gate before the transition?
  → Is irreversibility clearly signalled in the UI — not just blocked, but communicated?
  → Write LAW-P[N] if gate is absent OR if UI does not signal the point of no return

---

## STEP 7 — WRITE OUTPUT

For Cortex self-audit → ai/CPED.md:

```
# CPED — Cortex Physics Enforcement Document
# Version: 1.0 · Date: [date] · cert-physics v1.0

## Section A — Constraint Laws

| ID      | Causal statement                    | Consequence if violated        | Coverage          |
|---------|-------------------------------------|--------------------------------|-------------------|
| LAW-P1  | [Observable fact] → [causal chain]  | [Measurable consequence]       | ✅ / ⚠️ Gap / ❌ Missing |

## Section B — Failure Modes

| Mode               | Violated Law | Observable Symptom                  | Current Risk |
|--------------------|--------------|-------------------------------------|--------------|
| [FAILURE-MODE]     | P[N]         | [Observable symptom]                | HIGH/MED/LOW |

## Section C — Proposed Sacred Invariants

SC-[N]: [Invariant statement] — proposed for MASTER.md, pending human review

## Proposed MASTER.md Patches

[List specific text changes to MASTER.md — these are proposals only]
[Each patch requires human governance council review before applying]

## Layer Maturity — Physics

Score: [0–100]
Deductions: −15 per ❌ Missing · −7 per ⚠️ Gap · −5 per failure mode with no detection

  90–100: Physics fully enforced. Proceed.
  70–89:  Physics mostly covered. Proceed with gaps noted.
  50–69:  Physics gaps are structural. Address before blueprint.
  < 50:   Physics critically absent. Do not blueprint. Do not code.
```

For project audit → ai/PED.md:

```
# PED — Physics Enforcement Document
# Project: [name] · Date: [date] · cert-physics v1.0

## Physics Laws

| ID      | Causal statement                    | Consequence if violated        | Mapped to system? |
|---------|-------------------------------------|--------------------------------|-------------------|
| LAW-P1  | [Observable fact] → [causal chain]  | [Measurable consequence]       | ✅ / ⚠️ Gap / ❌ Missing |

## Layer Maturity — Physics

Score: [0–100]
[Same deduction rules as CPED]

## Gaps to Resolve Before Blueprint

[Each LAW with ❌ or ⚠️ with recommended resolution]
```

---

## STEP 8 — PRINT SUMMARY

After writing output file, print to session:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cert-physics complete
Project:        [name]
Laws found:     [N]  (target: 4–8 · >10 = over-enumeration)
  Enforced ✅:  [N]
  Gap ⚠️:      [N]
  Missing ❌:   [N]
Physics score:  [0–100]
Maturity:       WEAK / PARTIAL / SOLID
Delta test:     [N] non-obvious laws surfaced
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If Maturity = SOLID: "Physics layer solid. Proceed to /cert-blueprint."

If Maturity = PARTIAL: "Physics partially covered. Noted gaps should be
addressed before blueprint or explicitly accepted as v1 limitations."

If Maturity = WEAK: "⚠ Physics layer weak. Blueprint may have hidden violations.
Run validation test before proceeding. This run does not block (enforcement
gate pending Week 2 TailorGrid validation)."

If Delta = 0: "No non-obvious laws surfaced. Document null result.
cert-physics may be overhead for this project at this stage."

---

## LAYER CONTRACT CHECK (post-blueprint, run separately)

After blueprint exists, check CPED/PED against it:

CONTRACT-1 — Math respects Physics:
  Each LAW-Pn must map to a state machine guard, field, or constraint.
  FAIL: any irreversibility law has no approval gate
  FAIL: any trust decay law has no SLA field or alert mechanism

CONTRACT-2 — Engineering respects Math:
  Each state in transition matrix must have a frontend representation.
  Each API guard must be unreachable through valid frontend paths.
  FAIL: any state has no frontend treatment (this alone caught TailorGrid's gate breach)
  FAIL: any backend guard bypassed by a frontend transition

CONTRACT-3 — Business respects Engineering:
  Each revenue/cost claim must be computable from the schema.
  FAIL: margin not computable from existing tables
  FAIL: any economic law in CPED/PED has no data model support

Verdict: CONTRACT PASS / WARN / BLOCK
BLOCK halts build start. Not a suggestion.

---

## VALIDATION CRITERION

Week 2 — TailorGrid retroactive run:
  Compare PED output to existing tailorgrid/ai/gaps.md
  VALIDATED if: PED surfaces ≥ 2 meaningful laws NOT in gaps.md
  NULL RESULT if: PED surfaces 0 delta
  On NULL RESULT: document honestly, do not integrate into cert-blueprint

Expected TailorGrid delta (hypothesis — cert-physics should surface):
  LAW-P2: SLA trust decay per idle state (NOT in gaps.md)
  LAW-P3: Redo by same tailor compounds original error probability (NOT in gaps.md)
  LAW-P4: Manual pricing without catalog FK makes per-order margin uncomputable
          (gaps.md noted payment absence — not the causal economic law)

---

## MUST-VERIFY BEFORE MARKING COMPLETE

  ☐ All 6 checks run — none skipped
  ☐ Delta test passed — at least one non-obvious law surfaced
  ☐ Every law: ID · causal statement · measurable consequence · mapping status
  ☐ No vague laws accepted (rejected on detection, reason noted)
  ☐ Output file written (CPED.md or PED.md) with correct section structure
  ☐ Layer Maturity Score computed and printed
  ☐ For Cortex self-audit: proposed MASTER.md patches listed (not written directly)

---

## MODEL HINT

Requires Sonnet-level causal reasoning. Do not route to Haiku.
Causal precision degrades significantly on smaller models.
Target: 4–8 laws per project.
> 10 laws = over-enumeration — merge or discard the weakest.

╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-brief  |  v1.0  |  TIER: 1  |  BUDGET: STANDARD  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Business) · L1 (Intent) · L2 (Planning)        ║
║ AUTHORITY     ║ ARCHITECT                                           ║
║ CAN           ║ - Ask 15 intake questions conversationally          ║
║               ║ - Score the idea across 5 dimensions               ║
║               ║ - Produce 3 output files from a single run         ║
║               ║ - Halt cleanly on PIVOT or ABANDON                 ║
║ CANNOT        ║ - Generate architecture or code (→ /cortex-blueprint)
║               ║ - Skip validation — it runs on every idea          ║
║               ║ - Produce files on a PIVOT/ABANDON result          ║
║               ║ - Inflate scores to seem encouraging               ║
║ WHEN TO RUN   ║ - First skill on any new idea, before everything   ║
║               ║ - When an idea is still in "analogy" form           ║
║               ║ - When founder can't write a structured brief       ║
║ OUTPUTS       ║ - ai/business-blueprint.md (founder/investor view)  ║
║               ║ - ai/PRD.md (what to build)                        ║
║               ║ - ai/marketing-brief.md (for marketing team)       ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Business Entry Skill. Single run from raw idea to three deliverables.

The problem it solves:
  Cortex has separate skills for intake, validation, and proposal.
  A founder with a new idea had to know the sequence: cortex-intake →
  cortex-validate → cortex-propose — and understand why each step exists.
  This skill collapses that sequence into one run.

What it is NOT:
  → It does not replace /cortex-blueprint (architecture, domains, state machines)
  → It does not replace /cert-physics (causal law validation before blueprint)
  → It is the BEFORE — business sense check before any technical work begins

$ARGUMENTS

Parse from $ARGUMENTS:
  - Free-form idea text (optional — if given, use as starting context for Q1)
  - `--fast` — ask only Q1–Q8 (core primitives, skip refinement questions)
  - `--strict` — raise ABANDON threshold: score < 6 → ABANDON (default: < 4)
  - `--skip-validation` — output files without running 5-dimension validation
                          (use only when idea has been externally validated)

---

## PHASE 1 — INTAKE

Convert the founder's raw idea into system primitives.
One question at a time. Do NOT dump all questions at once.

After each answer:
  - Acknowledge what was learned (one line)
  - Extract the system primitive it reveals
  - Ask the next question

If an answer is vague, ask ONE clarifying follow-up. Not more.
Tone: direct and curious, not bureaucratic.

### Q1 — The Problem
"What problem are you solving? Be specific — whose problem, and what exactly
goes wrong today?"
Extracts: `problem` + initial `actors` hint

### Q2 — Who Has the Problem
"Who are the different types of people in your system? Think about everyone
who will use it or be affected by it."
Extracts: `actors[]` — becomes roles and permissions

### Q3 — Your Solution
"What is your solution in one sentence? Not the features — the core idea."
Extracts: `productType` — maps to Cortex domain catalogue

### Q4 — The Core Transaction
"What is the ONE main action your system enables? Every product has one core
transaction — what is yours?"
Examples: Uber → ride booking · Amazon → product purchase · TailorGrid → garment order
Extracts: `coreTransaction` → main entity + workflow trigger

### Q5 — The Objects
"What are the main 'things' in your system? List the objects that get
created, stored, or tracked."
Extracts: `entities[]` — becomes database models

### Q6 — The Trigger
"What starts everything? What does a user DO to kick off the main process?"
Extracts: `workflowTrigger` → Step 1 of the state machine

### Q7 — What Happens Next
"Walk me through the steps after the trigger — what happens, in what order,
until the job is done?"
Extracts: `workflow[]` → state machine states

### Q8 — Approvals and Checkpoints
"Are there any steps where someone must approve or verify before the next
step can happen? Who approves what?"
Extracts: `approvalGates[]` → critical invariants

### Q9 — What Must Never Change
"Once something is recorded in your system, what information should be locked
and never editable?"
Examples: measurements after cutting begins · price at time of purchase
Extracts: `immutableFields[]` → Law 3 enforcement

### Q10 — What Could Go Wrong
"What are the 3 most likely things that could go wrong in your system — from
the user's perspective?"
Extracts: `failureModes[]` → Risk Analysis

### Q11 — Who Is Responsible When It Fails
"When something goes wrong, who owns fixing it — the platform, the user,
or someone else?"
Extracts: `ownershipRules` → dispute resolution + escalation design

### Q12 — How Users Find Things
"How do users discover what they're looking for — do they search, browse
categories, get recommendations, or something else?"
Extracts: `discoveryEngine` → Search / Browse / Feed / Recommendation

### Q13 — How the Platform Makes Money
"How does this business make money? Commission, subscriptions, one-time
purchase, ads, or something else?"
Extracts: `monetizationModel` → payment engine + billing design

### Q14 — Why Users Come Back
"Why would someone use this again tomorrow instead of going to a competitor?
What makes them return?"
Extracts: `retentionEngine` → engagement features, loyalty loops

### Q15 — The Hybrid Check
"Is your product similar to any existing product you know? Or a combination
of two things?"
Extracts: `platformArchetype` + `hybridDomains[]`

---

If `--fast` flag is set: ask Q1–Q8 only. Note: "Fast mode — refinement questions
(Q9–Q15) skipped. Some output sections will have lower confidence."

---

## PHASE 2 — VALIDATION

Score the idea across 5 dimensions. Weight shown in brackets.
Final score = weighted average. Do not inflate. Do not deflate. Score what the evidence supports.

### D1 — Problem Strength [30%]
- Specific and named user group, or vague?
- How often does it occur? (daily pain vs occasional inconvenience)
- How painful is it? (blocks workflow vs minor annoyance)
- Is the current solution truly inadequate?

Score: 0–3 vague/rare · 4–6 identifiable/occasional · 7–9 clear/frequent/bad alternative
       10 acute daily pain, well-defined group, no good alternative

### D2 — Market Reality [25%]
- Competitors exist? (yes = market validation · zero = maybe no market)
- Saturated or underserved?
- Can this product acquire users without massive spend?
- Timing: too early / right / too late?

Score: 0–3 no clear market or saturated with giants · 4–6 exists but crowded
       7–9 real/reachable/differentiated · 10 underserved + clear acquisition path

### D3 — Technical Feasibility [20%]
- Core complexity: CRUD vs real-time vs ML vs hardware
- Hard exotic dependencies?
- MVP buildable by small team?
- Regulatory risk?

Score: 0–3 cutting-edge AI/hardware/infra required · 4–6 specialized expertise needed
       7–9 standard web stack, known patterns · 10 achievable in weeks, no exotic deps

### D4 — Monetization Clarity [15%]
- Clear model? (subscription, commission, freemium, ads, one-time)
- Who pays and when?
- Willingness-to-pay plausible for this segment?
- Time to first revenue?

Score: 0–3 no model or asking free users to pay · 4–6 model exists but unclear
       7–9 clear model + known payer + plausible price · 10 obvious + multiple streams

### D5 — Execution Risk [10%]
- Top 3 ways this fails
- Any existential risks? (regulatory, trust, single dependency)
- Team fit?
- Feedback loop speed?

Score: 0–3 high existential risk no mitigation · 4–6 manageable with specific expertise
       7–9 low risk + known patterns + fast loop · 10 very low risk + many success paths

---

### Weighted Score + Recommendation

```
D1 Problem Strength    × 0.30 = [X]
D2 Market Reality      × 0.25 = [X]
D3 Technical Feasibility × 0.20 = [X]
D4 Monetization Clarity  × 0.15 = [X]
D5 Execution Risk        × 0.10 = [X]
──────────────────────────────────────
IDEA SCORE:                  [X.X / 10]
```

**PROCEED** — Score ≥ 7.0 AND no single dimension < 4
  → Continue to Phase 3. Generate 3 output files.

**PROCEED WITH CAUTION** — Score 5.5–6.9 OR one dimension < 4
  → Warn clearly. State which dimension is weak and why. Continue to Phase 3.
  → Flag the weakness in business-blueprint.md under "Known Risks".

**PIVOT** — Score 4.0–5.4 OR two dimensions < 4
  → Output pivot suggestions (change target user / monetization / scope).
  → STOP. Do not generate output files.
  → Tell the founder: refine the idea → run /cortex-brief again.

**ABANDON** — Score < 4.0 OR any existential risk flagged
  → Output honest breakdown of what is fundamentally broken.
  → STOP. Do not generate output files.
  → Do not soften the assessment. Founders who skip validation waste months.

On PIVOT or ABANDON: print the validation report, state the recommendation,
and stop. Do not proceed to Phase 3.

With `--strict` flag: ABANDON threshold raised from < 4.0 to < 6.0.
With `--skip-validation` flag: skip Phase 2 entirely, proceed to Phase 3.

---

## PHASE 3 — OUTPUT

Write three files. Run in sequence — each builds on the last.

---

### FILE 1 — `ai/business-blueprint.md`

Audience: founder, investor, non-technical stakeholders.
Language: plain English — zero technical jargon. Outcomes only.

```markdown
# [Product Name] — Business Blueprint
> Source: /cortex-brief v1.0 · Date: [date]
> Idea Score: [X.X/10] · Recommendation: [PROCEED | PROCEED WITH CAUTION]

---

## What We're Building

[1 paragraph. User language only. What problem it solves, who it's for.
 Example: "TailorGrid lets customers in Indian cities place garment orders with
 verified tailors, track every step, and get the garment delivered. Tailors get
 a professional order management system instead of WhatsApp chaos."]

## Who It's For

[ICP — the specific person this is built for. Not "everyone".]
  Primary customer: [who, where, what problem exactly]
  Primary operator: [who manages/supplies, if different]

## Viability Assessment

Score: [X.X / 10]
  Strength:  [top 2 things working for this idea]
  Weakness:  [top 2 things working against it — honest]
  Verdict:   [PROCEED | PROCEED WITH CAUTION + what to watch]

## What We Build First (Phase 1 — MVP)

[Feature list in user language. No technical terms.]
  Customers can:
    - [action 1]
    - [action 2]
  Operators/tailors can:
    - [action 1]
  Admins can:
    - [action 1]

## Cost + Timeline

[Rough tiers — honest uncertainty band of ±30%]

  Solo developer:  [N–N weeks]   ₹[X]L – ₹[X]L
  2-person team:   [N–N weeks]   ₹[X]L – ₹[X]L
  Small agency:    [N–N weeks]   ₹[X]L – ₹[X]L

Note: Run /cert-estimate for a calibrated breakdown by module.

## What Comes After Launch (Phase 2)

[Growth features — NOT MVP. Only after traction confirmed.]
  - [feature]
  - [feature]

## Top 3 Risks (Plain English)

  1. [Risk] — Mitigation: [how to reduce it]
  2. [Risk] — Mitigation: [how to reduce it]
  3. [Risk] — Mitigation: [how to reduce it]

## What We Need From You

[Explicit list of founder actions before build begins]
  □ [Account to create / credential to get]
  □ [Decision to make]
  □ [Content or material needed]

---
## Next Steps

  Architecture →  /cortex-blueprint idea "[product]" app-type [type]
  Marketing   →  /cortex-position
  Estimate    →  /cert-estimate "[product]"
```

---

### FILE 2 — `ai/PRD.md`

Audience: developers and the architect. Technical precision matters.

```markdown
# [Product Name] — Product Requirements Document
> Source: /cortex-brief v1.0 · Date: [date]
> Status: DRAFT — pending /cortex-blueprint architecture approval

---

## Core Transaction

[The one action the system enables — single sentence]
Example: "A customer places a garment order that ops coordinates with a tailor."

## Actors + Roles

| Actor | Role | Key permissions |
|-------|------|-----------------|
| [Actor] | [role] | [can do X, cannot do Y] |

## State Machine — [Main Entity]

[Inferred from workflow steps]
[INITIAL_STATE] → [STATE_2] → [STATE_3] → ... → [TERMINAL]
[Alternative path to] → [CANCELLED / REFUNDED / REJECTED]

## Phase 1 — MVP Features

### [Module Name]
  Purpose: [one line]
  Features:
    - [feature 1 in product language]
    - [feature 2]
  Business rules:
    - [rule from Q9 immutability / Q8 approvals — precise]

[repeat for each module extracted from Q5 entities + Q7 workflow]

## Phase 2 — Growth Features (Deferred)

[Features NOT in MVP — only after traction confirmed]
  - [feature]
  - [feature]

## External Integrations

| Service | Purpose | When needed |
|---------|---------|-------------|
| [Razorpay / Stripe] | Payments | Phase 1 |
| [MSG91 / Twilio] | OTP / SMS | Phase 1 |

## Approval Gates

[From Q8 — human-in-the-loop points]
  Gate 1: [who approves what, at which state transition]
  Gate 2: [...]

## Immutable Fields

[From Q9 — must never change after creation]
  - [Entity].[field] — locked when [event]
  - [Entity].[field] — locked when [event]

## Out of Scope (Explicit)

[Adjacent ideas mentioned but NOT in this product]
  - [feature / product]
  - [feature / product]

---
## Next Steps

  Architecture →  /cortex-blueprint idea "[product]" app-type [type]
  Physics      →  /cert-physics        (before blueprint)
  Estimate     →  /cert-estimate "[product]"
```

---

### FILE 3 — `ai/marketing-brief.md`

Audience: marketing team. Gives them the direction to start — not a full strategy.
Full strategy: run /cortex-position after this.

```markdown
# [Product Name] — Marketing Brief
> Source: /cortex-brief v1.0 · Date: [date]
> This is a seed brief. Full strategy → /cortex-position

---

## ICP (Ideal Customer Profile)

[Specific person. Not "everyone".]
  Who:     [specific demographic / role / context]
  Where:   [geography / platform / channel they live on]
  Problem: [exact pain, in their words if possible]
  Current solution: [what they do today — and why it's inadequate]

## Problem Statement (In Their Voice)

[1–2 sentences as the customer would say it, not how the product describes it]
Example: "I messaged three tailors on WhatsApp for a quote.
One replied after 3 days. The other two never did."

## Core Message

[The outcome the product delivers — 1 sentence, ICP language]
Example: "Your garment, tracked and delivered — no more WhatsApp chaos."

## Positioning Seed

FOR [ICP segment]
WHO [specific problem they have]
[Product name] IS THE [category they already understand]
THAT [the one thing you do better than the current alternative]

[Full positioning: run /cortex-position]

## Top 3 Objections + Initial Counter

  1. "[Objection]" → [Counter — specific, not vague]
  2. "[Objection]" → [Counter]
  3. "[Objection]" → [Counter]

## Demand Signal

  Does this ICP actively search for a solution to this problem?
  [YES → SEM + SEO first | NO → SMM + content SEO first]

## Initial Channel Direction

[Based on demand signal above — NOT a full strategy]
  Primary channel: [SEO / SEM / SMM organic]
  Reason: [one sentence]
  First concrete action: [the one thing to do this week]

  Full channel strategy: run /cortex-position

## What Marketing Needs to Start

  □ [Testimonial / case study if exists]
  □ [Budget range (monthly)]
  □ [Brand name confirmed?]
  □ [Domain registered?]
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cert-brief complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product:       [name] · [type]
Idea score:    [X.X / 10]
Verdict:       [PROCEED | PROCEED WITH CAUTION]
Files written: ai/business-blueprint.md
               ai/PRD.md
               ai/marketing-brief.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Architecture:  /cert-physics → /cortex-blueprint
Marketing:     /cortex-position (brand + channel strategy)
Estimate:      /cert-estimate "[product]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On PIVOT:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PIVOT recommended — files not generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score:    [X.X / 10]
Weakness: [dimension + why]
Pivot:    [specific suggestion — change X to Y]
Next:     Refine the idea → run /cortex-brief again
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On ABANDON:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABANDON — files not generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score:  [X.X / 10]
Issue:  [what is fundamentally broken]
Next:   Fundamental rethink needed before any further work
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## MODEL HINT

Requires Sonnet-level reasoning for accurate viability scoring.
Do not route to Haiku — validation precision degrades on smaller models.
Expected run time: 15–25 min for a full idea. Fast mode: 8–12 min.

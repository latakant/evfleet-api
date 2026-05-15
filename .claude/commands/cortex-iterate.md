╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-iterate  |  v1.0  |  TIER: 2  |  BUDGET: MOD    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Blueprint) · L1 (Intent) · L2 (PRD)            ║
║ AUTHORITY     ║ ANALYST + ARCHITECT                                 ║
║ CAN           ║ - Accept user/market feedback as input              ║
║               ║ - Diff feedback against current blueprint + PRD     ║
║               ║ - Classify changes: MINOR / FEATURE / STRATEGIC     ║
║               ║ - Propose specific PRD + blueprint updates          ║
║               ║ - Flag if architecture must change (PA review)      ║
║ CANNOT        ║ - Write code or modify implementation files         ║
║               ║ - Skip architecture impact check for STRATEGIC      ║
║               ║ - Auto-approve changes that violate System Laws     ║
║ WHEN TO RUN   ║ - After shipping a version and collecting feedback  ║
║               ║ - When real users behave differently than expected  ║
║               ║ - When pivoting based on market signal              ║
║               ║ - Sprint retrospectives — before planning next iter ║
║ OUTPUTS       ║ - PRD diff · Change classification · Impact report  ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-iterate — Product Iteration Loop.

The gap this fills:
  Cortex builds products well. But real products change after launch.
  Users behave differently than planned. Market gives signals.
  Without a structured process, feedback becomes chaos.

  This skill closes the build → ship → learn → iterate loop.
  It takes raw feedback and converts it into precise product decisions.

The loop Cortex now covers:
  /cortex-intake → /cortex-validate → /cortex-blueprint → [build] → SHIP
        ↑                                                              ↓
        └──────────────── /cortex-iterate ←── user/market feedback ───┘

Input:
  → User feedback (raw text, support tickets, interview notes, metrics)
  → Current blueprint: ai/blueprint.md
  → Current PRD: ai/prd.md (if exists)

Output:
  → Classified change set
  → PRD diff (proposed updates)
  → Architecture impact assessment
  → Decision log entry (if STRATEGIC)

---

$ARGUMENTS

Parse from $ARGUMENTS:
- Free-form feedback text (paste directly)
- `--file <path>` — read feedback from file
- `--blueprint <path>` — blueprint to diff against (default: ai/blueprint.md)
- `--prd <path>` — PRD to diff against (default: ai/prd.md)
- `--output <path>` — write iteration report to (default: ai/iteration-[N].md)
- `--sprint <label>` — tag this iteration (e.g. "sprint-3" or "beta-week-2")

---

## STEP 1 — Load Current Product State

Read:
1. `ai/blueprint.md` — current architecture and domain map
2. `ai/prd.md` (if exists) — current feature set and user flows
3. Previous iteration reports (ai/iteration-*.md) — what changed last time

Build context summary:
```
CURRENT PRODUCT STATE
─────────────────────────────────────────────────────
Product:      [name from blueprint]
Version:      [sprint tag if provided, else "current"]
Domains:      [list from blueprint]
Core flows:   [list top 3 user journeys from PRD/blueprint]
Last changed: [from most recent iteration-*.md, or "first iteration"]
─────────────────────────────────────────────────────
```

---

## STEP 2 — Parse Feedback

Read the feedback input (file or $ARGUMENTS text).

Extract individual feedback items. Each item becomes a unit:

```
FEEDBACK ITEMS EXTRACTED
─────────────────────────────────────────────────────
[FBK-001]  "[quote or summary of feedback]"
           Source: [user quote / metric / interview / observation]
           Sentiment: [positive / negative / neutral]
           Frequency: [mentioned by 1 user / N users / systemic]

[FBK-002]  "[...]"
           ...
─────────────────────────────────────────────────────
Total items: [N]
```

Group by theme if multiple items share the same root:
```
THEME GROUPS
  Theme A — [label]: FBK-001, FBK-004, FBK-007  (N items)
  Theme B — [label]: FBK-002, FBK-005            (N items)
  ...
```

---

## STEP 3 — Classify Each Feedback Item

For each theme group (or individual item if no grouping):

Classify into one of three change types:

```
CHANGE TYPES
─────────────────────────────────────────────────────
MINOR      — Fixes within existing flows. No new entities, no flow change.
             Examples: copy change, UI tweak, error message improvement,
                       performance of existing feature, edge case handling.

FEATURE    — New capability within current product scope.
             Adds a new user action, new entity, new state, or new endpoint.
             Examples: "add wishlist", "add order notes", "add export to CSV".
             Blueprint gets a new domain or new endpoint. PRD gets new section.

STRATEGIC  — Changes core assumptions about who the user is, what the
             core transaction is, or what problem is being solved.
             Examples: new user role, pivot to B2B, change monetization model,
                       remove a domain, add a new product line.
             Requires PA review. May trigger /cortex-validate re-run.
─────────────────────────────────────────────────────
```

Output classification table:
```
CLASSIFICATION
─────────────────────────────────────────────────────
Theme / Item        Type        Confidence   Impact Area
─────────────────────────────────────────────────────
[Theme A]           MINOR       HIGH         checkout UX
[Theme B]           FEATURE     HIGH         orders domain
[FBK-003]           STRATEGIC   MEDIUM       monetization model
─────────────────────────────────────────────────────
MINOR:     [N] items
FEATURE:   [N] items
STRATEGIC: [N] items
─────────────────────────────────────────────────────
```

---

## STEP 4 — Diff Against Current Blueprint + PRD

For each FEATURE or STRATEGIC item, check what currently exists:

```
DIFF ANALYSIS
─────────────────────────────────────────────────────
[Theme B] — "users want order notes"
  Current:  Orders domain has no notes field in data model
  Gap:      No `notes` field on Order entity, no endpoint for it
  Change:   Add Order.notes (optional text) + PATCH /api/orders/:id/notes
  Law check: ✅ No law violations — single domain, simple field add

[FBK-003] — "users don't want to pay upfront, want invoice later"
  Current:  Monetization = pay at checkout (Razorpay + COD)
  Gap:      No deferred payment / invoice flow exists
  Change:   New payment state + invoice domain + payment terms entity
  Law check: ⚠️ Law 3 (Immutable Transactions) — invoice amounts must be
             locked at creation. Law 4 (State Machine) — need new payment states.
  Impact:   STRATEGIC — changes core payment flow, requires PA review
─────────────────────────────────────────────────────
```

---

## STEP 5 — Propose Updates

For each item, propose the minimal change:

### MINOR items:
Output a simple fix description. No blueprint change needed.
```
MINOR FIXES
─────────────────────────────────────────────────────
[Theme A] — Checkout UX confusion
  Fix: Update error message copy in checkout service
  Files: checkout.service.ts — update error text for insufficient stock
  Blueprint: No change
  PRD: No change
─────────────────────────────────────────────────────
```

### FEATURE items:
Output a PRD delta — exactly what section of PRD changes, what gets added.
```
FEATURE ADDITIONS
─────────────────────────────────────────────────────
[Theme B] — Order notes

PRD DELTA:
  Section: Orders → User Actions
  Add:     "User can add a note to an order at creation or while PENDING"
  Flow:    Cart → Checkout → [optional: add note] → Place Order

BLUEPRINT DELTA:
  Domain: orders
  Entity: Order — add `notes String? @db.Text`
  Endpoint: PATCH /api/orders/:id/notes (CUSTOMER, PENDING only)
  State machine: No new states needed

Run after approval:
  /dev-backend-schema — add notes field
  /dev-backend-endpoint — PATCH /orders/:id/notes
  /dev-backend-test — notes feature
─────────────────────────────────────────────────────
```

### STRATEGIC items:
Require explicit PA review before any action.
```
STRATEGIC CHANGES — PA REVIEW REQUIRED
─────────────────────────────────────────────────────
[FBK-003] — Deferred payment / invoice billing

This is a STRATEGIC change because:
  - Adds new payment state (INVOICED, INVOICE_SENT, INVOICE_PAID)
  - Adds new domain (invoices with deferred payment)
  - Changes core checkout flow assumption (pay-now → pay-later)

RISK:
  - Law 3 violation risk — invoice amounts must freeze at creation
  - Law 4 requires new state machine for deferred payment lifecycle
  - Existing orders will have null invoice_id — migration needed

Before building:
  1. Re-run /cortex-validate with updated monetization model
  2. Run /cortex-blueprint --validate-only against proposed changes
  3. PA approval required before any code

Do NOT implement without explicit approval.
─────────────────────────────────────────────────────
```

---

## STEP 6 — Architecture Impact Assessment

Summarize total architecture impact of this iteration:

```
ARCHITECTURE IMPACT ASSESSMENT
─────────────────────────────────────────────────────
Minor fixes:     [N] — no architecture change
Feature adds:    [N] — [list domains affected]
Strategic shifts: [N] — [PA review required for each]

New entities proposed:        [list or none]
New endpoints proposed:       [list or none]
State machines modified:      [list or none]
System Law concerns:          [list or none]
Schema migrations required:   [yes — [list] / no]
─────────────────────────────────────────────────────
OVERALL IMPACT: [LOW | MEDIUM | HIGH | STRATEGIC]
─────────────────────────────────────────────────────
```

---

## STEP 7 — Write Iteration Report

Write to `ai/iteration-[N].md` (auto-increment N):

```markdown
# Iteration Report — [sprint label or date]
> Generated by /cortex-iterate v1.0 | Date: [today]

## Feedback Summary
[Step 2 output]

## Change Classification
[Step 3 output]

## Diff Analysis
[Step 4 output]

## Proposed Updates
[Step 5 output]

## Architecture Impact
[Step 6 output]

---
## Human Decision Required

For each FEATURE item: approve before /cortex-blueprint delta is applied.
For each STRATEGIC item: PA review before any work begins.
For MINOR items: can proceed immediately.

Approved by: _______________
Date: _______________
```

---

## STEP 8 — Decision Log (STRATEGIC only)

If any STRATEGIC changes exist, prompt:
```
Strategic changes detected. Log the decision?
→ /cortex-decision log  (records reasoning for future projects)
```

Do not block — it's a prompt, not required.

---

## STEP 9 — Outcome Tracking

Append to `ai/learning/outcome-log.json`:

```json
{
  "iteration": "[sprint label or date]",
  "feedback_items": [N],
  "minor": [N],
  "feature": [N],
  "strategic": [N],
  "domains_affected": ["[list]"],
  "law_concerns": ["[list or none]"],
  "timestamp": "[ISO]"
}
```

This feeds `/cortex-learn` outcome analysis — over time, patterns emerge:
which domains generate the most post-launch feedback, which flows need
the most iteration, which features were over-engineered.

If file doesn't exist: create it as JSON array with this entry.
If file exists: append this entry to the array.

---

## LOG

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="ITERATE: sprint=[label] · items=[N] · minor=[N] · feature=[N] · strategic=[N] · impact=[LOW|MED|HIGH|STRATEGIC]"
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Iterate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS      : COMPLETE
Sprint      : [label or date]
Feedback    : [N] items → [N themes]
Minor fixes : [N] (implement now)
Features    : [N] (needs approval)
Strategic   : [N] (PA review required)
File        : ai/iteration-[N].md written
Next        : Review iteration-[N].md → approve features → /cortex-blueprint delta
              [if strategic: PA review first]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

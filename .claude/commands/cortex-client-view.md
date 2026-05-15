# /cortex-client-view — Client-Facing Project View
# skill: cortex-client-view | domain: governance | version: 1.0 | added: 2026-03-21
# Generate a lightweight, non-technical project status report for client or stakeholder delivery.

---

## TRIGGER

Use when:
- Client asks "where are we?" or "what's been done this sprint?"
- End-of-sprint or end-of-milestone delivery moment
- Preparing a stakeholder update (investor, product owner, founder)
- Responding to a "show me the value" question

Usage:
```
/cortex-client-view                → current sprint status report
/cortex-client-view milestone      → milestone / phase summary
/cortex-client-view health         → project health card (one page)
/cortex-client-view cost           → AI governance cost + value report
```

---

## WHAT THIS IS NOT

This skill does NOT produce internal dev reports.
Internal status → `/cert-report` or `/cert-status`
Sprint scoring → `/cert-score`
Bug analysis → `/cert-analyse`

This skill produces one thing: a clean, honest, non-technical view a client can understand and act on.

---

## EXECUTION

### MODE: sprint status (`/cortex-client-view`)

**STEP 1 — Read project state**

Read:
- `knowledge/STATUS.md` — sprint progress, open issues
- `knowledge/usage.json` — token cost if available
- `knowledge/instincts.json` — recurring patterns (optional, for insights section)

**STEP 2 — Produce report**

```
PROJECT STATUS — [project name]
Sprint [N] · [start date] → [end date]
════════════════════════════════════════════

COMPLETED THIS SPRINT
  ✅ [What was built — plain language, no code jargon]
  ✅ [Feature or fix — one line, what it does for the user]
  ✅ [...]

IN PROGRESS
  🔄 [What is being built now + expected completion]

BLOCKED / NEEDS DECISION
  ⚠️ [What is blocked — what decision is needed from client]
  (Empty if nothing blocked)

QUALITY INDICATORS
  Tests:     [N] passing · [N] added this sprint
  Bugs:      [N] fixed · [N] open (P1: [N] · P2: [N])
  Coverage:  [N]% overall

NEXT SPRINT PREVIEW
  → [Top 3 items planned for next sprint]

────────────────────────────────────────────
NOTES FOR CLIENT
  [Any decisions, risks, or questions that need client input — max 3 bullet points]
  (Leave empty if no action needed from client)
════════════════════════════════════════════
```

**PLAIN LANGUAGE RULE:**
- No technical terms (no "endpoint", "DTO", "migration", "Prisma", "NestJS")
- Translate: "fixed auth middleware bug" → "Fixed: users were being logged out unexpectedly"
- Translate: "added BullMQ retry logic" → "Improved: email delivery is now more reliable"
- If it has no visible user impact → omit or group under "Infrastructure improvements"

---

### MODE: milestone summary (`/cortex-client-view milestone`)

```
MILESTONE SUMMARY — [milestone name]
[start date] → [completion date]
════════════════════════════════════════════

OBJECTIVE
  [One sentence: what this milestone was meant to achieve]

DELIVERED
  ✅ [Capability 1 — what users can now do]
  ✅ [Capability 2]
  ✅ [...]

NOT DELIVERED (if any)
  ❌ [What was descoped — and why (brief, honest)]

QUALITY
  [N] features delivered · [N] bugs caught before launch
  [N] tests covering critical paths

WHAT'S NEXT
  → [Next milestone + its objective]
════════════════════════════════════════════
```

---

### MODE: health card (`/cortex-client-view health`)

One-page snapshot. Client can share this with stakeholders.

```
PROJECT HEALTH — [project name]
As of [date]
════════════════════════════════════════════

OVERALL   [GREEN ✅ | YELLOW ⚠️ | RED 🚫]

DIMENSIONS
  Progress:    [ON TRACK ✅ | BEHIND ⚠️ | AT RISK 🚫]
  Quality:     [HIGH ✅ | ACCEPTABLE ⚠️ | NEEDS ATTENTION 🚫]
  Stability:   [STABLE ✅ | SOME ISSUES ⚠️ | UNSTABLE 🚫]
  Decisions:   [0 pending ✅ | N pending ⚠️]

IN ONE SENTENCE
  [Honest plain-English summary: "The project is on track.
   We're building the payment flow this sprint.
   No blockers."]

OPEN QUESTIONS FOR CLIENT
  1. [Question — what we need from client to proceed]
  2. [...]
  (Leave empty if no questions)

RISKS ON RADAR
  [Risk — likelihood — mitigation]
  (Only include if real. Empty if none.)
════════════════════════════════════════════
```

**Health scoring rule:**
- GREEN: all P1 bugs resolved, tests passing, no decision blockers
- YELLOW: P1 bugs present OR decision blocked for 3+ days OR sprint behind by 20%+
- RED: production incident OR critical path blocked OR client decision overdue 7+ days

---

### MODE: cost report (`/cortex-client-view cost`)

Read `knowledge/usage.json`. Frame in business terms.

```
AI GOVERNANCE — VALUE REPORT
Sprint [N] · [project name]
════════════════════════════════════════════

WHAT THE GOVERNANCE LAYER DID THIS SPRINT
  • [N] code reviews run before any change was committed
  • [N] bugs caught before reaching production
  • [N] security checks on new endpoints
  • Full audit trail: every decision logged

COST
  AI token consumption: ~[N]K tokens
  Estimated cost: ~$[X] (₹[Y]) this sprint

VALUE DELIVERED
  Bugs prevented:    [N] × avg 2hr fix = [N] hours saved
  Production issues: 0
  Developer time on governance overhead: ~[N] hours (AI handled the rest)

ROI
  Governance cost:  ~$[X]
  Developer hours saved: [N] hours × $[rate] = $[saved]
  ROI ratio: [N]×

CONTEXT
  Without AI governance layer, the same review depth
  would require [N] hours/sprint of manual code review.
════════════════════════════════════════════
```

**If usage.json is missing:** use token-meter.md estimates based on skills run this session.

---

## TONE RULES

1. **Honest** — do not hide blockers or bad news. Frame clearly, not alarming.
2. **Short** — client report is one page. If it won't fit, cut.
3. **Action-oriented** — every open question should be phrased as a decision the client can make.
4. **No internal jargon** — this report could be read aloud in a 10-minute client call.
5. **No vanity metrics** — don't list "merged 14 PRs" or "resolved 22 Jira tickets" unless translated to user value.

---

## DELIVERY FORMAT

Default: plain text (can paste into email, Slack, Notion).
If client uses Notion: add `---` dividers as section breaks.
If client wants PDF: write to `knowledge/client-report-[sprint-N].md` for rendering.

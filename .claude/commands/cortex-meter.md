# /cortex-meter — Token Consumption Tracker
# skill: cortex-meter | domain: governance | version: 1.0 | added: 2026-03-21
# Track, budget, and report AI token consumption per project and per sprint.

---

## LOAD

Before executing: `core/token-meter.md`

---

## TRIGGER

Use when:
- Starting a session (budget check — is there headroom?)
- Ending a session (log session cost)
- Checking project spend mid-sprint
- Generating sprint cost report for client or self-review
- Investigating an unusually expensive session

Usage:
```
/cortex-meter                  → show current project budget + spend
/cortex-meter log              → log current session cost (run at session end)
/cortex-meter sprint           → sprint-to-date spend + projection
/cortex-meter report           → full cost report (sessions + skills + efficiency)
/cortex-meter set-budget       → configure budget for this project
```

---

## EXECUTION

### MODE: budget check (`/cortex-meter`)

Read `knowledge/usage.json` for current project.

Output:
```
TOKEN BUDGET — [project] · Risk [A/B/C/D]
══════════════════════════════════════════════════
Session budget:   [X]K tokens    Used: [Y]K ([Z]%)   [✅|⚠️|🚫]
Sprint budget:    [X]K tokens    Used: [Y]K ([Z]%)   [✅|⚠️|🚫]
Month budget:     [X]K tokens    Used: [Y]K ([Z]%)   [✅|⚠️|🚫]
──────────────────────────────────────────────────
Last session:     [date] · [tokens] tokens · [skills run]
Sprint sessions:  [N] sessions · avg [X]K tokens/session
Estimated cost:   ~$[X] this sprint · ~$[Y] this month
══════════════════════════════════════════════════
Status: [WITHIN BUDGET ✅ | APPROACHING LIMIT ⚠️ | OVER BUDGET 🚫]
```

**If APPROACHING LIMIT (≥ alert threshold):**
```
⚠️ TOKEN WARNING: [project] is at [Z]% of sprint budget.
   Remaining: ~[N]K tokens ≈ [N] standard sessions.
   Recommendation: prefer lean skills this session. Defer heavy analysis.
```

**If OVER BUDGET:**
```
🚫 TOKEN BUDGET EXCEEDED: sprint budget consumed.
   Continue? Heavy skills (cert-analyse, cert-audit) will exceed budget further.
   Lean work (cert-status, cert-daily) still within session budget.
   To reset: either increase sprint budget (/cortex-meter set-budget) or accept overage.
```

---

### MODE: log session (`/cortex-meter log`)

Called at session end. Estimates the session cost and writes to `knowledge/usage.json`.

**STEP 1 — Scratch Phase**
Write to `/tmp/cortex-meter-scratch.md`:
```
SESSION ID:      sess_[YYYYMMDD]_[NNN]
SKILLS RUN:      [list from this session]
CONTEXT FILES:   [adapter files, blueprints loaded]
OUTPUT VOLUME:   [estimate from session output]
VALUE PRODUCED:  [what was actually accomplished]
```

**STEP 2 — Estimate tokens**
```
Context tokens:   Σ(file_size_chars ÷ 4) for each file loaded
Skill tokens:     Σ(skill_tier_midpoint) for each skill run
Output tokens:    approximate output character count ÷ 4
Total estimate:   context + skills + output
```

Skill tier midpoints:
- Lean: 1,000 tokens
- Standard: 5,000 tokens
- Heavy: 14,000 tokens

**STEP 3 — Efficiency rating**
```
< 20K tokens + concrete output:    efficient
20K–60K tokens + concrete output:  standard
> 60K tokens:                      heavy (flag for review if no major output)
Same problem addressed twice:       inefficient (flag)
```

**STEP 4 — Write to usage.json**
Append session entry. Update sprint_total and month_total.

**STEP 5 — Output**
```
SESSION LOGGED — [date]
  Estimated tokens:   [N]K
  Skills run:         [list]
  Efficiency:         [efficient|standard|heavy]
  Sprint total:       [N]K / [budget]K ([Z]%)
  Cost estimate:      ~$[X]
```

---

### MODE: sprint report (`/cortex-meter sprint`)

Read all session entries for the current sprint period.

Output:
```
SPRINT TOKEN REPORT — [project] · Sprint [N]
══════════════════════════════════════════════════
Sessions:         [N] total
Total tokens:     [N]K estimated
Total cost:       ~$[X]
Budget used:      [Z]% of [budget]K

BREAKDOWN BY SESSION:
  [date]  [tokens]K  [top skill]  [value produced]
  [date]  [tokens]K  [top skill]  [value produced]
  ...

MOST EXPENSIVE SESSIONS:
  1. [date] — [N]K tokens — [why: heavy skill or multiple skills]
  2. [date] — [N]K tokens — [why]

EFFICIENCY TREND:
  Sessions improving:  [N]  (token cost going down, same output quality)
  Sessions flagged:    [N]  (high cost, low output)

PROJECTION:
  At current rate: sprint will end at [N]K tokens ([Z]% of budget)
══════════════════════════════════════════════════
```

---

### MODE: set budget (`/cortex-meter set-budget`)

```
Current project: [name]
Risk category:   [A/B/C/D]

Default budgets for Risk [X]:
  Session: [N]K · Sprint: [N]K · Month: [N]K

Adjust? Enter custom values or press Enter to accept defaults.
```

Writes to `knowledge/usage.json` budgets field.

---

## INTEGRATION WITH /start

The pipeline view in `/start` includes one token budget line:

```
Tokens    [sprint_used]K / [sprint_budget]K ([Z]%) · est. ~$[X] this sprint
```

This is the only line. Compact. Just enough to know if you're in budget.
Full detail: `/cortex-meter`

---

## INTEGRATION WITH cert-report

`cert-report` includes a cost section:

```
## COST (AI Governance)
Sprint token consumption: [N]K tokens · ~$[X]
Per-session average: [N]K tokens
Efficiency: [N]% of sessions rated efficient or standard
Budget status: [WITHIN ✅ | WARNING ⚠️ | OVER 🚫]
```

For client-facing reports: frame as governance overhead with value delivered.
"AI governance: $[X] this sprint · prevented [N] bugs · 0 production incidents"

---

## ROI FRAMING

Token cost compared to developer time saved:

```
Average hourly rate (India, mid-level developer): ₹1,500–2,500/hour
                    (Global SaaS rate):            $50–100/hour

Typical cert-bug session: ~50K tokens · ~$0.27
Developer debugging same bug without governance: 1–3 hours
ROI ratio: 200–1,100× cost savings on a single bug fix

Typical sprint governance: ~600K tokens · ~$3.24
Value: 0 production incidents + full audit trail + consistent code quality
ROI: 1 avoided production incident = 4–8 hours debugging = $200–800 saved
     vs $3.24 in tokens
```

Include this framing in client proposals and sprint reports.
It answers: "Why are we paying for AI governance?"

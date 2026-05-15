Generate CORTEX stakeholder reports — one for founders (non-technical) and one for developers.

HARD RULE — SINGLE SOURCE OF TRUTH:
  ALL metrics (test counts, scores, endpoints, models) come from `ai/STATUS.md`.
  Never write a number into a report from memory, a previous session, or a prior report.
  If STATUS.md is stale → run /cortex-verify (Phase 6) first to sync it, then report.
  Reports are readers, not holders. They propagate STATUS.md — they never own data.

---

**STEP 0 — Verify STATUS.md is current (always run first)**

Read `ai/STATUS.md`. Check the "Last governance run" date.
If it is not today → WARN: "STATUS.md may be stale. Run /cortex-verify to sync metrics before generating this report."
Do NOT block report generation — warn and proceed. But flag it clearly.

---

**STEP 1 — Gather data**
Read: `ai/STATUS.md` ← PRIMARY SOURCE for all counts and scores
Read: `ai/state/current-score.json`
Read: `ai/state/open-issues.json`
Read: `ai/TRACKER.md` (last 3 session entries only)
Read: `ai/learning/module-health.json`
Run: `node scripts/lifecycle.js timeline` (last 14 days of changes)
Run: `node scripts/generate-founders-report.js` (auto-generates founder brief)

---

**STEP 2 — Produce Founder Brief** (plain English, non-technical)

```
FOUNDER STATUS BRIEF — [today's date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Launch Ready:   [YES / NO] — Score: [X/100]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What's done:
  • [from TRACKER.md — most impactful recent change]
  • [second most impactful]
  • [third]
What's left:
  • [open issues in plain language — no jargon]
Risk level:     [None / Low / Medium / High]
Risk reason:    [one sentence max]
Next step:      [one clear, specific action]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**STEP 3 — Produce Dev Workload** (technical, file-path level)

```
DEV WORKLOAD PLAN — [today's date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority  ID        File:line                     What              Path
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIGH      [ID]      [file:line]                   [description]     TRIVIAL/FEATURE/ARCH
MEDIUM    [ID]      [file:line]                   [description]     TRIVIAL/FEATURE/ARCH
LOW       [ID]      [file:line]                   [description]     TRIVIAL/FEATURE/ARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Module Health (from learn.js):
  Improving:  [modules]
  Stable:     [modules]
  Degrading:  [modules — these need attention first]
```

---

**STEP 4 — Write reports to disk**
Update: `ai/reports/founders/STATUS_BRIEF.md`
Update: `ai/reports/dev/WORKLOAD_PLAN.md`

---

**STEP [LOG] — Record report generation to System 2**

Run: `node scripts/lifecycle.js log --action=INSIGHT --module=cortex --detail="REPORT_GENERATED: score=[X/100] decision=[ALLOW/BLOCK] open_issues=[X high/X medium/X low] degrading_modules=[list or none]"`

Update `ai/learning/skill-usage.json`:
- Increment `invocations.cortex-report.count` by 1
- Set `invocations.cortex-report.last` to today's date
- Set `last_updated` to today's date

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-report                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files      ai/reports/REPORT-FOUNDER-{date}.md · REPORT-DEV-{date}.md
Score      {X}/100  |  Decision: {ALLOW/BLOCK}
Degrading  {module names | NONE}
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       Share founder brief with stakeholders | /cortex-analyse to prioritise
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

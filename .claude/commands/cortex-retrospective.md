╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-retrospective  |  v1.0  |  TIER: 1  |  BUDGET: LEAN ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ AUTHORITY     ║ OBSERVER + limited WRITE (retrospective.md only)     ║
║ CAN           ║ - Review all 9 projects' REGISTRY status             ║
║               ║ - Run promote-patterns, read skill git log           ║
║               ║ - Score all 4 confidence holds                       ║
║               ║ - Write docs/retrospective.md                        ║
║ CANNOT        ║ - Modify skills · Commit changes · Modify REGISTRY   ║
║ WHEN TO RUN   ║ - Monthly (first session of each month)              ║
║               ║ - Before any version bump                            ║
║               ║ - After 3+ governed sessions on any project          ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-retrospective — Monthly Cortex health review.

Surfaces what Cortex caught, what it missed, whether confidence has moved,
and whether any part of the framework has gone stale or needs pruning.
Output: `docs/retrospective.md` with delta from last month.

---

## STEP 1 — Load Baseline

Read `docs/retrospective.md` if it exists. Extract:
- Previous confidence score (N/10)
- Previous date
- Previous hold scores (H1..H4)
- Previous registry summary

If no previous file: this is the **first run**. State so explicitly.
All deltas will be N/A. Skip delta columns.

---

## STEP 2 — Registry Pulse

Read `REGISTRY.json`. For each of the 9 projects, produce:

```
╔══════════════════════════════════════════════════════════════════╗
║  PROJECT REGISTRY PULSE                                          ║
╠════════════════════╦══════════╦══════════╦════════════════════  ║
║  Project           ║  Status  ║  Score   ║  Decision            ║
╠════════════════════╬══════════╬══════════╬════════════════════  ║
║  exena             ║  ACTIVE  ║  100     ║  GOVERNED            ║
║  exena-commerce    ║  ACTIVE  ║  ...     ║  SEE-EXENA           ║
║  tailorgrid        ║  ACTIVE  ║  95      ║  GOVERNED            ║
║  ...               ║  ...     ║  ...     ║  ...                 ║
╚════════════════════╩══════════╩══════════╩════════════════════  ╝
```

Flag any project where:
- Decision is still "UNKNOWN" → needs update
- Score regressed by > 5 points since last retrospective
- Status should be ABANDONED (no session in > 90 days) but isn't marked so

Note: Do NOT modify REGISTRY.json here. Flag only. Human decides.

---

## STEP 3 — Instinct Graduation Check

Run:
```bash
node scripts/promote-patterns.js --min=2 --dry-run
```

Output summary:
- How many instincts are eligible for promotion (seen in ≥ 2 projects)?
- Which projects are sources?
- Total instinct count across all active projects

If ≥ 1 eligible: recommend running `npm run promote:min2` this session.
If 0 eligible: note "no cross-project instincts ready — healthy isolation".

---

## STEP 4 — Skill Staleness Scan

Check git log for skills last modified > 60 days ago:

```bash
git log --name-only --diff-filter=M --format="" -- skills/ | sort | uniq -c | sort -rn | head -20
```

Also check for skills with no git history change in > 60 days:

```bash
git log --format="%ad %s" --date=short -- skills/ | tail -20
```

Flag skills that have had ZERO modification in > 60 days AND have no known usage
in any project's session logs. These are candidates for review, not deletion.

Output:
```
STALE SKILL CANDIDATES (>60 days, no usage signal)
  [skill name] — last modified: [date] — domain: [domain]
  ...
None if all skills modified or have usage signals.
```

---

## STEP 5 — Confidence Re-Score (The 4 Holds)

Re-evaluate each hold. Score each: CLOSED ✅ / PARTIAL ⚠️ / OPEN ❌

### H1 — Governance by Convention
> Can Claude skip markdown steps without being caught?

Check:
- Do all 5 Tier 1 skills have MUST-VERIFY blocks? (`grep -l "MUST-VERIFY" skills/governance/cert-*.md skills/common/start.md skills/common/end.md`)
- Did cortex-stress-test run this month? (check docs/stress-test-log.md)
- Stress test result: SOLID / WATCH / BROKEN?

Score: CLOSED if all 5 have MUST-VERIFY + stress test passed this month.

### H2 — Only exena Validated with Real Code
> Are TypeScript rules calibrated against real code beyond exena?

Check:
- Does `adapters/language/typescript/scan-report-exena.md` exist? ✅ Already done.
- Has cert-score been run on tailorgrid? (check docs/ for cert-score-tailorgrid.md)
- How many projects have had a governed session? (check REGISTRY.json last_session dates)

Score: CLOSED if 2+ projects have real scan reports.
       PARTIAL if only exena has a scan report (current state as of 2026-03-23).

### H3 — Phase B+C Never Live-Tested
> Does the session chain actually work end-to-end?

Check:
- Does docs/stress-test-log.md show S6 (session continuity) STRESS-PASS?
- Does docs/stress-test-log.md show S7 (pre-commit hook) STRESS-PASS?
- Has `/start` → work → `/end` been completed in at least 1 session since v14.0?

Score: CLOSED if S6 + S7 STRESS-PASS in most recent stress test.

### H4 — Builder Rating Own Work
> Is there adversarial testing that can catch governance failures?

Check:
- Does `skills/governance/cortex-stress-test.md` exist?
- Does docs/stress-test-log.md exist with a run result?
- Was the most recent run SOLID (7/7)?

Score: CLOSED if stress test exists + ran + SOLID.

---

## STEP 6 — What Cortex Caught vs Missed This Month

Read session logs if server was running:
```bash
curl -s http://localhost:7391/sessions --max-time 2 2>/dev/null | head -50
```

Otherwise: read TRACKER entries manually from the most recent project CLAUDE.md or ai/session-log files.

Tally:
- Governance blocks triggered (score < 85 blocked work, propagation gate fired)
- Patterns promoted cross-project
- TypeScript violations caught before commit
- Sessions that ran /end properly vs abandoned mid-session

Output:
```
MONTH CATCH SUMMARY
  Governance blocks fired : N
  Patterns promoted       : N
  TS violations caught    : N
  Sessions closed cleanly : N / M total
  Sessions abandoned      : N (no /end)
```

If data is unavailable (server was offline, no logs): note "insufficient data — recommend running server next month".

---

## STEP 7 — Confidence Score Update

Based on Steps 2–6, compute new confidence score:

```
BASE: 8/10 (established 2026-03-23)

+1 for EACH hold that moved from OPEN/PARTIAL → CLOSED (max +4)
-1 for EACH hold that regressed from CLOSED → OPEN
-1 if stress test is WATCH or BROKEN this month
+1 if all 9 projects have had at least 1 governed session (currently not true)
-1 if skill staleness scan found > 10 stale skills with no usage signal

FINAL SCORE: [N]/10
DELTA: [+N | -N | no change] from last month
```

If score reaches 9/10: announce v15.0 gate criteria are met (see STEP 8).
If score drops below 7/10: ALARM — do not ship new skills until score recovers.

---

## STEP 8 — v15.0 Gate Criteria (define on first run, review on each run)

On first run, define what 9/10 and 10/10 require:

```
v15.0 GATE — Target: 9/10 confidence
────────────────────────────────────────────────────────
G1  All 4 holds CLOSED (H1..H4)
G2  Stress test: 2 consecutive monthly SOLID runs
G3  3+ projects have real code scan reports
G4  cortex-retrospective has run at least 3 times
G5  /cert-score validated on 2+ projects beyond exena
────────────────────────────────────────────────────────
When G1+G2+G3+G4+G5 all satisfied → bump to v15.0

v16.0 GATE — Target: 10/10 confidence
────────────────────────────────────────────────────────
G6  All 9 projects have had ≥ 1 fully governed session
G7  No instinct in any project is older than 6 months (fresh learning)
G8  At least 1 cross-project pattern promoted via promote-patterns
G9  Cortex governed 3+ different tech stacks (TS confirmed, Go needed, 1 more)
────────────────────────────────────────────────────────
When v15.0 shipped + G6+G7+G8+G9 satisfied → ship v16.0
```

On subsequent runs: check each gate item, mark [x] or [ ].

---

## STEP 9 — Write retrospective.md

Write or overwrite `docs/retrospective.md`:

```markdown
# Cortex Retrospective — [YYYY-MM-DD]

## Confidence: [N]/10 ([+N | -N | —] from [previous date or "first run"])

## Registry Pulse
[Table from Step 2]
[Flags if any]

## Instinct Graduation
[Summary from Step 3]

## Skill Staleness
[Candidates from Step 4, or "None"]

## Hold Scores
| Hold | Status | Notes |
|------|--------|-------|
| H1   | [CLOSED ✅ / PARTIAL ⚠️ / OPEN ❌] | [detail] |
| H2   | ...    | ... |
| H3   | ...    | ... |
| H4   | ...    | ... |

## Month Catch Summary
[Table from Step 6]

## v15.0 Gate Progress
[Gate items with current status]

## Actions for Next Month
[1–3 concrete items that would improve confidence or close holds]
```

---

## STEP 10 — Update Memory

After writing retrospective.md, update the improvement plan memory:

1. Update `memory/project_cortex_improvement_plan.md`:
   - Set current confidence to new score
   - Mark any holds as CLOSED if they moved
   - Update the date

2. Remind: "Next retrospective due: [first session of next month]"

---

## MUST-VERIFY

After running /cortex-retrospective, confirm ALL outputs were produced:

```
☐ Step 2  — Registry pulse table shown (9 projects)
☐ Step 3  — Instinct graduation check completed (eligible count shown)
☐ Step 4  — Skill staleness scan run (candidates listed or "None")
☐ Step 5  — All 4 holds re-scored (CLOSED / PARTIAL / OPEN each)
☐ Step 6  — Month catch summary shown (even if "insufficient data")
☐ Step 7  — New confidence score computed with delta
☐ Step 8  — v15.0 gate items shown with current status
☐ Step 9  — docs/retrospective.md written
☐ Step 10 — Memory updated with new confidence score
```

If any checkbox remains unchecked → do not mark session complete.
Re-run the missing step before ending.

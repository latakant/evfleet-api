╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-observe  |  v1.0  |  TIER: 3  |  BUDGET: LEAN    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L9 (Operations) · L7 (Learning)                     ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Show Cortex execution metrics (logs/metrics/traces)║
║               ║ - Detect anomalies in session/score/pattern trends  ║
║               ║ - Surface root cause hints from execution history   ║
║               ║ - Show health of the Learning Engine                ║
║ CANNOT        ║ - Access production app metrics (Datadog/Grafana)   ║
║               ║ - Auto-fix anomalies (routes to cert-bug)           ║
║ WHEN TO RUN   ║ - At session start for a health snapshot            ║
║               ║ - When debugging is stuck (query for patterns)      ║
║               ║ - Weekly to review Cortex learning trends           ║
║               ║ - When score drops unexpectedly                     ║
║ OUTPUTS       ║ - Metrics snapshot · Anomaly report · Trace summary ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-observe — Cortex's Observability Engine.

The three pillars (applied to Cortex itself, not production apps):
  Logs    → what every skill execution did, when, with what result
  Metrics → pattern count, session count, score trend, coverage %, decisions
  Traces  → task graph = the full execution trace of any FULL feature

The problem it solves:
  Without observability: "Why is the score dropping? Why are the same bugs recurring?"
  With observability: "Pattern match rate dropped 12% — 3 new unclassified errors in orders module."
  Cortex watches itself so it can get smarter.

$ARGUMENTS

Parse from $ARGUMENTS:
- `snapshot` — full health snapshot (logs + metrics + anomalies) ← default
- `logs [--last N] [--skill <name>] [--module <name>]` — filtered execution log
- `metrics` — current metrics dashboard
- `traces [--feature <name>]` — task graph traces for recent features
- `anomalies` — what looks wrong right now
- `debug "<symptom>"` — given a symptom, query logs+patterns to suggest root cause
- `trend [--days N]` — show score + coverage + pattern count trend over N days

---

## THE THREE PILLARS IN CORTEX TERMS

### PILLAR 1 — LOGS (execution logs)

Every Cortex skill run produces a log entry. These live in:
`ai/logs/cortex-execution.jsonl`

Each entry:
```json
{
  "timestamp": "ISO",
  "session": "session-YYYY-MM-DD-N",
  "skill": "cortex-blueprint",
  "module": "orders",
  "action": "BLUEPRINT",
  "input_summary": "e-commerce platform with 5 domains",
  "output_summary": "8 domains identified, 2 law warnings, 7-phase plan",
  "verdict": "PASS | WARN | BLOCKED | FAIL",
  "duration_ms": 4200,
  "laws_checked": 7,
  "violations": 0
}
```

Log sources (what writes to this file):
- `node scripts/lifecycle.js log` calls → already exists, just not in JSONL format
- cert-learn promotions → each promotion is a log entry
- cert-verify runs → score + verdict logged
- cert-session start/end → session lifecycle logged
- cortex-blueprint → blueprint generation logged
- cortex-intent → intent chain logged

---

### PILLAR 2 — METRICS (numerical health indicators)

Stored in: `ai/metrics/cortex-metrics.json`

```json
{
  "updated": "ISO timestamp",
  "sessions": {
    "total": 0,
    "this_week": 0,
    "avg_duration_min": 0
  },
  "patterns": {
    "local_total": 0,
    "graduated": 0,
    "pending_review": 0,
    "shared_to_orchestrator": 0,
    "coverage_pct": 0
  },
  "score": {
    "current": 0,
    "previous": 0,
    "trend": "improving | stable | degrading",
    "history": []
  },
  "decisions": {
    "total": 0,
    "by_domain": {},
    "failures_logged": 0
  },
  "bugs": {
    "total_fixed": 0,
    "known_pattern_match_rate": 0,
    "avg_resolution_time_min": 0
  },
  "features": {
    "task_graphs_generated": 0,
    "nodes_completed": 0,
    "parallel_executions": 0
  }
}
```

---

### PILLAR 3 — TRACES (execution traces)

For FULL feature builds: the task graph IS the trace.
`ai/task-graph.json` records exactly what ran, in what order, with what result.

For individual skill sessions:
`ai/traces/[session-id].json` — step-by-step skill execution chain

```json
{
  "session": "session-2026-03-13-1",
  "feature": "refund system",
  "steps": [
    {
      "step": 1,
      "skill": "cortex-blueprint",
      "started": "ISO",
      "completed": "ISO",
      "verdict": "PASS",
      "output": "8 domains, 0 violations"
    },
    {
      "step": 2,
      "skill": "cortex-task-graph",
      "started": "ISO",
      "completed": "ISO",
      "verdict": "PASS",
      "output": "12 nodes, 4 parallel groups"
    }
  ]
}
```

---

## STEP 1 — SNAPSHOT output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Observability Snapshot
[timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/4] Read execution logs
→ ai/logs/cortex-execution.jsonl
✓ [N] entries · last 5 shown below

[2/4] Read metrics
→ ai/metrics/cortex-metrics.json
✓ Score [current] ([▲/▼ delta]) · Coverage [N]%

[3/4] Read task graph traces
→ ai/task-graph.json · ai/traces/
✓ Active feature: [name] — [N/total] nodes done

[4/4] Detect anomalies
→ Checking [N] anomaly rules
✓ No anomalies detected
  [OR]
⚠ [N] anomalies detected — see below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Detailed stats:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX OBSERVABILITY — Snapshot
[timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METRICS
  Score           [current] ([▲/▼ delta] from last session)  [PASS/WATCH/BLOCK]
  Pattern library [N] patterns · [N] graduated · [coverage]% coverage
  Sessions        [N] total · [N] this week
  Decisions       [N] logged · [N] failures documented
  Bug resolution  [N] fixed · [N]% known-pattern match rate

RECENT LOGS (last 5 skill executions)
  [timestamp]  [skill]           [verdict]  [N]ms
  [timestamp]  [skill]           [verdict]  [N]ms
  ...

TRACES
  Active task graph: [feature name] — [N/total] nodes done
  Last session:      [session-id] — [N] steps · [verdict]

ANOMALIES
  [list or "No anomalies detected"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 2 — ANOMALY DETECTION

Check these conditions automatically:

```
ANOMALY RULES
──────────────────────────────────────────────────────────────
Score dropped > 10 points since last session
  → ALERT: "Score fell from [prev] to [curr]. Check what changed."
  → Suggest: /cortex-review on recent changes

Same module appears in bugs > 2 times in last 7 days
  → ALERT: "[module] has [N] recurring bugs — likely systemic."
  → Suggest: /cert-learn to promote new pattern

known_pattern_match_rate < 60%
  → ALERT: "Most bugs are unclassified. Pattern library needs expansion."
  → Suggest: /cert-learn analyze

No cert-learn run in > 14 days
  → WARN: "Learning Engine idle for [N] days — patterns may be stale."
  → Suggest: /cert-learn

Pending patterns > 5 (from pending-patterns.json)
  → WARN: "[N] patterns awaiting review."
  → Suggest: /cert-learn

Score < 85 for 3+ consecutive sessions
  → ALERT: "Score persistently below threshold. System health declining."
  → Suggest: /cortex-review full audit

Decision Knowledge Base empty
  → WARN: "No architectural decisions logged."
  → Suggest: /cortex-decision log after next blueprint
```

---

## STEP 3 — DEBUG mode

When debugging is stuck, query observability signals:

```
/cortex-observe debug "payment webhook not firing"
```

1. Search `ai/logs/cortex-execution.jsonl` for "payment" + "webhook" entries
2. Search `ai/learning/instincts.json` for matching patterns
3. Search `ai/knowledge/decisions/` for webhook-related decisions
4. Search `ai/knowledge/failures/` for similar past failures
5. Check if cert-diagnose has a matching KNOWN pattern

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Debug Query: "payment webhook not firing"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/5] Search execution logs
→ ai/logs/cortex-execution.jsonl
✓ [N] matches

[2/5] Query known patterns
→ ai/learning/instincts.json
✓ MATCH: "webhook HMAC validation failure" — confidence 0.92

[3/5] Check architectural decisions
→ ai/knowledge/decisions/
✓ [N] relevant decisions found

[4/5] Check failure records
→ ai/knowledge/failures/
✓ [N] similar failures found

[5/5] Synthesize root cause
✓ Most likely: HMAC validation failing — check RAZORPAY_WEBHOOK_SECRET env var

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Duration: Xs
Next   : /cert-diagnose → /cert-bug "webhook HMAC"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 4 — TREND mode

```
/cortex-observe trend --days 30
```

Output a compact trend table:

```
CORTEX HEALTH TREND — last 30 days
────────────────────────────────────────────────────────
Date        Score   Patterns  Coverage  Bugs Fixed
────────────────────────────────────────────────────────
2026-03-01   91      42        71%        2
2026-03-07   93      45        74%        1
2026-03-13   96      51        79%        0
────────────────────────────────────────────────────────
Trend: ▲ Score +5 · ▲ Patterns +9 · ▲ Coverage +8%
Assessment: IMPROVING
```

---

## INTEGRATION POINTS

| Skill | How it uses cortex-observe |
|---|---|
| `cert-session` v3.0 | Step 1F loads metrics snapshot at session start |
| `cert-learn` | Updates `ai/metrics/cortex-metrics.json` after each cycle |
| `cert-bug` | Before debugging: calls `cortex-observe debug "<symptom>"` |
| `cortex-blueprint` | After blueprint: logs to execution log |
| `cert-verify` | Score logged → metrics updated → trend calculated |
| `cert-session` end | Session entry written to execution log |

---

## DATA FILES MANAGED

| File | Purpose | Written by |
|---|---|---|
| `ai/logs/cortex-execution.jsonl` | Execution event stream | All skill runs |
| `ai/metrics/cortex-metrics.json` | Current health metrics | cert-learn, cert-verify |
| `ai/traces/[session].json` | Per-session execution trace | cortex-intent, cert-session |
| `ai/knowledge/decisions/*.md` | DKB — architectural decisions | cortex-decision |
| `ai/knowledge/failures/*.md` | DKB — engineering failures | cortex-decision |

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Duration: Xs
Next   : /cert-learn      — if anomalies detected
         /cortex-decision — if DKB is empty
         /cert-bug        — if debug mode found root cause
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode      [snapshot | logs | metrics | traces | anomalies | debug | trend]
Score     [current] · Trend: [▲/▼/→]
Anomalies [N found | none]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

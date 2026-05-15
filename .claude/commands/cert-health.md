```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-health  |  v8.0  |  TIER: 6  |  BUDGET: MODERATE    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 · L8 · L9                                        ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read all src/ files                               ║
║               ║ - Run npx tsc --noEmit                              ║
║               ║ - Run npx jest --coverage                           ║
║               ║ - Read ai/state/current-score.json                  ║
║               ║ - Write ai/state/open-issues.json (append)          ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (HEALTH_CHECK)    ║
║ CANNOT        ║ - Modify any src/ files                             ║
║               ║ - Run fixes (use /cortex-fix for that)              ║
║               ║ - Push to remote                                    ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - TypeScript errors → PARTIAL (list all errors)     ║
║               ║ - Test failures → PARTIAL (link to /dev-tester)     ║
║               ║ - Score < 85 → HARD HALT (output BLOCK)            ║
║ OUTPUTS       ║ - HEALTH REPORT (structured)                        ║
║               ║ - Updated open-issues.json                          ║
║               ║ - Completion block: COMPLETE or PARTIAL             ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Codebase health check — TypeScript, tests, score, open issues. Read-only. No fixes.

$ARGUMENTS

Parse: `scope` (optional) — `full` | `ts` | `tests` | `score` | blank = full

---

## PHASE 1 — TypeScript health

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Record:
```
TS ERRORS: [N] | Files: [list] | First error: [error text]
```

If 0 errors → TS: ✅
If any errors → TS: ❌ · count + file list

---

## PHASE 2 — Test health

```bash
npx jest --coverage 2>&1 | tail -30
```

Record:
```
Tests:    [N passing] / [N total] | [N failing]
Coverage: Statements [X%] | Branches [X%] | Functions [X%]
Failing:  [list test names]
```

---

## PHASE 3 — Score health

Read: `ai/state/current-score.json`

Extract: score, domain scores, last updated, blockers

```
Score:    [X]/100 | [ALLOW/WATCH/BLOCK]
Lowest:   [domain] at [X]/100
Blockers: [N] — [brief list]
```

---

## PHASE 4 — Open issues

Read: `ai/state/open-issues.json`

Count by severity:
```
CRITICAL: [N] | HIGH: [N] | MEDIUM: [N] | LOW: [N]
Oldest:   [issue] — [N days open]
```

---

## PHASE 5 — HEALTH REPORT

```
CORTEX HEALTH REPORT — {date}
═════════════════════════════════════════════════════════
TypeScript   {✅ Clean | ❌ N errors in [files]}
Tests        {✅ N passing | ❌ N failing — [names]}
Coverage     Statements: X% | Branches: X% | Functions: X%
Score        {X}/100 | {ALLOW/WATCH/BLOCK}
Issues       CRITICAL: N | HIGH: N | MEDIUM: N | LOW: N
═════════════════════════════════════════════════════════
PRIORITY ACTIONS:
1. {highest severity issue}
2. {second highest}
3. {third}
═════════════════════════════════════════════════════════
```

Append new issues found to `ai/state/open-issues.json`.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-health                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TS         [✅ clean | ❌ N errors]
Tests      [N passing | N failing]
Score      [X]/100 [ALLOW/WATCH/BLOCK]
Issues     CRITICAL:[N] HIGH:[N] MED:[N] LOW:[N]
Logged     LAYER_LOG (HEALTH_CHECK) · {date}
Next       [/cortex-fix <issue> | /dev-tester <module> | ALLOW — continue building]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

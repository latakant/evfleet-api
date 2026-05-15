<!-- Load ai/core/MASTER.md and ai/core/ANALYSIS_ENGINE.md before executing this skill -->
Autonomous analysis, synthesis, and execution pipeline. Finds all project problems, scores and sequences them, waits for one approval, then executes everything.

**Flags:**
- `/cortex-analyse` → full run (all 4 phases)
- `/cortex-analyse --report-only` → Phase 1 + 2 + 3 only, no execution
- `/cortex-analyse --execute saved` → load from `ai/tracker/ANALYSIS_PLAN.md`, skip to Phase 4

**Guard:** If `--execute saved` flag is set, jump directly to PHASE 4 after reading the saved plan. Skip Phase 1, 2, 3.

---

## PHASE 1 — DISCOVERY (no code changes)

**Role:** SENIOR_FULLSTACK
**Rule:** Never skip Phase 1. Full discovery always runs.

### 1.1 — Static analysis

Run all of these:
```bash
node scripts/enterprise-checker.js --check     # 25-rule static analysis
npx tsc --noEmit                                # TypeScript health
node scripts/learn.js health                    # module bug trend heatmap
node scripts/learn.js maturity                  # CORTEX maturity score
node scripts/diagnose.js --summary              # recent runtime issues (last 7 days)
```

### 1.2 — Read state files

Read each of these:
- `ai/state/open-issues.json` — all open issues with severity
- `ai/learning/pending-patterns.json` — queue depth (> 3 = warn)
- `ai/TRACKER.md` — last 3 entries only
- `ai/learning/module-health.json` — degrading modules

### 1.3 — Greenfield detection

Read `ai/core/ANALYSIS_ENGINE.md` — Greenfield Detection Signals section.
Read `ai/governance/API_CONTRACT.md` — what endpoints exist on backend.
Check `CLAUDE.md` section 8 (CURRENT GAPS) — canonical gap list.

For each gap: verify if it's actually unbuilt by checking `exena-web/src/` and `exena-admin/src/`.
Classify each confirmed gap as G1, G2, G3… with TRIVIAL / FEATURE / ARCH estimate.

### 1.4 — CORTEX health check

Run: `git log -1 --format="%ar" -- ai/STATUS.md`

Check:
- `ai/state/session-state.json` → any `pending_pa_reviews` > 0? List them.
- `ai/fixes/applied/FIX_LOG.md` → any STUCK entries? Treat each as a CRITICAL finding.
- `ai/learning/pending-patterns.json` → queue depth → if > 3, output: `⚠️ 3+ patterns pending — recommend /cortex-learn after this session`

### 1.5 — Log discovery to lifecycle

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="DISCOVERY_COMPLETE: findings=N critical=C high=H medium=M low=L greenfield=G" \
  --role=SENIOR_FULLSTACK
```
(Replace N/C/H/M/L/G with actual counts once synthesis is done — log after Phase 2.)

---

## PHASE 2 — SYNTHESIS

**Role:** PRINCIPAL_ARCHITECT (scoring + sequencing is an ARCH decision)

### 2.1 — Score every finding

For every finding from Phase 1 (checker violations, open-issues.json items, STUCK entries):

1. Read `ai/core/ANALYSIS_ENGINE.md` — scoring matrix
2. Assign IMPACT (1–5) and EFFORT (1–5)
3. Compute: `Score = IMPACT × (6 − EFFORT)`
4. Assign priority band: CRITICAL (20–25) / HIGH (14–19) / MEDIUM (8–13) / LOW (1–7)
5. Assign task ID: C1, C2… / H1, H2… / M1… / L1… / G1…

### 2.2 — Assign execution method

For each task, determine method:
- `SCRIPT` — if `enterprise-checker.js --fix <id>` can auto-apply it
- `CLAUDE` — if it requires reading and editing source files manually
- `PA_GATE` — if it triggers ARCH conditions (schema change, API contract change, auth/payment flow)

PA_GATE triggers (from ANALYSIS_ENGINE.md):
- Changes Prisma schema
- Changes API contract shape
- Affects auth, payment, or webhook handling
- Scope = ARCH

### 2.3 — Apply sequencing

Order all tasks using the sequencing rules from `ai/core/ANALYSIS_ENGINE.md`:
```
Security → Architecture → Financial → Error Handling → Type Safety → Observability → Quality → Features → Greenfield
```

Within each band, sort by score descending.
Backend before frontend always.

### 2.4 — Group into sessions

Group using session rules from `ai/core/ANALYSIS_ENGINE.md`. Max 6 tasks per session.
Calculate projected score improvement per session using the score projection formula.

### 2.5 — Log synthesis to lifecycle

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="SYNTHESIS_COMPLETE: sessions=N tasks=N projected_score=Y/100" \
  --role=PRINCIPAL_ARCHITECT
```

---

## PHASE 3 — PRESENTATION + GATE

### 3.1 — TypeScript gate

**If `npx tsc --noEmit` output errors: STOP immediately.**

Output only:
```
❌ Fix N TypeScript errors first. /cortex-analyse cannot plan over broken types.
Run: npx tsc --noEmit
Fix all errors, then re-run /cortex-analyse.
```

Do not output the plan. Do not proceed to Phase 4.

### 3.2 — Output the full plan

Use the exact report format from `ai/core/ANALYSIS_ENGINE.md` — Report Format Template section.

Include:
- Scan results (TypeScript, score, finding counts, degrading modules, CORTEX maturity)
- All sessions with task details (RULE-ID, module, title, Risk, Fix, Scope, Method, Files)
- Greenfield opportunities section
- Summary + projected score delta
- DECIDE menu

Wait for user input. Do not proceed until input is received.

### 3.3 — Handle decision

**APPROVE:**
- Append to `ai/governance/PA_LOG.md`:
  ```
  [YYYY-MM-DD] CORTEX-ANALYSE APPROVED
  Tasks: [count] | Sessions: [count] | Score projection: XX → YY
  Queue: [C1, C2, H1, H2, ...] (in order)
  ```
- Build full task queue in sequence order
- Proceed to Phase 4

**MODIFY \<ids\>:**
- Show the listed tasks
- Accept changes from user (new scope, new method, remove/add)
- Regenerate affected session(s) with updated projections
- Ask: "Proceed with modified plan? Y/N"
- On Y → append to PA_LOG.md → Phase 4
- On N → return to DECIDE menu

**DEFER:**
- Append to `ai/tracker/ANALYSIS_PLAN.md`:
  ```
  ## DEFERRED PLAN — [YYYY-MM-DD HH:MM]
  Generated: [date]
  Score at generation: XX/100
  Sessions: N  |  Tasks: N  |  PA gates: N

  ### Queue (in execution order)
  [C1] RULE-ID · module · title
  [H1] ...

  ### Greenfield
  [G1] ...
  ```
- Output: "Plan saved. Run `/cortex-analyse --execute saved` to execute."
- Stop. No code changes.

**PARTIAL \<ids\>:**
- Build partial queue from the listed IDs only
- Verify sequencing is maintained (warn if order violated)
- Ask: "Execute [N] tasks? Y/N"
- On Y → Phase 4 with partial queue
- On N → return to DECIDE menu

**REPORT-ONLY:**
- Save report to `ai/reports/ANALYSIS-[YYYY-MM-DD].md`
- Append to `ai/TRACKER.md`:
  ```
  [YYYY-MM-DD] /cortex-analyse REPORT-ONLY — XX/100 — N findings (C·H·M·L) — report saved
  ```
- Update `ai/learning/skill-usage.json` (LOG step — see below)
- Output: "Report saved. No code changes made."
- Stop.

---

## PHASE 4 — EXECUTION

**Rule:** Never start Phase 4 without Phase 3 approval.
**Rule:** Never ask questions mid-execution except PA gates and CRITICAL new findings.

### PRE-TASK (for each task)

1. Detect active role from file scope:
   - `exena-api/src/` → BACKEND_DEV
   - `exena-web/src/` → FRONTEND_DEV_WEB
   - `exena-admin/src/` → FRONTEND_DEV_ADMIN
   - `ai/` files → SENIOR_FULLSTACK
2. Update `ai/state/session-state.json`:
   - Set `active_role` to detected role
   - Set `active_work_type` to MAINTENANCE or MIGRATION (for schema tasks)

### EXECUTE (per task)

**SCRIPT method:**
```bash
node scripts/enterprise-checker.js --fix <id>
```

**CLAUDE method:**
- Read the target file(s)
- Apply the minimal fix only — no surrounding refactor, no extra cleanup
- No docstrings, comments, or type annotations added to unchanged code

**PA_GATE method:**
- Pause execution
- Output:
  ```
  ⏸ PA GATE — [task ID]: [title]
  Scope: ARCH
  Change: [what this would modify]
  Impact: [what breaks if wrong]
  Type "approved" to proceed or "skip" to defer.
  ```
- On "approved":
  - If schema change → run `/dev-backend-schema` protocol
  - Apply fix
  - Continue
- On "skip":
  - Append to `ai/TRACKER.md`: `[date] PA_GATE skipped: [task-id] — deferred to next session`
  - Continue with next task

### POST-TASK (mandatory after every single task)

**LAYER LOG — append to `ai/lifecycle/LAYER_LOG.md` after each task:**

```
[<ISO timestamp>]
TYPE: FIX
PROJECT: <exena-api|exena-web|exena-admin — from task file scope>
ROLE: <active_role from ai/state/session-state.json>
LAYER_ORIGIN: <layer where the issue originated>
LAYER_FIXED: <layer where the fix was applied>
LAYERS_TOUCHED: <comma-separated list>
LAYER_VIOLATED: <violation rule name or NONE>
FRONTEND_IMPACT: <NONE|LOW|MEDIUM|HIGH>
PA_REQUIRED: NO
CONTRACT: UNCHANGED
MODULE: <module>
FILES: <files modified>
SYMPTOM: <one-line: what the checker rule violation looked like>
ROOT_CAUSE: <one-line: root cause category>
FIX_APPLIED: <one-line: what class of fix solved it>
PREVENTION: <one-line: how to prevent this class>
TIER_USED: N/A
RESOLUTION_TIME: <e.g. 2m|5m|10m>
DETAIL: [task-id]: <one-line fix description>
```

1. **TypeScript gate:** `npx tsc --noEmit`
   - If errors: fix tsc before continuing to next task. Do not move on with broken types.
2. **FIX_LOG:** Append to `ai/fixes/applied/FIX_LOG.md`:
   ```
   [YYYY-MM-DD] [task-id] [module] — [one-line description of what changed] — files: [list]
   ```
3. **Pattern capture:** Append to `ai/learning/pending-patterns.json`:
   ```json
   {
     "captured": "<ISO timestamp>",
     "bug_id": "<module>-<YYYY-MM-DD>",
     "module": "<module>",
     "root_cause_category": "<category>",
     "symptom": "<what the error looked like>",
     "fix_pattern": "<what class of fix solved it>",
     "promoted": false
   }
   ```
4. **Lifecycle log:**
   ```bash
   node scripts/lifecycle.js log --action=BUG_FIXED --module=<module> \
     --detail="[task-id]: <fix description>" --role=<active_role>
   ```
5. **Progress output:**
   ```
   ✅ [task-id] complete — tsc: 0 errors — [module]: [one-line fix]
   ```

### UNEXPECTED FINDINGS during execution

- **CRITICAL new finding:** Pause. Output finding. Ask: "Add to current plan? Y/N"
  - On Y → insert at front of queue, continue
  - On N → log to TRACKER, continue
- **HIGH or below:** Log to `ai/TRACKER.md` as `FOUND_DURING_ANALYSIS` → continue without pause

### PROGRESS REPORT every 5 tasks

```
EXECUTION PROGRESS
Completed: N/total  |  Score est: XX/100  |  Remaining: N
Next: [next task description]
(Continuing...)
```

---

## COMPLETION

After all tasks in the approved queue are done:

```
╔══════════════════════════════════════════════════════════════╗
║  CORTEX ANALYSE COMPLETE — [YYYY-MM-DD]                     ║
╚══════════════════════════════════════════════════════════════╝
Score:        XX/100 → YY/100 (+Z pts)
Applied:      N/N tasks
Skipped:      N (PA rejected / deferred)
TypeScript:   ✅ 0 errors
New findings: N (added to TRACKER)

CORTEX UPDATED:
  FIX_LOG.md        ✅ N entries
  TRACKER.md        ✅
  LIFECYCLE_LOG     ✅ N events
  PA_LOG.md         ✅ (if PA gates triggered)
  pending-patterns  ✅ N captured

NEXT ANALYSIS: recommended end of sprint
Run /cortex-analyse --report-only for status-only check
```

### Post-completion steps (always)

1. Append to `ai/TRACKER.md`:
   ```
   [YYYY-MM-DD] /cortex-analyse COMPLETE — XX/100 → YY/100 (+Z pts) — N tasks applied — N skipped
   ```
2. Update `ai/state/current-score.json` with new projected score and today's date
3. Run `node scripts/enterprise-checker.js --check` for final score verification

---

## STEP [LOG] — Skill usage tracking

Update `ai/learning/skill-usage.json` after every invocation (any flag):
- Increment `invocations.cortex-analyse.count` by 1
- Set `invocations.cortex-analyse.last` to today's date
- Increment `invocations.cortex-analyse.discoveries_run` by 1 (if Phase 1 ran)
- Increment `invocations.cortex-analyse.tasks_executed` by N (tasks applied in Phase 4)
- Increment `invocations.cortex-analyse.plans_deferred` by 1 (if DEFER decision)
- Set `last_updated` to today's date

---

## Guardrails (never violate)

1. Never skip Phase 1 — full discovery always runs (unless `--execute saved`)
2. TypeScript errors block plan output entirely — fix first, then re-run
3. Never start Phase 4 without Phase 3 approval (APPROVE / PARTIAL + Y / MODIFY + Y)
4. Never ask questions mid-Phase 4 except PA gates and CRITICAL new findings
5. `tsc --noEmit` must pass after every individual fix before continuing
6. FIX_LOG + pending-patterns appended after every fix — not just at end
7. Greenfield tasks only if score ≥ 75 AND all CRITICAL resolved (unless PARTIAL explicitly includes them)
8. REPORT-ONLY never writes to project source files — only to ai/reports/

---

## Completion block (MASTER.md)

### After Phase 3 (report + gate — user approves plan):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-analyse                 PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done       Plan generated + scored
Skipped    Phase 4 (execution) — awaiting user approval
Issues     {n CRITICAL · n HIGH · n MEDIUM}
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       APPROVE / PARTIAL <session> / MODIFY <changes> / DEFER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### After Phase 4 (execution complete):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-analyse                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixed      {n issues} ({n CRITICAL · n HIGH · n MEDIUM})
Score      {before} → {after}/100
Files      {n modified}
Logged     LAYER_LOG (TYPE: FIX) · {date}
Next       npx tsc --noEmit → /cortex-commit → /cortex-score
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

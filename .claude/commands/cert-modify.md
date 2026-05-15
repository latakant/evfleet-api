<!-- Load ai/core/MASTER-v*.md and ai/memory/team-roles.md before executing this skill -->
Execute the full MODIFY: protocol — changing existing feature behaviour.

$ARGUMENTS

---

**STEP 0 — Work type + role classification (always first)**

Read: `ai/memory/team-roles.md` (Work Type Classification section)

Apply the 4-question protocol to the modification request:
- Q1: Production emergency? → HOTFIX (wrong skill — use /cortex-bug)
- Q2: System structure change (new module, schema, env var)? → MIGRATION path — ARCH approval required
- Q3: Anything exist? Yes → Q4 (MODIFY: assumes something exists)
- Q4: Observable behaviour changes? Yes → MAINTENANCE (this skill)

Output:
```
WORK TYPE: MAINTENANCE
Reason:    <one line — what is being changed>
Projects:  exena-api: YES/NO | exena-web: YES/NO | exena-admin: YES/NO
Roles:     <list active roles>
PA:        YES (Phase <n>) | NO
```

Update `ai/state/session-state.json`: set `active_work_type` = MAINTENANCE, `active_role` = SENIOR_FULLSTACK, `session_date`.

Log to `ai/ROLE_LOG.md`:
```
[<ISO>] ROLE=SENIOR_FULLSTACK ACTION=PLAN WORK_TYPE=MAINTENANCE PROJECTS=<list> DETAIL="MODIFY: <description>"
```

If PA required → STOP and present what needs PA approval before proceeding.

---

MODIFY: is different from FEATURE: — you are changing something that already works and has dependents.
The primary risk is breaking callers, breaking the API contract, or silently violating an invariant.

---

**STEP 1 — Load context**
- Read `ai/context/invariants.md` — which L1–L5 invariants touch this area?
- Read `ai/context/forbidden.md` — anything forbidden in the target module?
- Read `ai/fixes/applied/FIX_LOG.md` — was this modified before? Is this a third pass?
- Read `ai/app.prd.md` — find the current spec for the feature being modified (what does it say today?)

---

**STEP 2 — Impact analysis (most important step — do not skip)**

Read the relevant controller, service, and DTOs. Then answer all of these before writing a single line:

| Question | Answer |
|----------|--------|
| What other modules call this service method? | [find all callers in src/] |
| Does this change the HTTP API contract? | Yes (breaking) / Yes (non-breaking) / No |
| Does this change the DB schema? | Yes → ARCH path / No |
| Does this affect payments, auth, or webhook flow? | Yes → human approval / No |
| What unit tests cover this behaviour? | [list them] |

If **DB schema change** or **payment/auth/webhook change**: STOP. This is ARCH path.
Present your findings and wait for explicit "approved" before continuing.

If **breaking API contract** (removing a field, changing a type, renaming an endpoint):

Run these greps to confirm frontend does not depend on the old contract:
```bash
# 1. Find DTO imports in frontend — TypeScript types flow through imports, not endpoint names
grep -r "import.*ResponseDto\|import.*RequestDto\|import.*\.dto" ../exena-web/src/ ../exena-admin/src/ 2>/dev/null | grep -i "[module-name]"

# 2. Find direct field references in frontend service/hooks
grep -r "\.[field-being-removed]\b\|\.[field-being-changed]\b" ../exena-web/src/ ../exena-admin/src/ 2>/dev/null

# 3. Find endpoint usage by path
grep -r '"[/api/path]"\|`[/api/path]`' ../exena-web/src/ ../exena-admin/src/ 2>/dev/null
```

If any match → list affected frontend files and present the breaking change before proceeding.
If no match → confirm safe and note the grep output as evidence.

---

**STEP 3 — Plan the change**
Output before writing code:
```
Modifying: [feature name] in [module]
Old behaviour: [one sentence]
New behaviour: [one sentence]
Files changing: [list]
API contract:   [unchanged / non-breaking / breaking — explain]
PRD diff:       [what line in app.prd.md changes]
```
For FEATURE path: wait for "OK" before proceeding.
For TRIVIAL path: proceed directly.

---

**STEP 4 — Implement**
- Change only what the modification requires — do not refactor surrounding code
- No `any` — use `unknown` + type guards
- Explicit return types on all changed functions
- If DTO changes: update class-validator decorators too
- If behaviour change: update the relevant unit test

---

**STEP 5 — Verify**
- Run: `npx tsc --noEmit` — 0 errors required
- Run: `npx jest --testPathPattern=<module> --passWithNoTests` — all tests pass

---

**STEP 6 — Update blueprint**
- Append to `ai/app.prd.md` changelog: `[YYYY-MM-DD] MODIFIED [module] — [old→new in one line]`
- If the behaviour change is visible in a Mermaid diagram: update `ai/mermaid/00-PROJECT-MASTER.md`
  and the relevant domain diagram file

---

**STEP 7 — Update TRACKER**
Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] FEATURE_MODIFIED — [module] — [what changed: old behaviour → new behaviour]
```

---

**STEP 8 — Log lifecycle event**
Run: `node scripts/lifecycle.js log --action=FEATURE_MODIFIED --module=<module> --detail="<old→new description>"`

---

**LAYER LOG — append to `ai/lifecycle/LAYER_LOG.md`:**

```
[<ISO timestamp>]
TYPE: BUILD
PROJECT: <exena-api|exena-web|exena-admin>
ROLE: <active_role from ai/state/session-state.json>
LAYER_ORIGIN: <layer where the change originated>
LAYER_FIXED: <layer where implementation was changed>
LAYERS_TOUCHED: <comma-separated list>
LAYER_VIOLATED: NONE
FRONTEND_IMPACT: <NONE|LOW|MEDIUM|HIGH>
PA_REQUIRED: <YES Phase n | NO>
CONTRACT: <UNCHANGED|NON_BREAKING|BREAKING — note if breaking>
MODULE: <module>
FILES: <files modified>
DETAIL: <one-line: old behaviour → new behaviour>
```

---

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-modify                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files      {n modified}
Contract   UNCHANGED | NON_BREAKING | BREAKING — {detail}
Logged     LAYER_LOG (TYPE: BUILD) · {date}
Next       npx tsc --noEmit → /cortex-commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If breaking API contract detected:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-modify                  HALTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Policy     Breaking contract — frontend dependency check required
Attempted  {what was planned}
Blocked    {field removed / type changed / endpoint renamed}
Logged     LAYER_LOG · {date}
PA needed  Confirm frontend impact → "approved" to proceed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

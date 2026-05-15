Execute the full REMOVE: protocol — deleting a feature, endpoint, or module.

$ARGUMENTS

REMOVE: is the highest-risk development operation. A feature may have callers you forgot about,
frontend dependencies, or data in production. Do not skip Step 1 under any circumstances.

---

**STEP 1 — Full dependency scan (mandatory — do not skip)**

Before touching any code, map every dependent:

Search for all references to what is being removed:
```bash
# Find all usages of the function/class/endpoint being removed
grep -r "<feature-name>" src/ --include="*.ts" -l
grep -r "<endpoint-path>" src/ --include="*.ts" -l
```

Read: `ai/mermaid/10-module-dependencies.md` — what imports the affected module?
Read: `ai/context/forbidden.md` — are there circular dep rules that apply?

Check frontend impact:
- Does `exena-web` (port 3000) call this endpoint? Search its services/.
- Does `exena-admin` (port 3001) call this endpoint? Search its services/.

**STOP here. Present the full dependency map:**
```
Removing: [feature/endpoint/module]
Dependents found:
  Backend:  [list of files that import or call this]
  Frontend: [exena-web: yes/no — which file | exena-admin: yes/no — which file]
  DB:       [any data associated with this feature in production?]
Plan:       [how each dependent will be handled]
```
Wait for user to confirm the plan before proceeding to Step 2.

---

**STEP 2 — PRD diff first**
Read: `ai/app.prd.md` — find the feature in the spec.

Present exactly what will be struck from the spec:
```
Removing from PRD:
  Module: [module name]
  Endpoints removed: [list]
  Business rule removed: [if any]
  DB model impact: [none / [model] column/table removed]
```
Confirm with user before proceeding.

---

**STEP 3 — Remove**
In this order to avoid compile errors:
1. Remove the route from the controller first
2. Remove the service method
3. Remove any DTOs used only by this feature
4. Remove from module `imports`/`providers`/`exports` if entire feature
5. Remove the unit tests that exclusively tested this feature
6. Do NOT remove shared utilities used by other features
7. If DB model change: STOP — this is ARCH path, requires `prisma migrate dev` with human approval

---

**STEP 4 — Verify nothing is broken**
- Run: `npx tsc --noEmit` — 0 errors required
- Run: `npx jest` — ALL 196 tests must pass (or adjusted count if tests removed)

If any test fails that is not related to the removed feature: fix it before continuing.

---

**STEP 5 — Update blueprint**
- Append to `ai/app.prd.md` changelog: `[YYYY-MM-DD] REMOVED [module] — [what was removed and why]`
- Remove the feature from any Mermaid diagram where it appears
- Update `ai/mermaid/00-PROJECT-MASTER.md` Module Health Scorecard if endpoint count changes
- Update `CLAUDE.md` endpoint count if a public endpoint was removed (103 → N)

---

**STEP 6 — Update TRACKER**
Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] FEATURE_REMOVED — [module] — [what was removed] — dependents handled: [list]
```

---

**STEP 7 — Log lifecycle event**
Run: `node scripts/lifecycle.js log --action=FEATURE_REMOVED --module=<module> --detail="<what removed, why, what replaced it if anything>"`

---

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-remove                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Removed    {feature/endpoint/module}
Files      {n deleted · n modified}
Tests      {n adjusted | all passing}
Endpoints  {before} → {after} (if public endpoint removed)
Logged     LAYER_LOG (TYPE: BUILD) · {date}
Next       npx tsc --noEmit → /cortex-commit → /cortex-diagram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If stopped at dependency scan (user hasn't confirmed plan):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-remove                  HALTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Policy     Dependency scan requires confirmation before removal
Attempted  Remove {feature}
Blocked    Waiting for user to confirm dependency plan
PA needed  Review dependency map above → confirm to proceed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

# /cortex-init — Environment Validator
# Validate the project development environment. Run all checks. Output INIT REPORT.
# Configure workspaces in ai/cortex-config.json or adapt steps to project structure.

**TOKEN BUDGET (lean mode — always active):**
Read only: ai/VERSION.md (3 lines) before starting.
Do NOT load ai/ files to validate them — use `ls` and `head -1` only.
Full file reads only if a specific problem is found (not upfront).
Self-build rule: if creating missing files, write from memory template — do not read existing files as reference.
Budget protocol: ai/core/MASTER.md (TOKEN_BUDGET merged)

$ARGUMENTS

---

## STEP 1 — Node Version

Run: `node --version`
- Require v18+
- If below v18: STOP. Output "Node upgrade required — current: [version], need: v18+"

---

## STEP 2 — Package Installation

Read `ai/cortex-config.json` for workspace paths (default: `api`, `web`, `admin`).
For each configured workspace, check node_modules presence:
```
ls {workspace}/node_modules/.bin 2>/dev/null | head -1 || echo "MISSING"
```

For each missing workspace: output exact install command. Never auto-run installs.
```
cd {workspace} && npm install
```

---

## STEP 3 — Prisma Client

Run: `ls node_modules/.prisma/client/index.js 2>/dev/null || echo "MISSING"`

If missing: output "Run: npx prisma generate"

---

## STEP 4 — Git Hooks

Run: `ls .git/hooks/`
Check for: `pre-commit`, `post-commit`

If missing: read `ai/hooks-config.json` → output exact setup command from it.

---

## STEP 5 — AI Folder Structure

Verify each file exists using `ls` only (do NOT read file contents at this stage).
For each missing file, note it in the INIT REPORT.
Auto-create `ai/learning/pending-patterns.json` if missing — it starts with `{"pending":[]}`.

**Core files (required for all CORTEX v7.3 projects):**
| File | Required |
|------|---------|
| `ai/STATUS.md` | must exist |
| `ai/AI-MANUAL.md` | must exist |
| `ai/core/MASTER.md` | must exist |
| `ai/core/MASTER.md (TOKEN_BUDGET merged)` | must exist |
| `ai/core/MASTER.md` | EXECUTION_PROTOCOL merged here |
| `ai/core/MASTER.md` | RESPONSE_PROTOCOL merged here |
| `ai/lifecycle/LAYER_LOG.md` | must exist |
| `ai/lifecycle/SPEC_LOG.md` | must exist |
| `ai/fixes/applied/FIX_LOG.md` | must exist |
| `ai/mermaid/00-PROJECT-MASTER.md` | must exist |
| `ai/learning/module-health.json` | must exist |
| `ai/learning/pending-patterns.json` | create if missing |
| `ai/learning/skill-usage.json` | must exist |

**Memory files (check existence only — do NOT read):**
| File | Required |
|------|---------|
| `ai/memory/INVARIANT_MEMORY.md` | must exist |
| `ai/memory/DOMAIN_MEMORY.md` | must exist |
| `ai/memory/ARCHITECTURE_MEMORY.md` | must exist |
| `ai/memory/DEPENDENCY_MEMORY.md` | must exist |
| `ai/memory/TRANSACTION_MEMORY.md` | must exist (if project has transactions) |

---

## STEP 6 — Enterprise Checker

Run: `node scripts/enterprise-checker.js --check 2>/dev/null | tail -3`

If error or not found: output "enterprise-checker.js broken — run /cortex-audit to diagnose."
If passes: note current score from output.

---

## STEP 7 — Output INIT REPORT

```
CORTEX INIT REPORT — [today's date]
══════════════════════════════════════════════
Node version:        ✅ v[x.y.z]  |  ❌ v[x.y.z] — upgrade needed (need v18+)

node_modules:
  {workspace-1}:     ✅ installed  |  ❌ run: cd {workspace} && npm install
  {workspace-2}:     ✅ installed  |  ❌ run: cd {workspace} && npm install

ORM client:          ✅ generated  |  ❌ run: [project ORM generate command]  |  N/A
Git hooks:           ✅ installed  |  ❌ run: [command from hooks-config.json]
AI folder:           ✅ complete   |  ❌ missing: [list of missing files]
Enterprise checker:  ✅ score [X]  |  ❌ broken — run /cortex-audit  |  not configured

══════════════════════════════════════════════
Status: READY  |  NOT READY — [n] issues found

Next:
  ✅ All clear → run /start to begin
  ❌ Issues found → resolve items above first, then run /cortex-init again
══════════════════════════════════════════════
```

---

## Completion block (MASTER.md)

### If READY:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-init                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status     READY — all checks passed
Issues     NONE
Logged     {not logged — read-only validation}
Next       /start to begin development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If NOT READY:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-init                    PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status     NOT READY — {n} issues found
Skipped    {list of failing checks}
Issues     See INIT REPORT above
Logged     {not logged — resolve issues first}
Next       Fix issues above → re-run /cortex-init
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

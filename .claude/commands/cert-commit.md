Create a conventional commit with full CORTEX lifecycle logging.

$ARGUMENTS

## SCHEMA

```yaml
skill: cert-commit
version: "2.0"
input:
  $ARGUMENTS:
    type: string
    required: false
    description: "Conventional commit message (optional — derived from diff if omitted)"
    default: "derived from git diff analysis"
output:
  type: action
  format: "commit hash + TRACKER entry + lifecycle log + LAYER_LOG entry"
  feeds_into:
    - cert-verify
    - end
runtime:
  tier: 1
  budget: LEAN
  temperature: 0
  token_class: LOW
  irreversible: true
  approval_required: false
```

---

**STEP 1 — Review all changes**
Run: `git status`
Run: `git diff`
Never use `git add -A` or `git add .` blindly. Review each modified file.

---

**STEP 2 — TypeScript gate (mandatory)**
Run: `npx tsc --noEmit`
If TypeScript errors exist: STOP. Fix errors first. Do not commit broken types.

---

**STEP 3 — Determine conventional commit message**

Map the change to commit type:
- New endpoint / feature → `feat(module): description`
- Bug fix → `fix(module): description`
- Config / tooling / non-code → `chore(scope): description`
- Performance improvement → `perf(module): description`
- Code change, no behaviour change → `refactor(module): description`
- Security fix → `fix(security): description`

If $ARGUMENTS contains a message, use it exactly. Otherwise draft from the diff.
Module name = the NestJS module folder name (e.g., `orders`, `auth`, `payments`).

---

**STEP 4 — Stage selectively**
Stage only the files relevant to this change:
```bash
git add src/modules/<module>/... prisma/... ai/...
```
Never include: `.env`, build artifacts, `node_modules`, `*.log` files.

---

**STEP 5 — Commit**
```bash
git commit -m "feat(orders): description here

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

**STEP 6 — Log lifecycle event**
Map commit type → lifecycle action:

| Commit type | Lifecycle action |
|-------------|-----------------|
| `feat` | `FEATURE_ADDED` |
| `fix` | `BUG_FIXED` |
| `chore` | `CONFIG_CHANGED` |
| `perf` | `PERFORMANCE_FIX` |
| `refactor` | `FEATURE_MODIFIED` |
| `fix(security)` | `SECURITY_PATCH` |

Read `ai/state/session-state.json` → `active_role` (use SENIOR_FULLSTACK if null).

Run: `node scripts/lifecycle.js log --action=<action> --module=<module> --detail="<commit message body>" --role=<active_role>`

---

**STEP 7 — Update TRACKER**
Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] [commit-hash-short] — [module] — [what changed] — lifecycle: [action]
```

---

**LAYER LOG — append to `ai/lifecycle/LAYER_LOG.md`:**

```
[<ISO timestamp>]
TYPE: COMMIT
PROJECT: <exena-api|exena-web|exena-admin — from staged file paths>
ROLE: <active_role from ai/state/session-state.json>
LAYER_ORIGIN: <primary layer of the committed change>
LAYER_FIXED: <same as LAYER_ORIGIN for commits>
LAYERS_TOUCHED: <comma-separated list of all layers in staged files>
LAYER_VIOLATED: NONE
FRONTEND_IMPACT: <NONE|LOW|MEDIUM|HIGH>
PA_REQUIRED: NO
CONTRACT: <UNCHANGED|NON_BREAKING|BREAKING>
MODULE: <module>
FILES: <staged files>
DETAIL: <commit message one-liner>
```

---

**STEP 8.5 — Propagation gate (Cortex framework commits only)**

Only applies when committing to the Cortex framework repo itself (CWD contains `HEALTH.md`).
Skip entirely when committing to any project that uses Cortex.

If staged files include anything in `skills/**` or `adapters/**`:

```bash
node scripts/propagate-skills.js --dry-run --all
```

Read the output. If any project shows a count that differs from its current installed count:
- **BLOCK commit**
- Output: `⛔ Propagation required — run: node scripts/propagate-skills.js --all`
- Do not proceed until propagation is complete and re-verified

If all project counts match → proceed to Step 8.

**On propagation failure:** run `node scripts/propagate-skills.js --all`, then re-run `--dry-run` to confirm. Do NOT commit until `--dry-run` shows all counts match. There is no "proceed anyway" path for propagation — a committed skill with un-propagated projects creates a permanent divergence in git.

Reason: skill and adapter changes must reach all governed projects before being committed to history.

---

**STEP 8 — Health token check (Cortex framework commits only)**

Only applies when committing to the Cortex framework repo itself (CWD contains `HEALTH.md`).
Skip entirely when committing to any project that uses Cortex.

```bash
[ -f "HEALTH.md" ] && echo "cortex repo — check health token"
```

If this is a Cortex framework commit, ask: do the staged files affect any of these?
- `skills/` — any skill file added, changed, or deleted
- `REGISTRY.json` — project entries changed
- `core/MASTER-*.md` — master spec changed
- `package.json` version field — version bumped
- A health gap opened or closed

If YES to any → automatically run:
```bash
node scripts/verify.js --update
```

This runs all 18 assertions and writes the updated token to HEALTH.md in one step.

- If verify exits 0 (all pass) → confirm: `✔ HEALTH token updated → CORTEX-HEALTHY-v{version}-{date}-18/18`
- If verify exits 1 (failures) → show failures, output:
  `⚠️ HEALTH token updated as DEGRADED — fix failing checks before next session`
- Do not block commit — token update is best-effort, not a gate

If NO → skip silently.

---

## Completion block

**Committed ✔ — lead with the hash:**
```
✔  {hash}  {commit message one-liner}
   {n files changed} · TRACKER updated · lifecycle logged
Next → /cert-verify  (next change)  |  /end  (closing session)
```

**TypeScript gate blocked — lead with the failure:**
```
╔══════════════════════════════════════════════╗
║  ✖  COMMIT BLOCKED — TypeScript errors       ║
╚══════════════════════════════════════════════╝

  {file:line — error message}

Fix: correct the type error, then re-run /cert-commit
```
Fix        npx tsc --noEmit → fix all errors → re-run /cortex-commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## MUST-VERIFY (before declaring /cert-commit complete)

```
☐ Step 2  — TypeScript gate: "npx tsc --noEmit" exits 0
☐ Step 3  — Conventional format confirmed: type(scope): description
☐ Step 5  — Git commit created: commit hash shown (e.g. [main abc1234])
☐ Step 8  — verify.js ran: "CORTEX-HEALTHY-v{version}-*-20/20" token line shown
☐ Step 8.5 — Propagation gate: "all counts match — propagation clean" (no exceptions)
☐ Step 6  — lifecycle.js logged: action logged OR "lifecycle not found — skipped"
```

**Non-negotiables:**
- If Step 8.5 shows any unpropagated project → propagate FIRST, then commit. No exceptions.
- If Step 5 hash is missing → commit failed silently. Re-run `git commit`. Do not advance.
- HEALTH token version must match current Cortex version in `package.json`. If it shows an old version, `node scripts/verify.js --update` and re-read.

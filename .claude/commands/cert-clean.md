# /cortex-clean — Skill 50
# LOAD WHEN: /cortex-clean | repo feels messy | post-upgrade cleanup
# Project repo cleaner — finds stale files, user decides what goes.
# Never auto-deletes. Always shows list first. Always logs.

---

## Usage

```
/cortex-clean             → full scan + interactive review
/cortex-clean --stale     → CORTEX files only (old MASTERs, old installers)
/cortex-clean --repo      → project files only (temp, orphaned, artifacts)
/cortex-clean --dry-run   → show candidates only, delete nothing
```

---

## What Gets Scanned

### Group A — Stale CORTEX files (compares against ai/VERSION.md)
- Old MASTER versions: `ai/core/MASTER-v*.md` where version < current
- Superseded upgrade installers: `CORTEX-UPGRADE-v*.md` for versions < current
- Old bootstrap/prompt files: `CORTEX-v*-BOOTSTRAP.md` · `PROMPT-TEMP-*.md` · `PROMPT.md`
- Duplicate core protocols: older versions of TOKEN_BUDGET, EXECUTION_PROTOCOL (both merged into MASTER.md) etc.

### Group B — Stale project files
- Temp/scratch files: `*.tmp` · `*.bak` · `*.log` (root level) · `debug-*` · `test-output-*`
- OS artifacts: `.DS_Store` · `Thumbs.db` · `desktop.ini`
- Empty directories (no files, no tracked content)
- Orphaned spec drafts: `ai/spec/**/*-DRAFT.yaml` · `ai/spec/**/*-OLD.yaml`
- Stale tracker files: `ai/tracker/*.md` older than 30 days if superseded

### Group C — Review candidates (never auto-suggest SAFE)
- Historical installer files that might be useful reference
- Old MASTER versions from intermediate upgrades
- Any file with "temp" or "draft" in the name not in Group A

---

## Step 1 — Load context

Read: `ai/VERSION.md` → know current CORTEX version
Read: `ai/lifecycle/LAYER_LOG.md` (last 5 entries) → know what was recently added
Run: `git status --short` → separate tracked vs untracked files
Run: `git log --oneline -5` → recent commit context

---

## Step 2 — Scan and categorise

For each candidate file found:

Assign tier:

| Tier | Criteria | Default action |
|------|---------|----------------|
| SAFE | Clearly superseded by current version · temp/scratch · OS artifacts | Suggest delete |
| REVIEW | Historical reference · might be useful · judgment call | User decides |
| KEEP | Active · referenced · current version | Never touch |

Rules for SAFE:
- `ai/core/MASTER-vX.md` where X < current version → SAFE
- `CORTEX-UPGRADE-vX*.md` AND a newer combined installer exists → SAFE
- Any file matching `PROMPT-TEMP-*.md` → SAFE
- `.DS_Store` · `Thumbs.db` → SAFE
- `*.tmp` · `*.bak` → SAFE

Rules for REVIEW:
- Old MASTER versions that are 1 step behind (still referenced in installer docs)
- Bootstrap/historical files (`CORTEX-v*-BOOTSTRAP.md`)
- Files in git history (recoverable) but no longer referenced anywhere

Rules for KEEP (never suggest removal):
- Current MASTER (`ai/core/MASTER-v{current}.md`)
- Active protocols (all merged into MASTER.md)
- The combined full installer (most recent `CORTEX-UPGRADE-*-FULL.md`)
- All `ai/spec/` files (spec is precious — never auto-suggest)
- All `ai/memory/` files
- All `src/` files
- All files modified in the last 7 days

---

## Step 3 — Output CLEAN REPORT

```
CORTEX CLEAN — {project} — {date}
════════════════════════════════════════════════════

SAFE TO REMOVE ({n})                           why
  1  {filename}                            ← {reason}
  2  {filename}                            ← {reason}
  ...

REVIEW — you decide ({n})
  {n+1}  {filename}                        ← {reason}
  ...

KEEPING — not touched ({n})
  ✓  {filename}                            ← {reason}
  ✓  {filename}                            ← {reason}

════════════════════════════════════════════════════
{total} candidates · {safe} safe · {review} review · {keep} keeping
```

If zero candidates found:
```
CORTEX CLEAN — nothing to remove.
Project is clean. No stale files detected.
```
→ Skip to Step 6 (log + completion block).

---

## Step 4 — Interactive selection

After showing the report, prompt:

```
Enter numbers to delete, 'safe' for all SAFE items, or 'skip' to cancel:
>
```

Parse input:
- `skip` or empty → cancel, go to Step 6 with no changes
- `safe` → select all SAFE tier items
- `safe, 5, 6` → all SAFE + items 5 and 6 from REVIEW
- `1, 3, 5` → specific items only
- `all` → everything in SAFE + REVIEW (warn: includes REVIEW items)

If `all` selected: add extra confirm:
```
⚠  'all' includes REVIEW items. Some may be useful reference.
   Are you sure? (y/N):
```

---

## Step 5 — Dry-run preview + confirm

Show exact commands that will run:

```
Preview — {n} files will be deleted:

  git rm {file}              ← tracked file
  rm {file}                  ← untracked file
  ...

This cannot be undone outside of git history.
Tracked files can be recovered with: git checkout HEAD -- {file}

Confirm deletion? (y/N):
```

If user says N → cancel, go to Step 6 with no changes logged.

---

## Step 5B — Execute deletions

For each confirmed file:
- If git-tracked: run `git rm {file}` (stages the deletion)
- If untracked: run `rm {file}` (permanent — warn before this specifically)
- Count: deleted / failed / skipped

After all deletions:
- If any git-tracked files were removed: suggest a commit
  ```
  Files removed from git. Commit with:
    git commit -m "chore(cortex): clean stale files — /cortex-clean"
  ```

---

## Step 6 — Log to LAYER_LOG

Append to `ai/lifecycle/LAYER_LOG.md`:

```
[{ISO timestamp}]
TYPE: BUILD
PROJECT: {project}
LAYER_ORIGIN: L10_HARNESS
LAYERS_TOUCHED: ALL
LAYER_VIOLATED: NONE
PA_REQUIRED: NO
CONTRACT: UNCHANGED
MODULE: cortex-clean (Skill 50)
FILES:
  REMOVED: {list each file deleted, or NONE if dry-run/cancelled}
DETAIL: /cortex-clean — {n} files removed · {n} kept · {n} skipped
        User selected: {safe/manual/all/skip}
```

---

## Step 7 — Completion block (MASTER.md)

### If files deleted:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-clean                   COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Removed    {n} files
Kept       {n} files (untouched)
Logged     LAYER_LOG · {date}
Next       git commit -m "chore(cortex): clean stale files"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If nothing to clean:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-clean                   COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Removed    0 files
Status     Project is clean — no stale files found
Logged     LAYER_LOG · {date}
Next       /start to continue development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If cancelled by user:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-clean                   PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Removed    0 files (cancelled by user)
Candidates {n} files identified — run again to review
Logged     LAYER_LOG · {date}
Next       /cortex-clean to re-run when ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Hard rules — never violate

1. **NEVER delete without user confirmation** — no exceptions
2. **NEVER touch `src/`** — application code is off-limits
3. **NEVER touch `ai/spec/`** — spec is permanent record
4. **NEVER touch `ai/memory/`** — memory files are session-critical
5. **NEVER touch `prisma/`** — schema + migrations are off-limits
6. **NEVER touch files modified in the last 7 days** — too recent to be stale
7. **ALWAYS log to LAYER_LOG** — even if nothing was deleted
8. **ALWAYS show dry-run** before executing any deletion

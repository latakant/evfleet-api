# /cortex-sync-learning — Learning Sync
# skill: cortex-sync-learning | domain: governance | version: 1.0 | added: 2026-03-21
# Pull graduated instincts from all governed projects into Cortex global knowledge.
# Closes the learning loop: project bugs → global intelligence.

---

## THE PROBLEM THIS SOLVES

Each governed project learns in isolation:
  project/knowledge/instincts.json ← grows from project bugs
  $CORTEX_ROOT/knowledge/instincts.json ← never updated from projects

Result: 9 projects each rediscover the same patterns independently.
The global brain does not grow from project experience.

This skill closes that loop.

---

## LOAD

Before executing:
- `$CORTEX_ROOT/knowledge/instincts.json` (global knowledge base)
- `$CORTEX_ROOT/REGISTRY.json` (all project paths)

---

## TRIGGER

Run when:
- A project instinct reaches `confidence >= 0.8` and `graduated: true`
- After any `cert-fix-cycle` that produced a new instinct
- Weekly batch sync (all projects → global)
- Before any `cert-pattern --promote` (so global is current before promotion)

---

## EXECUTION

### STEP 1 — Scratch Phase

Write to `/tmp/cortex-sync-learning-scratch.md`:
```
PROJECTS TO SCAN: [list from REGISTRY.json]
GLOBAL INSTINCTS: [count + IDs from $CORTEX_ROOT/knowledge/instincts.json]
SCAN PLAN: for each project, read knowledge/instincts.json, filter graduated=true
```

### STEP 2 — Scan All Projects

Read `REGISTRY.json` to get all project paths.

For each project:
```bash
cat {project_path}/knowledge/instincts.json 2>/dev/null
```

If file missing → note "no instincts.json" and skip.
If file exists → extract all entries where:
- `"graduated": true`
- `"confidence" >= 0.8`

---

### STEP 3 — Merge into Global

For each graduated instinct from a project:

**Check if already in global** (match by `id` field):
- EXISTS in global: compare confidence. If project confidence > global → update global.
  Increment `evidence_count` by project's evidence count. Update `source_projects` array.
- NOT in global: add the full entry. Set `source_projects: [project_name]`.

**Conflict resolution:**
- Same `id`, different `rule` text → keep the higher-confidence version, note the divergence
- Same pattern, different `id` → flag for manual review (do not auto-merge)

---

### STEP 4 — Identify Promotion Candidates

After merging, scan global instincts for:
```
confidence >= 0.9
evidence_count >= 3 (across multiple projects or multiple occurrences)
graduated: true
NOT already promoted to an adapter (no "promoted_to" field)
```

These are ready to become adapter laws via `/cert-pattern`.

---

### STEP 5 — Update Global instincts.json (atomic — verified write)

Before writing, record the expected state:
```
Expected instinct count after merge: [N total = existing + new - duplicates]
```

**Write atomically — temp file → rename (never write directly):**

```bash
# 1. Write to temp file first
TEMP_FILE="$CORTEX_ROOT/knowledge/instincts.json.tmp"
write merged JSON → $TEMP_FILE

# 2. Validate the temp file parses correctly
node -e "JSON.parse(require('fs').readFileSync('$TEMP_FILE', 'utf8'))" 2>/dev/null
# If parse fails → HARD HALT: "Temp file is invalid JSON — aborting. instincts.json untouched."

# 3. Atomic rename (replaces original only if temp is valid)
mv $TEMP_FILE $CORTEX_ROOT/knowledge/instincts.json
```

Why atomic: a direct write that crashes mid-way corrupts instincts.json permanently.
The temp → rename pattern guarantees instincts.json is either the old version or the
complete new version — never a partial write.

Update the header in the merged JSON:
```json
{
  "version": "1.0",
  "last_updated": "[today]",
  "last_sync": "[today]",
  "projects_synced": ["project1", "project2", ...],
  "instincts": [...]
}
```

**STEP 5.5 — Verify write (mandatory)**

Immediately re-read `$CORTEX_ROOT/knowledge/instincts.json` and count instincts.

```
Written count  : [N from re-read]
Expected count : [N from before write]
Match          : YES / NO
```

If NO MATCH → **HARD HALT**:
```
SYNC ABORTED — knowledge/instincts.json count mismatch after write.
Expected [N], found [M]. Do not commit. Re-run /cortex-sync-learning --dry-run
to see what should be in the file.
```

Do not proceed to Step 6 if mismatch. The file may be corrupt.

---

### STEP 6 — Output Sync Report

```
CORTEX LEARNING SYNC — [date]
══════════════════════════════════════════════════
Projects scanned:    [N]
Projects with data:  [N]
New instincts added: [N]
Updated instincts:   [N]
Skipped (conflicts): [N]
──────────────────────────────────────────────────
PROMOTION CANDIDATES ([N] ready for /cert-pattern):
  [id]  confidence:[X] evidence:[N] domain:[domain]
  [id]  confidence:[X] evidence:[N] domain:[domain]
──────────────────────────────────────────────────
NEXT: run /cert-pattern [id] to promote to adapter law
══════════════════════════════════════════════════
```

---

### STEP 7 — Commit (if changes made)

```
chore(knowledge): sync learning from [N] projects — [N] new, [N] updated instincts
```

Only commit if instincts.json actually changed. No empty commits.

---

## RUNNING MODES

```
/cortex-sync-learning              → full scan of all projects in REGISTRY.json
/cortex-sync-learning exena        → sync only from exena project
/cortex-sync-learning --dry-run    → show what would change, do not write
/cortex-sync-learning --promote    → sync + immediately run cert-pattern on candidates
```

---

## RELATIONSHIP TO OTHER SKILLS

```
cert-fix-cycle  → fixes bug + creates instinct in project knowledge/
cert-learn      → extracts instinct from a single event into project knowledge/
cert-pattern    → promotes a single instinct to adapter law (project-level)
cortex-sync-learning → pulls all graduated instincts from all projects → global knowledge
                       (the missing link that makes the global brain grow)

FULL LEARNING LOOP:
bug → cert-fix-cycle → project instincts.json
    → confidence grows with evidence
    → graduated=true
    → cortex-sync-learning → $CORTEX_ROOT/knowledge/instincts.json
    → cert-pattern → adapter law (universal, all projects)
    → cert-enforce → enforced BEFORE code is written, everywhere
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-migrate  |  v8.0  |  TIER: 7  |  BUDGET: MODERATE   ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L3 · L7 · L8 · L9                                   ║
║ AUTHORITY     ║ BUILDER                                              ║
║ CAN           ║ - Read + write prisma/schema.prisma (PA Phase 2)    ║
║               ║ - Write prisma/migrations/ (new migration SQL)      ║
║               ║ - Run npx prisma migrate dev --create-only          ║
║               ║ - Run npx tsc --noEmit                              ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (MIGRATION)       ║
║ CANNOT        ║ - Run npx prisma migrate dev (applies to live DB)   ║
║               ║ - Drop tables or columns without explicit PA signoff║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║               ║ - PA Phase 2 approval on schema change              ║
║ ESCALATES     ║ - Breaking migration (drop/rename) → HARD HALT      ║
║               ║ - Missing $transaction on multi-table → HARD HALT   ║
║ OUTPUTS       ║ - Migration SQL file                                 ║
║               ║ - Updated schema.prisma                             ║
║               ║ - Completion block: COMPLETE or HARD HALT           ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Prisma database migration — schema change, constraint, index, rollback plan. PA Phase 2 required.

$ARGUMENTS

Parse: `change` (required) — what to add/modify · `table` · `type` — `field` | `index` | `constraint` | `model` | `relation`

---

## GATE — PA Phase 2 required

Schema changes are **STANDARD invariant** — PA review required before proceeding.

Output this block and wait:
```
PA PHASE 2 REQUIRED
─────────────────────────────────────────────────────
Change:  [what you're about to change]
Table:   [model name]
Type:    [field | index | constraint | model | relation]
Impact:  [additive/breaking — see safety classification below]
─────────────────────────────────────────────────────
SAFE (additive — no data loss):
  + New nullable field
  + New index
  + New table/model
  + New CHECK constraint (on new field or table)

BREAKING (requires migration plan):
  - DROP column or table
  - RENAME column (= drop + add — data preserved only if SQL written correctly)
  - Change column type
  - Add NOT NULL to existing nullable column (without default)
  - Add UNIQUE to existing column (fails if duplicates exist)

Reply "PA APPROVED" to proceed.
```

---

## EXPAND-CONTRACT SAFETY PROTOCOL (for breaking changes)

For any BREAKING migration — especially column rename, type change, or removing NOT NULL — use the expand-contract pattern:

```
STEP A — EXPAND (additive, deploy safely)
  Add the new column/structure as optional alongside the old one.
  Old code still works. New code can start using new column.

STEP B — BACKFILL
  Migrate existing data from old → new column.
  Verify row counts match before proceeding.

STEP C — CONSTRAIN
  Add NOT NULL, UNIQUE, or other constraints once all rows are backfilled.
  Run in a transaction. Verify constraint holds.

STEP D — CONTRACT (remove old)
  Drop the old column/structure.
  Only after all code references the new column.
  Old column removal is a separate migration + deploy.
```

**Checklist before any BREAKING migration:**
- [ ] Is the old column still referenced in any service or query? (grep for it)
- [ ] Is there a backfill script written and tested?
- [ ] Can the app run with BOTH columns simultaneously during deploy?
- [ ] Is there a verified rollback SQL if Step C or D fails?

If any checkbox is unchecked → split into expand phase first, contract phase later.

---

## STEP 1 — Read current schema

Read `prisma/schema.prisma`. Understand:
- Current model structure
- Existing indexes and unique constraints
- Existing relations and FK constraints

---

## STEP 2 — Write the migration SQL

### For new field (additive):
```sql
-- Migration: add [field] to [table]
ALTER TABLE "[table]" ADD COLUMN "[field]" [TYPE] [DEFAULT] [NOT NULL?];
```

### For new index:
```sql
-- Migration: add index on [table]([fields])
-- Reason: [query pattern this supports]
CREATE INDEX "[index_name]" ON "[table]"("[field1]", "[field2]");
-- or for unique:
CREATE UNIQUE INDEX "[unique_name]" ON "[table]"("[field]");
```

### For CHECK constraint:
```sql
-- Migration: add [constraint-name] constraint
-- Prevents: [what data violation this guards against]
ALTER TABLE "[table]" ADD CONSTRAINT "[constraint_name]" CHECK ([condition]);
```

### For DROP (breaking — extra caution):
```sql
-- WARNING: This drops data. Confirm data is migrated or not needed.
-- Rollback: re-add column with DEFAULT (data is lost — cannot roll back data)
ALTER TABLE "[table]" DROP COLUMN "[field]";
```

**Rules:**
- Always include human-readable comment explaining what the constraint prevents
- CHECK constraints must NOT be `DEFERRABLE` (must be `INITIALLY IMMEDIATE` — default)
- For rename: use `ADD COLUMN` + data migration + `DROP COLUMN` (not `RENAME COLUMN` in most cases)

---

## STEP 3 — Update schema.prisma

After writing the SQL, update `prisma/schema.prisma` to match:
- New field: add to model with correct type and `@default()` if applicable
- New index: add `@@index([field])` to model
- New constraint: add `/// CHECK: [constraint-name]` comment above field + Prisma doesn't directly express CHECK — document in comment

Generate the migration file:
```bash
npx prisma migrate dev --create-only --name [descriptive-name]
```

Copy the written SQL into the generated `.sql` file.

---

## STEP 4 — Rollback plan

Every migration must have a documented rollback:

```
Migration: [name]
Forward:   [what the SQL adds]
Rollback:  [what SQL undoes it — must be tested]
Data loss: [YES — field dropped | NO — additive only]
```

For additive migrations: rollback = `DROP COLUMN` / `DROP INDEX` / `DROP CONSTRAINT` — safe.
For breaking migrations: rollback may not restore data → document explicitly.

---

## STEP 5 — TypeScript check

```bash
npx tsc --noEmit
```

After updating schema, run `npx prisma generate` first if the change affects the Prisma client, then verify TypeScript is clean.

---

## STEP 6 — Constraint TDD (if adding CHECK constraint)

If this migration adds a CHECK constraint:
```
→ Run /dev-tdd-constraint <constraint-name> <table> <http-status>
```

Test must be written and passing before the migration is committed.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-migrate                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migration  [name] — [type] on [table]
Safety     [ADDITIVE — no data loss | BREAKING — rollback documented]
PA         Phase 2 approved
Verified   tsc ✅ | constraint TDD ✅ (if applicable)
Rollback   [documented: DROP ...]
Next       /cortex-commit "db(<table>): [what changed]" — then deploy migration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

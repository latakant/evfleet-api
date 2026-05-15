```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-index  |  v8.0  |  TIER: 7  |  BUDGET: MODERATE     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L3 · L7 · L9                                        ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read prisma/schema.prisma                         ║
║               ║ - Read all src/modules/**/*.service.ts              ║
║               ║ - Write ai/state/open-issues.json (append)          ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (INDEX_AUDIT)     ║
║ CANNOT        ║ - Modify schema.prisma (use /cortex-migrate)        ║
║               ║ - Run migrations                                     ║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - Missing index on FK field → HIGH issue            ║
║               ║ - Missing index on high-traffic where clause → HIGH ║
║ OUTPUTS       ║ - INDEX AUDIT REPORT                                ║
║               ║ - Migration commands (ready to run via /cortex-migrate) ║
║               ║ - Completion block: COMPLETE or PARTIAL             ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Database index audit — identify missing indexes on FK fields, filter fields, sort fields. Read-only report.

$ARGUMENTS

Parse: `scope` (optional) — `full` | `fk` | `queries` | blank = full

---

## CONTEXT: Why indexes matter

Every `findMany({ where: { field: value } })` without an index on `field` is a full table scan.
At 10K rows: slow. At 100K rows: visible latency spike. At 1M rows: timeout.

PostgreSQL automatically indexes:
- `@id` fields (primary key)
- `@unique` fields

PostgreSQL does NOT automatically index:
- `@relation` (FK fields) — you must add `@@index` explicitly
- Filter fields used in `where` clauses
- Sort fields used in `orderBy` clauses

---

## SCAN 1 — FK fields without indexes

Read `prisma/schema.prisma`. For every relation field (ending in `Id` or explicitly marked `@relation`):

```
For each model:
  Find all fields of type String/Int that reference another model's ID
  Check if @@index([fieldName]) exists for that field
  If not → gap found
```

Example:
```prisma
model Order {
  id       String @id
  userId   String          // ← FK — needs @@index([userId])
  user     User   @relation(fields: [userId], references: [id])

  @@index([userId])        // ← required
}
```

Record all gaps:
```
FK index gaps:
  orders.userId      — @@index([userId]) MISSING
  order_items.orderId — @@index([orderId]) MISSING
```

---

## SCAN 2 — Query pattern analysis

Read all service files. Extract `where` clause fields:

```bash
grep -rn "where:" src/modules --include="*.service.ts" -A 3
```

For each field found in `where: { fieldName: ... }`:
- Check if `@@index([fieldName])` exists in schema for that model
- Note frequency (appears in how many queries?)

High-priority (flag as HIGH):
- `status` fields (orders, payments — filtered constantly)
- `createdAt` (pagination, date range filters)
- `isActive` (soft-delete pattern used everywhere)
- `slug` fields (URL-based lookup)
- Composite fields used together (`categoryId + isActive`)

Record:
```
Query pattern gaps:
  products.categoryId   — used in N queries — no index
  orders.status         — used in N queries — no index
  products.isActive     — used in N queries — no index
```

---

## SCAN 3 — OrderBy fields

```bash
grep -rn "orderBy:" src/modules --include="*.service.ts" -A 2
```

Fields used in `orderBy` without an index cause full sort passes. Flag:
- `createdAt` without `@@index([createdAt])`
- Composite order like `orderBy: { status: 'asc', createdAt: 'desc' }` — needs composite index `@@index([status, createdAt])`

---

## SCAN 4 — Composite index opportunities

Look for queries that always filter by multiple fields together:

```typescript
// PATTERN: always filters by userId AND status together
await this.prisma.order.findMany({
  where: { userId, status }
})
```

This needs: `@@index([userId, status])` (not two separate indexes — composite is faster for this pattern).

---

## INDEX AUDIT REPORT

```
CORTEX INDEX AUDIT — {date}
═════════════════════════════════════════════════════════
Models scanned:   [N]
FK gaps:          [N] — missing indexes on relation fields
Query gaps:       [N] — filter fields without indexes
Sort gaps:        [N] — orderBy fields without indexes
Composite opps:   [N] — multi-field queries that need composite indexes
═════════════════════════════════════════════════════════
RECOMMENDED MIGRATIONS:
```

For each gap, output the ready-to-use migration commands:

```sql
-- 1. Index on orders.userId (FK + high-frequency filter)
-- Priority: HIGH — used in N service queries
ALTER TABLE "orders" ADD COLUMN ... (or via prisma):
-- schema.prisma: add @@index([userId]) to Order model
-- Then: /cortex-migrate field orders index userId

-- 2. Index on products.isActive (soft-delete filter)
-- Priority: HIGH
@@index([isActive])
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-index                   COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FK gaps    [N] — [list or NONE]
Query gaps [N] — [list or NONE]
Logged     open-issues.json · LAYER_LOG
Next       [/cortex-migrate index <model> <field> — for each HIGH gap | CLEAN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

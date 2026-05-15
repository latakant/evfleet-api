```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-perf  |  v8.0  |  TIER: 6  |  BUDGET: MODERATE      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 · L8 · L9                                        ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read all src/ files                               ║
║               ║ - Read prisma/schema.prisma                         ║
║               ║ - Write ai/state/open-issues.json (append)          ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (PERF_AUDIT)      ║
║ CANNOT        ║ - Modify src/ files (use /cortex-fix for that)      ║
║               ║ - Run migrations or DB commands                     ║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - N+1 on high-traffic endpoint → HIGH issue         ║
║               ║ - Missing index on FK/filter field → HIGH issue     ║
║               ║ - Blocking operation in async context → HIGH        ║
║ OUTPUTS       ║ - PERFORMANCE REPORT (structured)                   ║
║               ║ - Updated open-issues.json                          ║
║               ║ - Completion block: COMPLETE or PARTIAL             ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Performance audit — N+1 queries, missing indexes, blocking operations, payload size. Read-only. No fixes.

$ARGUMENTS

Parse: `scope` (optional) — `full` | `queries` | `indexes` | `memory` | `payloads` | blank = full

---

## SCAN 1 — N+1 Query Detection

N+1 = fetching a list, then querying DB once per item inside a loop. Most common source of performance regressions.

Read every service file and find:
- `findMany` results iterated with `for...of` / `.map()` / `.forEach()`
- Any Prisma query inside that loop

```bash
grep -rn "findMany\|findAll" src/modules --include="*.service.ts" -l
```

For each file, look for patterns like:
```typescript
// N+1 ANTI-PATTERN
const orders = await this.prisma.order.findMany()
for (const order of orders) {
  const items = await this.prisma.orderItem.findMany({ where: { orderId: order.id } })
  // ← This is a DB query per order = N+1
}

// CORRECT — use include or explicit join
const orders = await this.prisma.order.findMany({
  include: { items: true }  // ← One query with JOIN
})
```

Record each finding:
```
N+1 Findings:
  - [file]:[line] — [what is queried per iteration]
  Severity: HIGH (if > 10 expected items) | MEDIUM (bounded list)
```

---

## SCAN 2 — Missing Database Indexes

Read `prisma/schema.prisma`. For every model, verify:

**Mandatory indexes:**
1. Every `@relation` field has an index (Prisma adds some automatically, but explicit is better)
2. Every field used in `findMany({ where: { field: ... } })` has an index
3. Every field used in `orderBy` has an index (or composite with filter)
4. Pagination fields (`createdAt`, `id`) used in cursor queries have indexes

```bash
grep -n "@@index\|@unique\|@id" prisma/schema.prisma
```

Cross-reference: for every `where: { fieldName: ... }` found in service files, verify `@@index([fieldName])` exists in schema.

High-traffic models to prioritize:
- `orders` (filter by userId, status, createdAt)
- `products` (filter by categoryId, isActive, price range)
- `cart_items` (filter by cartId)

Record:
```
Index gaps:
  - Model [X]: field [Y] used in where clause — no index found
  Severity: HIGH (orders/payments) | MEDIUM (others)
```

---

## SCAN 3 — Payload Size

Large payloads waste bandwidth and slow client rendering. Check list endpoints:

```bash
grep -rn "findMany" src/modules --include="*.service.ts" -A 5
```

For each `findMany`:
- Is `select` used to limit returned fields? Or is full model returned?
- Is `take` / `limit` applied? (unbounded list = escalating cost)
- Are nested `include` chains more than 2 levels deep?

```typescript
// BAD — returns all fields including large blobs
await this.prisma.product.findMany()

// GOOD — explicit field selection
await this.prisma.product.findMany({
  select: { id: true, name: true, price: true, slug: true },
  take: 20
})
```

Check: is pagination applied on ALL list endpoints? Missing pagination on orders, products, reviews = risk.

Record:
```
Payload issues:
  - [file]:[line] — unbounded list / full model returned / deep include
```

---

## SCAN 4 — Blocking Operations in Async Context

Node.js is single-threaded. Synchronous CPU-heavy operations block the event loop:

```bash
grep -rn "readFileSync\|writeFileSync\|execSync\|JSON.parse\|\.sort(\|\.filter(" src/modules --include="*.service.ts"
```

Flag:
- `*Sync` file operations (use async variants)
- Large `JSON.parse()` on untrusted input (DoS risk)
- Heavy `.sort()` / `.filter()` on large arrays in memory (use DB-side ordering instead)
- PDF generation, image processing inline (should be queued via BullMQ)

Record:
```
Blocking ops:
  - [file]:[line] — [what operation] — recommendation: [queue/async]
```

---

## SCAN 5 — Redis Cache Opportunities

Check if expensive reads are being cached:

```bash
grep -rn "redis\|cache\|Cache" src/ --include="*.ts"
```

Candidates for caching (if not already cached):
- `settings` / `tax rates` — change rarely, read on every request
- `category tree` — hierarchical, expensive to compute
- `product list` — popular queries
- `user profile` — read on every auth check

For each candidate: verify there's a Redis TTL-based cache, or flag as optimization opportunity.

Record:
```
Cache opportunities:
  - [operation] — [frequency] — [recommended TTL]
```

---

## SCAN 6 — Transaction Scope

Wide transactions hold DB locks for longer. Verify:

```bash
grep -rn "\$transaction" src/modules --include="*.service.ts" -A 15
```

For each `$transaction`:
- Is it the minimum scope? (Only operations that MUST be atomic)
- Are non-DB operations (HTTP calls, email) inside the transaction? (They should NOT be)
- Is there a `await sleep()` or external API call inside the transaction? → CRITICAL lock risk

Record:
```
Transaction scope issues:
  - [file]:[line] — external call inside $transaction / overly wide scope
```

---

## PERFORMANCE REPORT

```
CORTEX PERFORMANCE REPORT — {date}
═════════════════════════════════════════════════════════
N+1 Queries     {✅ None found | ❌ N findings — [files]}
Index Gaps      {✅ All indexed | ❌ N gaps — [models/fields]}
Payload Size    {✅ All paginated/selected | ❌ N unbounded lists}
Blocking Ops    {✅ None | ❌ N sync operations — [files]}
Caching         {✅ Key paths cached | ⚠ N opportunities: [list]}
Tx Scope        {✅ All minimal | ❌ N wide transactions — [files]}
═════════════════════════════════════════════════════════
HIGH PRIORITY:
1. {most impactful finding}
2. {second}
3. {third}
═════════════════════════════════════════════════════════
```

Append HIGH findings to `ai/state/open-issues.json`.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-perf                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scanned    6 categories | {date}
High       [N] — [brief list or NONE]
Medium     [N]
Logged     open-issues.json · LAYER_LOG
Next       [/cortex-fix <issue> | CLEAN — no blockers found]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

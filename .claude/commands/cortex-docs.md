```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-docs  |  v8.0  |  TIER: 8  |  BUDGET: LEAN          ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 · L9                                             ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read all src/ files                               ║
║               ║ - Write inline JSDoc to src/ files (docs only)      ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (DOCS)            ║
║ CANNOT        ║ - Change logic while adding docs                    ║
║               ║ - Create separate .md doc files                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ OUTPUTS       ║ - JSDoc comments on public methods                  ║
║               ║ - Completion block: COMPLETE                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Add inline JSDoc documentation to public service methods and DTOs. No logic changes.

$ARGUMENTS

Parse: `scope` — `module` name | `full` | blank = changed files only

---

## WHAT TO DOCUMENT

**Document these (public API surface):**
- All `public` service methods
- DTO classes (brief purpose)
- Controller methods (brief endpoint description)
- Complex business logic inside methods (the "why", not the "what")

**Do NOT document:**
- Private methods (unless the logic is non-obvious)
- Simple getters/setters
- Obvious operations (`return this.prisma.user.findMany()` needs no doc)

---

## JSDoc TEMPLATES

### Service method
```typescript
/**
 * Creates a new order for the given user.
 *
 * Decrements product stock atomically via $transaction.
 * Validates coupon (if provided) before applying.
 *
 * @throws {NotFoundException} if any product variant is not found
 * @throws {ConflictException} if stock is insufficient (stock_non_negative constraint)
 * @throws {ForbiddenException} if coupon has already been used by this user
 */
async createOrder(dto: CreateOrderDto, userId: string): Promise<Order> {
```

### DTO class
```typescript
/**
 * Request body for creating a new product.
 * All monetary values in INR (stored as Decimal in DB).
 */
export class CreateProductDto {
```

### Controller method
```typescript
/**
 * POST /api/orders
 * Creates a new order. Decrements stock immediately.
 * Requires: authenticated customer.
 */
@Post()
async create(
```

---

## RULES

1. One `/**` block per public method — no inline `//` doc for public methods
2. `@throws` for every named exception the method can raise
3. `@param` only when the parameter name is ambiguous
4. No `@returns` for simple types — only for complex shapes
5. Never explain the code — explain the business decision

---

## CODEMAP FRESHNESS

After every `/cortex-docs` run, write a freshness timestamp:

```bash
node -e "
const fs=require('fs');
const state={
  last_scan: new Date().toISOString(),
  scope: process.argv[1]||'changed-files',
  files_documented: parseInt(process.argv[2])||0
};
fs.mkdirSync('ai/state',{recursive:true});
fs.writeFileSync('ai/state/codemap-freshness.json',JSON.stringify(state,null,2));
console.log('Codemap freshness updated: '+state.last_scan);
" -- "${SCOPE}" "${FILE_COUNT}"
```

**Freshness rules (read by `/start` and `cert-verify`):**
- ≤ 7 days → fresh — no warning
- 8–14 days → WARN: "Codemap may be stale — run /cortex-docs to refresh"
- > 14 days → FLAG: "Codemap is stale — documentation may not reflect current code"

`cert-verify` Phase 4 checks this file and surfaces the warning if stale.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-docs                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Documented [N] methods across [N] files
Logic      UNCHANGED (docs only)
Next       /cortex-commit "docs(<module>): add JSDoc to public methods"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

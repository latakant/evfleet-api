╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-review  |  v1.0  |  TIER: 4  |  BUDGET: MODERATE    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L3 · L4 · L5 · L7                              ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Read all changed source files (git diff)           ║
║               ║ - Read invariants, coding standards, domain skills   ║
║               ║ - Flag issues with file:line references              ║
║ CANNOT        ║ - Auto-fix issues (flag only)                        ║
║               ║ - Commit or push                                     ║
║ WHEN TO RUN   ║ - After cortex-verify passes                         ║
║               ║ - Before cortex-commit on any feature/fix            ║
║               ║ - On PR review request                               ║
║ OUTPUTS       ║ - APPROVE / REQUEST CHANGES · categorized issues     ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Focused code review gate. Reads only changed files. Checks against
coding standards, invariants, security rules, and domain patterns.
Run after /cortex-verify, before /cortex-commit.

---

## MODEL HINT

This skill reads and reasons about code. Use **Sonnet** — semantic analysis of code patterns requires it.
Do not downgrade to Haiku for this skill; false negatives on CRITICAL issues are costly.

$ARGUMENTS

Parse from $ARGUMENTS:
- `domain` — focus review on specific domain (e.g. `domain=orders`)
- `strict` — treat warnings as failures

---

## CONFIDENCE-FILTERING RULE

**Only report an issue if you are >80% confident it is a real problem.**

- Consolidate similar issues ("5 services missing error mapping" not 5 separate items)
- Skip issues in unchanged code unless CRITICAL security
- Skip stylistic preferences unless they violate project conventions
- Skip false positives (env vars in .env.example, test credentials clearly marked as test)

Verdict tiers:
- **APPROVE** — no CRITICAL or HIGH issues
- **WARN** — HIGH issues only (can merge with caution after noting)
- **BLOCK** — any CRITICAL found (must fix before merge)

---

## STEP 1 — Get changed files

```bash
git diff --name-only HEAD 2>/dev/null
# If no staged changes, check last commit:
git diff --name-only HEAD~1 HEAD 2>/dev/null
```

Group files by type:
- `*.controller.ts` → apply controller rules
- `*.service.ts` → apply service rules
- `*.dto.ts` → apply DTO rules
- `*.spec.ts` → apply test rules
- `prisma/schema.prisma` → apply schema rules
- `*.processor.ts` → apply queue rules

---

## STEP 2 — Load context

Read (if exists in project):
- `ai/memory/INVARIANT_MEMORY.md` — Quick Reference block
- Relevant domain skill (e.g. `ecom-orders`, `ecom-payments`) for changed module
- `ai/memory/TRANSACTION_MEMORY.md` if orders/payments/coupons changed

---

## STEP 3 — Review each changed file

For each changed file, read the full diff and check the rules below.

### CONTROLLER RULES (*.controller.ts)

| # | Rule | Check |
|---|------|-------|
| C1 | No direct `this.prisma.` calls | grep for `prisma.` in controller body |
| C2 | Guards ordered: `JwtAuthGuard` before `RolesGuard` | check decorator order |
| C3 | Every endpoint has explicit return type | check method signatures |
| C4 | All params use DTOs with `@Body()`, `@Param()`, `@Query()` | no raw `req.body` |
| C5 | No business logic — only calls service methods | controllers are thin |

### SERVICE RULES (*.service.ts)

| # | Rule | Check |
|---|------|-------|
| S1 | Multi-table writes use `$transaction` | grep for multi-step DB writes |
| S2 | P2002 → `ConflictException` (409) | grep for catch blocks |
| S3 | P2025 → `NotFoundException` (404) | grep for catch blocks |
| S4 | No `any` type (use `unknown` + guards) | grep for `: any` |
| S5 | Financial amounts in Decimal/string, not float | grep for `parseFloat` on money |
| S6 | Side effects (SMS, email, queues) are non-blocking | grep for `await` on external calls |

### DTO RULES (*.dto.ts)

| # | Rule | Check |
|---|------|-------|
| D1 | `class-validator` decorators on every field | check `@IsString`, `@IsNumber` etc |
| D2 | Optional fields have `@IsOptional()` | check undefined-able fields |
| D3 | No `any` type on DTO fields | grep for `: any` |
| D4 | Enums use `@IsEnum()` — not `@IsString()` | check enum fields |

### QUEUE / PROCESSOR RULES (*.processor.ts)

| # | Rule | Check |
|---|------|-------|
| Q1 | `try/catch` that re-throws on error | grep for `throw err` in catch |
| Q2 | Logger call before re-throw | grep for `this.logger` in catch |
| Q3 | No inline SMS/email calls in service — must go through queue | check service files |

### SCHEMA RULES (schema.prisma)

| # | Rule | Check |
|---|------|-------|
| P1 | New models have `createdAt DateTime @default(now())` | check model definition |
| P2 | New models have `updatedAt DateTime @updatedAt` | check model definition |
| P3 | New models use `@id @default(cuid())` for PK | check id field |
| P4 | Table names use `@@map("snake_case")` | check mapping |
| P5 | FK fields have `@@index` | check relations |

### SECURITY RULES (all files)

| # | Rule | Check |
|---|------|-------|
| SEC1 | No hardcoded secrets or API keys | grep for quoted strings > 20 chars in assignments |
| SEC2 | Webhook handlers verify HMAC signature first | grep for `createHmac` before processing |
| SEC3 | File uploads validate MIME type and size | grep for `mimetype` check in upload handlers |
| SEC4 | User input is validated via DTO before reaching service | no raw `req.body` in services |

### CODE QUALITY RULES (all files)

These are WARN-level — flag but do not block. Flag as HIGH in `strict` mode.

| # | Rule | Threshold | Check |
|---|------|-----------|-------|
| Q1 | Function length | > 50 lines | Count lines in any single function |
| Q2 | File length | > 800 lines | Count total lines in changed file |
| Q3 | Nesting depth | > 4 levels | Check if/for/try nesting depth |
| Q4 | `console.log` in non-test files | Any | grep for `console.log\|console.error` in src/ |
| Q5 | TODO/FIXME introduced | Any | grep for `TODO\|FIXME\|HACK` in diff |
| Q6 | Commented-out code blocks | 3+ lines | Look for large `//` or `/* */` blocks |

Flag code quality issues with:
```
WARN  [Q1] src/modules/orders/orders.service.ts:45
  Function `processOrder` is 87 lines — consider extracting sub-steps.
```

### TEST RULES (*.spec.ts)

| # | Rule | Check |
|---|------|-------|
| T1 | Mocks reset between tests (`beforeEach` or `afterEach`) | check mock setup |
| T2 | Tests describe behavior, not implementation | check test names |
| T3 | New service methods have at least one test | cross-reference spec |

---

## STEP 4 — Output findings

Categorize each issue:

- **CRITICAL** — must fix before merge (invariant violations, security issues, `any` on money)
- **HIGH** — should fix (missing error mapping, missing `$transaction`)
- **WARN** — nice to fix (missing tests, thin error messages)

Format:
```
REVIEW FINDINGS — {files reviewed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL  (must fix)
  ✖ [C1] src/modules/orders/orders.controller.ts:42
    Direct `prisma.order.findMany()` call in controller.
    Fix: move to orders.service.ts

HIGH  (should fix)
  ⚠ [S2] src/modules/products/products.service.ts:89
    P2002 unique violation not caught → will return raw 500.
    Fix: wrap in try/catch, throw ConflictException.

WARN  (nice to fix)
  · [T3] No test for `updateStock()` method added in this change.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  APPROVE ✔  /  REQUEST CHANGES ✖
Files reviewed: {N}
Issues: {N critical} critical · {N high} high · {N warn} warn
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**APPROVE** = 0 CRITICAL + 0 HIGH issues (WARN ok)
**REQUEST CHANGES** = any CRITICAL or HIGH issue

In `strict` mode: WARN also causes REQUEST CHANGES.

---

## COMPLETION

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-review                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verdict     APPROVE ✔ / REQUEST CHANGES ✖
Issues      {N critical} · {N high} · {N warn}
Next        /cortex-commit  (if APPROVE)
            Fix issues then re-run /cortex-review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

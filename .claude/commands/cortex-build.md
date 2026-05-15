# /cortex-build — Domain Skeleton Generator
# CORTEX v11.3 | cert-* = governance · cortex-* = domain builders
<!-- LOOP_CAPABLE: true | LOOP_STEP: executing | LOOP_INVARIANTS: I-01, I-02, I-03 | LOOP_DOMAIN: (from scaffold target) -->

---

## Usage

```
/cortex-build <domain> [--dry-run]

Examples:
  /cortex-build auth
  /cortex-build orders
  /cortex-build payments
  /cortex-build notifications
  /cortex-build products
```

---

## STEP 1 — Load blueprint + guardrails

Read the relevant blueprint for this domain:
```
C:\luv\Cortex\adapters\blueprints\blueprint-[domain].md
```
If blueprint not found → skip, note "No blueprint for [domain] — generating from NestJS patterns only."

Run `cert-enforce [domain]` to load active guardrails into session.
These are non-negotiable — all generated code must respect them.

---

## STEP 2 — Read existing project structure

Read (if exists):
- `prisma/schema.prisma` — understand existing models, naming convention
- `src/modules/` — understand existing modules, import patterns
- `CLAUDE.md` — coding standards, guard patterns, DTO conventions

Do NOT generate code that conflicts with existing conventions.

---

## STEP 3 — Generate module skeleton

Generate the full module in this exact order. Output each file with its content:

### 3A — Module file
```typescript
// src/modules/<domain>/<domain>.module.ts
import { Module } from '@nestjs/common';
import { <Domain>Controller } from './<domain>.controller';
import { <Domain>Service } from './<domain>.service';

@Module({
  controllers: [<Domain>Controller],
  providers: [<Domain>Service],
  exports: [<Domain>Service],
})
export class <Domain>Module {}
```

### 3B — Controller (HTTP only — no business logic)
```typescript
// src/modules/<domain>/<domain>.controller.ts
// Pattern: Controller routes HTTP to Service. Guards applied here.
// Guards order: @UseGuards(JwtAuthGuard, RolesGuard) — always this order
// NEVER: business logic, DB calls, or non-HTTP concerns in controller
```
Generate: one route per known operation for this domain.
Each route: route decorator + guard + DTO + return type annotation.
No `any`. Explicit return types mandatory.

### 3C — Service (business logic)
```typescript
// src/modules/<domain>/<domain>.service.ts
// Pattern: Service holds all business logic. Prisma injected as dependency.
// Multi-table writes: ALWAYS inside $transaction
// Error handling: P2002 → ConflictException · P2025 → NotFoundException
```
Generate: one method per controller route.
Include error handling stubs for each Prisma call.

### 3D — DTOs
```typescript
// src/modules/<domain>/dto/create-<domain>.dto.ts
// All fields: class-validator decorators mandatory
// No bare string/number fields without @IsString() / @IsNumber()
```
Generate: create DTO + update DTO (UpdateDto extends PartialType(CreateDto)).

### 3E — Prisma schema fragment
```prisma
// ADD TO: prisma/schema.prisma
// ⚠️  Human review required before running prisma migrate dev

model <Domain> {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // [domain-specific fields here]

  @@map("<domain>s")
}
```

### 3F — Test scaffold
```typescript
// src/modules/<domain>/<domain>.service.spec.ts
// Pattern: describe block per public service method
// Each method: at minimum happy path + common error path
```
Generate: describe blocks with it.todo() stubs — one per generated service method.

---

## STEP 4 — App module registration reminder

Output this notice (do NOT auto-edit AppModule — too risky):

```
⚠️  MANUAL STEP REQUIRED
Add <Domain>Module to AppModule imports:

import { <Domain>Module } from './modules/<domain>/<domain>.module';

@Module({
  imports: [
    ...existing,
    <Domain>Module,  // ← ADD THIS
  ],
})
```

---

## STEP 5 — Post-generation checklist

```
GENERATION COMPLETE — [domain] module
─────────────────────────────────────────────────────
Files generated:
  ✓ src/modules/<domain>/<domain>.module.ts
  ✓ src/modules/<domain>/<domain>.controller.ts
  ✓ src/modules/<domain>/<domain>.service.ts
  ✓ src/modules/<domain>/dto/create-<domain>.dto.ts
  ✓ src/modules/<domain>/dto/update-<domain>.dto.ts
  ✓ src/modules/<domain>/<domain>.service.spec.ts
  ✓ prisma/schema.prisma (fragment — needs manual add + review)

⚠️  Before running:
  1. Review Prisma schema fragment — add to schema.prisma
  2. Run: npx prisma migrate dev --name add-<domain>-model
  3. Register <Domain>Module in AppModule
  4. Fill test stubs: <domain>.service.spec.ts
─────────────────────────────────────────────────────
NEXT: /cert-verify [domain] — score the generated module
```

---

## INSTALL

```bash
cp C:\luv\Cortex\skills\cortex-build.md [project]\.claude\commands\cortex-build.md
```

Tier 2 skill — install to NestJS projects only.

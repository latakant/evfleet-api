<!-- LOOP_CAPABLE: true | LOOP_STEP: executing | LOOP_INVARIANTS: I-01, I-02, I-03 | LOOP_DOMAIN: (from scaffold target) -->
```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-scaffold  |  v8.0  |  TIER: 3  |  BUDGET: LEAN      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L6 · L7                                             ║
║ AUTHORITY     ║ BUILDER                                              ║
║ CAN           ║ - Create new module directory + skeleton files      ║
║               ║ - Write module.ts · controller.ts · service.ts      ║
║               ║ - Write dto/index.ts · dto/create-<entity>.dto.ts   ║
║               ║ - Write <module>.service.spec.ts (empty structure)  ║
║ CANNOT        ║ - Modify schema.prisma (use /cortex-migrate)        ║
║               ║ - Add business logic (use /cortex-build)            ║
║               ║ - Register module in AppModule (manual step)        ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ OUTPUTS       ║ - Boilerplate module structure (5 files)            ║
║               ║ - Completion block: COMPLETE                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Generate NestJS module boilerplate — empty, correctly structured, ready for `/cortex-build` to fill.

$ARGUMENTS

Parse: `module` (required) — name in kebab-case · `entity` — PascalCase entity name · `auth` — `public` | `auth` | `admin`

---

## OUTPUT: 5 files

### 1. `src/modules/<module>/<module>.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { <Entity>Controller } from './<module>.controller'
import { <Entity>Service } from './<module>.service'

@Module({
  controllers: [<Entity>Controller],
  providers: [<Entity>Service],
  exports: [<Entity>Service],
})
export class <Entity>Module {}
```

### 2. `src/modules/<module>/<module>.controller.ts`

```typescript
import { Controller } from '@nestjs/common'
import { <Entity>Service } from './<module>.service'

@Controller('<module>')
export class <Entity>Controller {
  constructor(private readonly <module>Service: <Entity>Service) {}
}
```

### 3. `src/modules/<module>/<module>.service.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class <Entity>Service {
  constructor(private readonly prisma: PrismaService) {}
}
```

### 4. `src/modules/<module>/dto/index.ts`

```typescript
// Export all DTOs from this barrel
```

### 5. `src/modules/<module>/dto/create-<entity>.dto.ts`

```typescript
import { IsString } from 'class-validator'

export class Create<Entity>Dto {
  @IsString()
  name: string
}
```

### 6. `src/modules/<module>/<module>.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { <Entity>Service } from './<module>.service'
import { PrismaService } from '../prisma/prisma.service'

const mockPrismaService = {
  <entity>: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('<Entity>Service', () => {
  let service: <Entity>Service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <Entity>Service,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    service = module.get<<Entity>Service>(<Entity>Service)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // Add tests using /dev-tdd or /dev-backend-endpoint
})
```

---

## MANUAL STEP (after scaffold)

Register in `src/app.module.ts`:
```typescript
import { <Entity>Module } from './modules/<module>/<module>.module'

@Module({
  imports: [
    // ... existing modules
    <Entity>Module,
  ],
})
export class AppModule {}
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-scaffold                COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Module     [module] — 6 files created
Auth       [public | auth | admin] guards noted
Manual     Register <Entity>Module in AppModule
Next       /dev-backend-endpoint to add first route
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

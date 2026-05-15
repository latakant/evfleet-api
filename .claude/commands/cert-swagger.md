```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-swagger  |  v8.0  |  TIER: 8  |  BUDGET: LEAN       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L3 · L7 · L9                                        ║
║ AUTHORITY     ║ EXECUTOR                                             ║
║ CAN           ║ - Read + write src/modules/**/dto/*.ts              ║
║               ║ - Read + write src/modules/**/*.controller.ts       ║
║               ║ - Read src/main.ts (Swagger setup verification)     ║
║ CANNOT        ║ - Change DTO validation logic                       ║
║               ║ - Change controller route handlers                  ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║               ║ - @nestjs/swagger installed                         ║
║ OUTPUTS       ║ - @ApiProperty on DTOs + @ApiOperation on routes    ║
║               ║ - Completion block: COMPLETE                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Add OpenAPI/Swagger decorators to DTOs and controller routes. Generates complete API documentation.

$ARGUMENTS

Parse: `scope` — `module` name | `full` | blank = all modules

---

## STEP 1 — Verify Swagger setup in main.ts

```typescript
// src/main.ts — must exist
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

const config = new DocumentBuilder()
  .setTitle('Exena API')
  .setDescription('Exena India E-Commerce API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

If missing → add it. Swagger UI available at `/api/docs`.

---

## STEP 2 — Decorate DTOs

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateProductDto {
  @ApiProperty({ description: 'Product display name', example: 'Handloom Kurta' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Price in INR', example: 1299.99, type: Number })
  @IsNumber()
  price: number

  @ApiPropertyOptional({ description: 'Product description', maxLength: 1000 })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Category CUID', example: 'cjld2cyuq0000t3rmniod1foy' })
  @IsString()
  categoryId: string
}
```

**Rules:**
- `@ApiProperty` on every required field
- `@ApiPropertyOptional` on optional fields
- Always include `example` — makes docs usable
- Include `enum` array for enum fields: `@ApiProperty({ enum: OrderStatus })`

---

## STEP 3 — Decorate controllers

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'

@ApiTags('Products')
@Controller('products')
export class ProductsController {

  @ApiOperation({ summary: 'List products', description: 'Returns paginated product list with filters' })
  @ApiResponse({ status: 200, description: 'Product list', type: [ProductResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @Get()
  async findAll(@Query() query: ProductQueryDto) { ... }

  @ApiBearerAuth()  // ← shows lock icon — requires JWT
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 409, description: 'Product with this SKU already exists' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateProductDto) { ... }

  @ApiParam({ name: 'id', description: 'Product CUID', example: 'cjld2cyuq0000t3rmniod1foy' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) { ... }
}
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-swagger                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Decorated  [N] DTOs | [N] controller routes
Coverage   [N] endpoints with @ApiOperation
Auth       [N] protected routes with @ApiBearerAuth
Next       /api/docs — verify rendered Swagger UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

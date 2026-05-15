```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-security  |  v8.0  |  TIER: 6  |  BUDGET: MODERATE  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L4 · L7 · L8 · L9                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read all src/ files                               ║
║               ║ - Read .env.example · prisma/schema.prisma          ║
║               ║ - Write ai/state/open-issues.json (append)          ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (SECURITY_SCAN)   ║
║ CANNOT        ║ - Modify any src/ files (use /cortex-hotfix)        ║
║               ║ - Read .env (live secrets — never)                  ║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - Hardcoded secret found → HARD HALT (P3 CRITICAL) ║
║               ║ - Auth bypass found → HARD HALT                     ║
║               ║ - SQL injection path → HARD HALT                    ║
║ OUTPUTS       ║ - SECURITY REPORT (structured by category)          ║
║               ║ - Updated open-issues.json                          ║
║               ║ - Completion block: COMPLETE or HARD HALT           ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Security scan — OWASP Top 10 focused, NestJS + Prisma specific. Read-only. No fixes.

$ARGUMENTS

Parse: `scope` (optional) — `full` | `auth` | `injection` | `secrets` | `headers` | blank = full

---

## SCAN 1 — Hardcoded Secrets

Search for secrets in source files:

```bash
grep -rn "password\s*=\s*['\"]" src/ --include="*.ts"
grep -rn "secret\s*=\s*['\"]" src/ --include="*.ts"
grep -rn "api_key\s*=\s*['\"]" src/ --include="*.ts"
grep -rn "sk_live\|rk_live\|pk_live" src/ --include="*.ts"
grep -rn "HMAC\|sha256" src/ --include="*.ts" | grep -v "process.env"
```

**CRITICAL trigger:** Any hardcoded value that is NOT `process.env.*` and is NOT a test fixture → HARD HALT.

Record:
```
Secrets scan: [CLEAN | CRITICAL: file:line — what]
```

---

## SCAN 2 — Authentication + Authorization

Check every controller method:

```bash
grep -rn "@Get\|@Post\|@Put\|@Patch\|@Delete" src/modules --include="*.controller.ts" -A 3
```

For each route, verify:
- Public routes (intentionally unguarded): documented with `// PUBLIC` comment?
- Auth routes: `@UseGuards(JwtAuthGuard)` present?
- Admin routes: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)` present?
- `@CurrentUser()` used instead of manual token extraction?

Common failures:
```typescript
// BAD — extracts user ID from body (spoofable)
@Body('userId') userId: string

// BAD — reads token header manually
request.headers.authorization.split(' ')[1]

// GOOD
@CurrentUser() user: User
```

Record:
```
Auth scan: [N] routes checked | Unguarded: [list] | Missing roles: [list]
```

---

## SCAN 3 — Injection Vulnerabilities

**SQL injection via raw queries:**
```bash
grep -rn "\$queryRaw\|\$executeRaw" src/ --include="*.ts"
```

Any `$queryRaw` / `$executeRaw` call → verify it uses tagged template literals (safe) NOT string concatenation (vulnerable):
```typescript
// SAFE — parameterized
await this.prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`

// VULNERABLE — string concat
await this.prisma.$queryRaw(`SELECT * FROM users WHERE id = '${userId}'`)
```

**Command injection:**
```bash
grep -rn "exec\|spawn\|execSync" src/ --include="*.ts"
```

**Prototype pollution:**
```bash
grep -rn "__proto__\|constructor\[" src/ --include="*.ts"
```

Record:
```
Injection scan: [CLEAN | FINDINGS: count — file:line]
```

---

## SCAN 4 — Input Validation

All DTOs must have class-validator decorators. Scan for DTOs without validation:

```bash
grep -rn "export class.*Dto" src/ --include="*.ts" -l
```

For each DTO file, verify every property has at least one decorator (`@IsString`, `@IsNumber`, etc.).

Check global validation pipe is enabled:
```bash
grep -rn "ValidationPipe\|whitelist" src/main.ts
```

Must have: `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`

Record:
```
Validation scan: [N] DTOs checked | Missing decorators: [list] | Global pipe: [YES/NO]
```

---

## SCAN 5 — Webhook Verification

Webhooks receive external data — must verify HMAC before processing:

```bash
grep -rn "webhook" src/modules --include="*.controller.ts" -l
```

For each webhook endpoint, verify:
- Raw body is read (not parsed JSON) for signature verification
- HMAC-SHA256 computed with `crypto.timingSafeEqual` (timing attack prevention)
- Rejection happens BEFORE any DB operations

```typescript
// REQUIRED pattern for Razorpay
const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
  throw new UnauthorizedException('Invalid webhook signature')
}
```

Record:
```
Webhook scan: [N] webhooks | Verified: [list] | Unverified: [list — CRITICAL if any]
```

---

## SCAN 6 — Security Headers

Check if Helmet.js is configured:
```bash
grep -rn "helmet\|Helmet" src/main.ts
```

If present, verify these headers are set (or not disabled):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

Check CORS configuration:
```bash
grep -rn "cors\|CORS\|origin" src/main.ts
```

`CORS_ORIGINS` must come from `process.env`, not hardcoded. Wildcard `*` in production = CRITICAL.

Record:
```
Headers scan: Helmet [YES/NO] | CORS origin from env [YES/NO] | Wildcard CORS [YES/NO — CRITICAL]
```

---

## SCAN 7 — Rate Limiting

Check throttle guard:
```bash
grep -rn "ThrottlerGuard\|@Throttle\|throttle" src/ --include="*.ts"
```

High-risk endpoints that MUST be rate-limited:
- `POST /auth/login`
- `POST /auth/otp/*`
- `POST /payments/*/webhook`

Record:
```
Rate limit scan: Global guard [YES/NO] | Auth endpoints throttled [YES/NO] | Webhook throttled [YES/NO]
```

---

## SCAN 8 — Sensitive Data Exposure

Check what gets returned in API responses:

```bash
grep -rn "password\|passwordHash\|secret\|token" src/modules --include="*.service.ts"
```

Verify password/hash fields are excluded from `select` clauses or use `@Exclude()` from `class-transformer`.

```typescript
// BAD — returns password hash
return await this.prisma.user.findUnique({ where: { id } })

// GOOD — explicit field selection
return await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } })
```

Record:
```
Exposure scan: [CLEAN | FINDINGS: list of files returning sensitive fields]
```

---

## SCAN 9 — Cloud Infrastructure Security (Tier 2/3 — run before VPS/DOKS deploy)

Skip this scan for Railway/Tier 1. Run when deploying to DO VPS or DOKS.

### IAM
- [ ] No root access keys in use — all API calls via IAM roles
- [ ] MFA enabled on all cloud accounts
- [ ] Principle of least privilege — each service has only the permissions it needs
- [ ] Service account keys rotated in last 90 days

### Network
- [ ] DB and cache (Redis) in private subnet — NOT directly accessible from internet
- [ ] No public S3/R2 buckets (unless intentionally public for static assets)
- [ ] Security groups: inbound on 22 (SSH) restricted to known IPs only
- [ ] Security groups: inbound on 3389 (RDP) closed completely
- [ ] API exposed only via load balancer / reverse proxy — Node process not directly public

### Secrets
- [ ] Rotation enabled for all production secrets (Razorpay keys, DB password, JWT secrets)
- [ ] Secrets stored in Vault / DO Secrets / Railway env — NEVER hardcoded in container env at build time
- [ ] `.env` files NOT in Docker images (`COPY . .` with proper `.dockerignore`)

### Containers (if using Docker)
- [ ] No `root` user in Dockerfile — must `USER node` or equivalent
- [ ] No `latest` tag for base images — pin to exact version
- [ ] Image scanning in CI (`docker scout` or `trivy`)
- [ ] Minimal base image (Alpine or distroless)

### Logging & Audit
- [ ] Audit/access logs retained 90+ days
- [ ] Alerts configured for: root login, failed auth spike, secret access
- [ ] No PII (user phone, addresses) in unencrypted logs

Record:
```
Cloud infra scan: Tier [1/2/3] | IAM [OK/N gaps] | Network [OK/N gaps] | Secrets [OK/N gaps] | Containers [OK/N gaps] | Logging [OK/N gaps]
```

---

## SCAN 10 — Dependency Audit

```bash
npm audit --audit-level=high 2>&1 | tail -20
```

Record:
```
npm audit: [N] critical | [N] high | [N] moderate
```

Critical/high vulnerabilities → add to open-issues.json with severity HIGH.

---

---

## SECURITY REPORT

```
CORTEX SECURITY REPORT — {date}
═════════════════════════════════════════════════════════
Secrets      {✅ Clean | 🚨 CRITICAL: [detail]}
Auth         {✅ All guarded | ❌ N unguarded routes: [list]}
Injection    {✅ Clean | ❌ N findings: [files]}
Validation   {✅ All DTOs decorated | ❌ N missing}
Webhooks     {✅ All HMAC-verified | 🚨 CRITICAL: [unverified]}
Headers      {✅ Helmet active | ❌ Missing}
Rate Limits  {✅ Critical paths throttled | ❌ Missing on [endpoints]}
Data Exposure{✅ No sensitive fields leaked | ❌ [files]}
npm audit    Critical: N | High: N | Moderate: N
Cloud Infra  {✅ All checks pass | ❌ N gaps (Tier 2/3 only) | ⏭ Skipped (Tier 1)}
═════════════════════════════════════════════════════════
CRITICAL FINDINGS (halt all deployment):
{list or NONE}

HIGH FINDINGS (fix before launch):
{list or NONE}
═════════════════════════════════════════════════════════
```

Append HIGH/CRITICAL findings to `ai/state/open-issues.json`.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-security                COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scanned    9 categories | {date}
Critical   [N] — [brief list or NONE]
High       [N] — [brief list or NONE]
Logged     open-issues.json · LAYER_LOG
Next       [/cortex-hotfix <issue> | CLEAN — proceed to launch]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

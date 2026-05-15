```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-secrets  |  v8.0  |  TIER: 7  |  BUDGET: LEAN       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L4 · L9                                             ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read src/ · .gitignore · .env.example             ║
║               ║ - Run git log / git grep (history scan)             ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (SECRETS_SCAN)    ║
║ CANNOT        ║ - Read .env (live file — never)                     ║
║               ║ - Modify any file                                   ║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - Secret found in git history → HARD HALT + PA     ║
║               ║ - Secret hardcoded in src/ → HARD HALT             ║
║ OUTPUTS       ║ - SECRETS HYGIENE REPORT                            ║
║               ║ - Completion block: COMPLETE or HARD HALT           ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Secrets hygiene — git history, source files, .gitignore coverage. Read-only. HARD HALT on findings.

$ARGUMENTS

No arguments. Always runs full scan.

---

## SCAN 1 — Live source files

```bash
grep -rn "sk_live\|rk_live\|pk_live" src/ --include="*.ts"
grep -rn "password\s*[:=]\s*['\"][^'\"]\{8,\}" src/ --include="*.ts"
grep -rn "secret\s*[:=]\s*['\"][^'\"]\{16,\}" src/ --include="*.ts"
grep -rn "AKIA[0-9A-Z]{16}" src/ --include="*.ts"  # AWS key pattern
grep -rn "ghp_[a-zA-Z0-9]{36}" src/ --include="*.ts"  # GitHub PAT pattern
grep -rn "api[_-]?key\s*[:=]\s*['\"][^'\"]\{10,\}" src/ --include="*.ts"
```

Any hit that is NOT `process.env.*` and NOT a test fixture → **HARD HALT**

Record:
```
Source scan: [CLEAN | CRITICAL: file:line — what]
```

---

## SCAN 2 — Git history

```bash
# Search commit history for common secret patterns
git log --all --oneline -p | grep -i "password\|secret\|api_key\|token" | grep "^+" | grep -v "process.env\|your-\|example\|test\|spec\|placeholder"
```

Also check:
```bash
# Were .env files ever committed?
git log --all --full-history -- ".env" "*.env" "!*.env.example"
```

If `.env` was ever committed — even in a deleted commit → it is in git history → credentials are compromised.

**HARD HALT if:**
- Real `.env` in git history → force-push required (PA Phase 3 review mandatory)
- Secret string found in git history → rotate the secret immediately before any other action

Record:
```
Git history scan: [CLEAN | CRITICAL: commit hash — what was found]
```

---

## SCAN 3 — .gitignore coverage

Read `.gitignore`. Verify these patterns exist:

```
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
*.secret
```

Check:
- Is `.env` in `.gitignore`? (Must be — failure = secrets exposed on every `git add .`)
- Is `.env.local`, `.env.development.local` etc. covered?
- Are certificate/key files covered?

Record:
```
.gitignore coverage:
  .env:             [covered ✅ | MISSING ❌]
  .env.*:           [covered ✅ | MISSING ❌]
  *.pem/*.key:      [covered ✅ | MISSING ❌]
```

---

## SCAN 4 — Config service usage pattern

Verify secrets are accessed via NestJS ConfigService, not raw `process.env`:

```bash
grep -rn "process\.env\." src/modules --include="*.ts" | grep -v "NODE_ENV\|PORT"
```

In NestJS, `process.env.*` access outside `main.ts` or config files is a pattern smell — prefer `ConfigService.get()` which validates schema at startup.

Record:
```
Config pattern: [All via ConfigService | N direct process.env reads in modules — [files]]
```

---

## SCAN 5 — Timing-safe comparisons

Secrets compared with `===` are vulnerable to timing attacks:

```bash
grep -rn "==\s*webhook\|==\s*signature\|==\s*secret\|===\s*token" src/ --include="*.ts"
```

Must use `crypto.timingSafeEqual` for any signature/secret comparison:
```typescript
// BAD — timing attack possible
if (signature === expectedSignature) { ... }

// GOOD
const a = Buffer.from(signature)
const b = Buffer.from(expectedSignature)
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) { ... }
```

Record:
```
Timing-safe: [All comparisons safe ✅ | N unsafe comparisons: [files]]
```

---

## SECRETS HYGIENE REPORT

```
CORTEX SECRETS HYGIENE REPORT — {date}
═════════════════════════════════════════════════════════
Source files    {✅ CLEAN | 🚨 CRITICAL: [detail]}
Git history     {✅ CLEAN | 🚨 CRITICAL: [detail — rotate immediately]}
.gitignore      {✅ Full coverage | ❌ Missing: [patterns]}
Config pattern  {✅ ConfigService used | ⚠ N raw process.env: [files]}
Timing safety   {✅ All safe | ❌ N unsafe comparisons: [files]}
═════════════════════════════════════════════════════════
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-secrets                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source     [CLEAN | CRITICAL — halt]
History    [CLEAN | CRITICAL — rotate + PA Phase 3]
Gitignore  [Full coverage | N gaps]
Logged     LAYER_LOG (SECRETS_SCAN) · {date}
Next       [CLEAN — proceed | fix gitignore | ROTATE secrets immediately]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

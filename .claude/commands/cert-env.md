```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-env  |  v8.0  |  TIER: 7  |  BUDGET: LEAN           ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L4 · L9                                             ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read .env.example · src/main.ts · config files    ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (ENV_AUDIT)       ║
║ CANNOT        ║ - Read .env (live secrets — never)                  ║
║               ║ - Modify any source or config files                 ║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - Required var missing at startup → HARD HALT      ║
║               ║ - Secret in .env.example with real value → HALT    ║
║ OUTPUTS       ║ - ENV AUDIT REPORT                                  ║
║               ║ - Completion block: COMPLETE or HARD HALT           ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Environment variable audit — completeness, validation, startup-crash protection. Read-only.

$ARGUMENTS

Parse: `scope` (optional) — `full` | `required` | `validation` | blank = full

---

## PHASE 1 — Inventory all env vars used in code

```bash
grep -rn "process\.env\." src/ --include="*.ts" | grep -v ".spec.ts" | sed "s/.*process\.env\.\([A-Z_]*\).*/\1/" | sort -u
```

This gives the complete list of env vars the app reads. Record it.

---

## PHASE 2 — Compare against .env.example

Read `.env.example`. Every var listed there should also be used in code.
Every var used in code should be documented in `.env.example`.

Gaps:
```
In code but NOT in .env.example: [list — undocumented vars]
In .env.example but NOT in code: [list — stale/dead vars]
```

---

## PHASE 3 — Startup validation

Read `src/main.ts` and any `*.config.ts` files. Verify:

**Required vars must crash-on-missing at startup:**
```typescript
// GOOD — app refuses to start without critical var
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) throw new Error('JWT_SECRET is required')

// OR using @nestjs/config with validation schema (Joi / class-validator)
validationSchema: Joi.object({ JWT_SECRET: Joi.string().required() })
```

**Critical vars that must be validated at startup** (app cannot function without):
- `DATABASE_URL` — no DB = no app
- `JWT_SECRET` — no auth = no security
- `RAZORPAY_KEY_*` / `RAZORPAY_WEBHOOK_SECRET` — payments fail silently
- `NODE_ENV` — affects security (cookie flags, CORS, logging)

For each critical var: does the app validate it exists before accepting traffic?

Record:
```
Startup validation:
  DATABASE_URL:              [validated ✅ | missing ❌]
  JWT_SECRET:                [validated ✅ | missing ❌]
  RAZORPAY_WEBHOOK_SECRET:   [validated ✅ | missing ❌]
  NODE_ENV:                  [validated ✅ | missing ❌]
```

---

## PHASE 4 — Security check on .env.example

`.env.example` must NEVER contain real values:

```bash
grep -v "^#\|=your\|=REPLACE\|=example\|=<\|=$\|=http://localhost\|=redis://localhost\|=postgres://localhost" .env.example
```

Any line that remains contains a potentially real value. Review each:
- Generic placeholder (`your-secret-here`, `xxx`, `changeme`) → OK
- Real-looking value (UUID, real domain, hex string) → FLAG

Record:
```
.env.example safety: [CLEAN | SUSPICIOUS: list lines]
```

---

## PHASE 5 — NODE_ENV awareness

Read code for `NODE_ENV` branching:
```bash
grep -rn "NODE_ENV\|process\.env\.NODE_ENV" src/ --include="*.ts"
```

Verify:
- `NODE_ENV=production` enables stricter settings (HTTPS-only cookies, no stack traces in responses)
- Test-only paths are behind `NODE_ENV !== 'production'` check
- No hardcoded `development` behavior that leaks into prod

---

## ENV AUDIT REPORT

```
CORTEX ENV AUDIT — {date}
═════════════════════════════════════════════════════════
Total vars used:    [N]
Documented:         [N] in .env.example
Undocumented:       [N] (in code, missing from .env.example)
Stale:              [N] (in .env.example, not used in code)
─────────────────────────────────────────────────────────
Startup validation: [N/M] critical vars validated
.env.example:       [CLEAN | N suspicious lines]
NODE_ENV:           [Handled correctly | Missing checks]
═════════════════════════════════════════════════════════
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-env                     COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vars       [N] used | [N] documented | [N] gaps
Startup    [N/M] critical vars validated
Safety     [CLEAN | FLAGS: N]
Logged     LAYER_LOG (ENV_AUDIT) · {date}
Next       [fix undocumented vars | add startup validation | CLEAN — proceed]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

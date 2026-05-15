╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-staging   |  v8.1  |  TIER: 6  |  BUDGET: LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L4 · L7                                        ║
║ AUTHORITY     ║ OBSERVER                                            ║
║ CAN           ║ - Read all src/ files, ai/ files                   ║
║               ║ - Run: npx tsc --noEmit                            ║
║               ║ - Run: npx prisma migrate status                   ║
║               ║ - Run: npx jest --silent                           ║
║ CANNOT        ║ - Modify any source or config files                ║
║               ║ - Access actual .env values                        ║
║ OUTPUTS       ║ - GO / NO-GO verdict                               ║
║               ║ - Completion block: COMPLETE or HARD HALT          ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Staging readiness check. Verifies the app boots, auth works, and code
is clean. Skips third-party integrations — those are checked at production.
Run before every feature push or testing session.

---

## PHASE 1 — AUTOMATED CHECKS

Run all immediately. Report as a block at the end of Phase 1.

**A1 — TypeScript clean**
Run: `npx tsc --noEmit`
- PASS: exit 0
- FAIL: list errors → BLOCKER

**A2 — CORTEX score >= 95**
Read `ai/state/current-score.json` → `enterpriseScore`.
- PASS: >= 95
- FAIL: list low-scoring domains → BLOCKER

**A3 — No secrets in code**
```
grep -r "sk-ant-\|sk-\|AIza\|AKIA\|password.*=.*['\"][^$]" src/ --include="*.ts" -l
grep -rE "(apiKey|secret|password)\s*=\s*['\"][^$'\"]{8,}" src/ --include="*.ts" -l
```
- PASS: no matches
- FAIL: list files → BLOCKER. Run `/cortex-secrets` first.

**A4 — Critical invariants**
Scan for:
- `prisma.$transaction` in orders / payments / coupons services
- `createHmac` in payments service
- No direct `prisma.` calls in `*.controller.ts`
- Any ✖ → BLOCKER

**A5 — Pending migrations**
Run: `npx prisma migrate status`
- PASS: "Database schema is up to date"
- FAIL: list pending → BLOCKER. Run `/cortex-migrate` first.

**A6 — Tests passing**
Run: `npx jest --silent 2>&1 | tail -5`
- PASS: all tests pass
- FAIL: list failing tests → BLOCKER

---

After automated checks, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — AUTOMATED CHECKS [staging]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A1 TypeScript     ✔/✖  {detail}
  A2 Score >= 95    ✔/✖  {score}/100
  A3 No secrets     ✔/✖
  A4 Invariants     ✔/✖  {N/N verified}
  A5 Migrations     ✔/✖  {pending count}
  A6 Tests          ✔/✖  {N passed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blockers: {N} — fix before proceeding
  OR
All automated checks passed — starting HITL checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If any BLOCKER → HARD HALT. Do not proceed to Phase 2.

---

## PHASE 2 — HITL CHECKS

Ask ONE AT A TIME. Wait for response before moving on.

---

### HITL-1 — Core env vars (CRITICAL)

```
─────────────────────────────────────────────
HITL CHECK 1 of 2 — Core Env Vars [staging]
─────────────────────────────────────────────
5 vars required for the app to boot and auth to work:

  DATABASE_URL  JWT_SECRET  JWT_REFRESH_SECRET
  NODE_ENV      CORS_ORIGINS

Are all 5 set in your staging environment?

  1  Yes — all set
  2  Some are missing — I know which ones
  3  Not sure — show me how to verify

Type 1 / 2 / 3:
```

Branch:
- **1** → mark PASS → proceed to HITL-2
- **2** → ask "Which are missing?" → for each:
  - `DATABASE_URL` → "Your Neon/Postgres connection string. Format: postgresql://user:pass@host/db"
  - `JWT_SECRET` → "Any long random string. Generate: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  - `JWT_REFRESH_SECRET` → "Same as above — use a different value from JWT_SECRET"
  - `NODE_ENV` → "Set to: development or staging"
  - `CORS_ORIGINS` → "Your frontend URL. Example: http://localhost:3000"
  - Ask "Done? Type Y to continue or list still-missing vars."
  - Repeat until all confirmed → PASS → proceed to HITL-2
- **3** → output:
  ```
  Run from your exena-api directory:

  node -e "
  const vars = ['DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET','NODE_ENV','CORS_ORIGINS'];
  vars.forEach(v => console.log(v + ':', process.env[v] ? 'SET' : 'MISSING'));
  "
  ```
  Ask: "Type the MISSING ones or CLEAR if all set."
  - CLEAR → PASS → proceed to HITL-2
  - Missing listed → give recovery steps → loop until CLEAR

---

### HITL-2 — Health endpoint (HIGH)

```
─────────────────────────────────────────────
HITL CHECK 2 of 2 — Health Endpoint [staging]
─────────────────────────────────────────────
Is your API running and does GET /api/health return 200?

  1  Yes — returns 200
  2  Not started yet — I'll start it now
  3  Running but not returning 200

Type 1 / 2 / 3:
```

Branch:
- **1** → mark PASS → proceed to VERDICT
- **2** → output:
  ```
  Start the API:  npm run start:dev
  Then test:      curl http://localhost:4000/api/health
  ```
  Ask: "Returns 200? Type Y to continue."
- **3** → ask "What does it return?"
  - 404 → "Health module may not be in AppModule imports — check app.module.ts"
  - 503 → "DB connection failing — check DATABASE_URL is correct and Neon is running"
  - Other → "Share the error and I'll diagnose."
  Ask: "Fixed? Type Y when returning 200."

---

## VERDICT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAGING READINESS REPORT — {today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  GO ✔  /  NO-GO ✖

AUTOMATED
  A1 TypeScript      ✔/✖
  A2 Score >= 95     ✔/✖  {score}/100
  A3 No secrets      ✔/✖
  A4 Invariants      ✔/✖
  A5 Migrations      ✔/✖
  A6 Tests           ✔/✖  {N passed}

HUMAN-VERIFIED
  H1 Core env vars   ✔/✖  (5 vars)
  H2 Health endpoint ✔/✖

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blockers: {list or NONE}
Note: Third-party integrations not checked — run /cortex-production before go-live
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## COMPLETION BLOCKS

If GO:

Write checkpoint to `ai/state/staging-verified.json`:
```json
{
  "verified_at": "[ISO timestamp]",
  "verdict": "GO",
  "checks_passed": "[N/total]",
  "session_date": "[today]"
}
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-staging                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verdict    GO ✔  — ready for testing
Checks     {N}/{total} passed
Checkpoint ai/state/staging-verified.json written
Next       Test your features · run /cortex-production before go-live
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If NO-GO:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-staging               HARD HALT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verdict    NO-GO ✖
Blocked    {list failing checks}
Fix first  {ordered actions}
Re-run     /cortex-staging when resolved
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-production |  v8.2  |  TIER: 6  |  BUDGET: FULL    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L4 · L7 · L8 · L9                             ║
║ AUTHORITY     ║ OBSERVER                                            ║
║ CAN           ║ - Read all src/ files, ai/ files                   ║
║               ║ - Run: npx tsc --noEmit                            ║
║               ║ - Run: npx prisma migrate status                   ║
║               ║ - Run: npx jest --coverage --silent                ║
║               ║ - Read .env.example (never .env)                   ║
║               ║ - Append to ai/lifecycle/LAYER_LOG.md              ║
║ CANNOT        ║ - Modify any source or config files                ║
║               ║ - Push to remote                                   ║
║               ║ - Run migrations (use /cortex-migrate)             ║
║               ║ - Access actual .env values                        ║
║ REQUIRES      ║ - CORTEX score >= 95                               ║
║               ║ - /cortex-staging must have passed first           ║
║ ESCALATES     ║ - Any CRITICAL check fails → NO-GO (HARD HALT)     ║
║ OUTPUTS       ║ - Mode A: interactive HITL · GO / NO-GO verdict    ║
║               ║ - Mode B: full audit checklist at once (no Q&A)    ║
║               ║ - Completion block: COMPLETE or HARD HALT          ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Full production readiness check. Run this once before go-live — not on
every push. Requires /cortex-staging to have passed first (verified via
checkpoint). Verifies all third-party integrations, webhooks, and ops readiness.

---

## PHASE 0 — STAGING GATE (mandatory first step)

Read `ai/state/staging-verified.json`.

If file does NOT exist:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-production            HARD HALT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blocked    /cortex-staging has not been run (no checkpoint found)
Required   Run /cortex-staging first. It must pass (GO verdict) before
           /cortex-production can be run.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If file EXISTS, check `verified_at` timestamp:
- Less than 24 hours ago → PASS — show: `✔ Staging verified: [date]`
- More than 24 hours ago → WARN:
  ```
  ⚠️  Staging check is [N] hours old.
  Environment may have changed since then.
  Recommend re-running /cortex-staging before proceeding.
  Type Y to continue with stale staging check, or N to re-run /cortex-staging first.
  ```
  - Y → proceed with warning logged
  - N → HALT. Run /cortex-staging first.

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

**A6 — Tests + coverage**
Run: `npx jest --coverage --silent 2>&1 | tail -20`
- PASS: all tests pass + statement coverage >= 60%
- PARTIAL: tests pass, coverage < 60% → WARNING
- FAIL: test failures → BLOCKER

**A7 — Open critical issues**
Read `ai/state/open-issues.json`.
- PASS: 0 critical/high issues
- FAIL: list issues → WARNING

**A8 — Sentry integrated**
Scan `src/` for `@sentry/` import or `SENTRY_DSN` reference.
- PASS: found
- FAIL: WARNING — deploying blind without error tracking

**A9 — Dangerous code patterns**
```bash
grep -rn "eval(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// safe\|\.test\.\|spec\."
grep -rn "innerHTML\s*=" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
grep -rn "\$queryRaw\|\\$executeRaw" src/ --include="*.ts" 2>/dev/null
npm audit --audit-level=high 2>&1 | grep -E "critical|high" | head -5
```
- `eval(` in non-test code → BLOCKER
- `$queryRaw` / `$executeRaw` → verify tagged template literal (safe) not string concat (BLOCKER)
- `innerHTML =` → WARNING
- npm audit critical/high → WARNING (log to open-issues.json)

---

After automated checks, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — AUTOMATED CHECKS [production]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A1 TypeScript     ✔/✖  {detail}
  A2 Score >= 95    ✔/✖  {score}/100
  A3 No secrets     ✔/✖
  A4 Invariants     ✔/✖  {N/N verified}
  A5 Migrations     ✔/✖  {pending count}
  A6 Tests          ✔/⚠️  {N passed · coverage %}
  A7 Open issues    ✔/⚠️  {N critical}
  A8 Sentry         ✔/⚠️
  A9 Code patterns  ✔/⚠️  {eval/innerHTML/queryRaw/npm audit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blockers: {N} — fix before proceeding
  OR
All automated checks passed — starting HITL checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If any BLOCKER → HARD HALT. Do not proceed to Phase 2.

---

## PHASE 2 — MODE SELECTOR

After Phase 1 passes, output:

```
─────────────────────────────────────────────
PHASE 2 — How do you want to run HITL checks?
─────────────────────────────────────────────
  A  Live check    Interactive · one question at a time · deploy day
  B  Audit plan    Full checklist printed at once · no Q&A · plan mode

Type A or B:
```

- **A** → proceed to PHASE 2A (interactive HITL, one at a time)
- **B** → proceed to PHASE 2B (full checklist output, then VERDICT)

---

## PHASE 2B — AUDIT CHECKLIST (Mode B)

Print the entire checklist at once. No questions. Human works through it offline.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTION AUDIT CHECKLIST — {today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H1 — ENV VARS (CRITICAL — app crashes without these)
  [ ] DATABASE_URL         set in production environment
  [ ] JWT_SECRET           strong random value (not dev default)
  [ ] JWT_REFRESH_SECRET   strong random value (not dev default)
  [ ] NODE_ENV             = production
  [ ] CORS_ORIGINS         = your live frontend domain(s)
  [ ] RAZORPAY_KEY_ID      LIVE key (not test key)
  [ ] RAZORPAY_KEY_SECRET  LIVE secret (not test)
  [ ] RAZORPAY_WEBHOOK_SECRET  matches what you set in Razorpay dashboard
  [ ] CLOUDINARY_CLOUD_NAME
  [ ] CLOUDINARY_API_KEY
  [ ] CLOUDINARY_API_SECRET

H2 — RAZORPAY WEBHOOK (CRITICAL — orders stay PENDING without this)
  [ ] Webhook registered in Razorpay dashboard
  [ ] URL: https://YOUR-DOMAIN/api/payments/razorpay/webhook
  [ ] Secret matches RAZORPAY_WEBHOOK_SECRET
  [ ] Events enabled: payment.captured · payment.failed · refund.processed

H3 — SHIPROCKET WEBHOOK (HIGH — orders never reach SHIPPED/DELIVERED without this)
  [ ] Webhook configured in Shiprocket account
  [ ] URL: https://YOUR-DOMAIN/api/delivery/webhook/shiprocket
  [ ] Events: shipment_status_changed · delivered · rto
  [ ] OR: acknowledged manual status updates until webhook is set up

H4 — HEALTH ENDPOINT (HIGH — Railway health checks need this)
  [ ] GET /api/health returns 200 in production
  [ ] DB connection confirmed (not just app start)

H5 — MSG91 OTP (HIGH — no login without this)
  [ ] SMS_PROVIDER=msg91 (not mock)
  [ ] Real OTP test: send + receive SMS + verify code
  [ ] MSG91_AUTH_KEY set and active

H6 — PRE-DELIVERY CHECKLIST (MEDIUM)
  --- Financial ---
  [ ] Order total recalculated inside transaction
  [ ] Invoice atomic numbering
  [ ] Coupon atomic enforcement
  [ ] Price/Tax/Quantity CHECK constraints
  [ ] No read-modify-write counters
  --- Inventory ---
  [ ] Variant stock validated + decremented
  [ ] Expiry restores stock
  [ ] Cancel restores stock
  [ ] No negative stock possible
  --- Idempotency ---
  [ ] Order idempotent replay safe
  [ ] Payment webhook dedup
  [ ] Delivery webhook dedup
  [ ] Invoice idempotent
  --- Concurrency ---
  [ ] Double-click checkout safe
  [ ] Concurrent checkout safe
  [ ] Webhook replay safe
  [ ] Cron double-run safe
  --- Observability ---
  [ ] All financial mutations logged
  [ ] No silent catch
  [ ] Proper HTTP mapping for DB errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Work through these before deploy day.
When all are checked: re-run /cortex-production → choose A (Live check).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

After printing the checklist, output the Mode B completion block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-production          AUDIT PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode       B — Audit plan (HITL not verified interactively)
Automated  {N}/{total} passed · {W} warnings
Checklist  Printed — work through before deploy day
Next       Complete checklist → re-run with Mode A on deploy day
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then stop. Do not run VERDICT for Mode B — no interactive confirmation was given.

---

## PHASE 2A — HITL CHECKS (Mode A)

Ask ONE AT A TIME. Wait for response before moving on.

---

### HITL-A1 — All env vars (CRITICAL)

```
─────────────────────────────────────────────
HITL CHECK 1 of 6 — All Env Vars [production]
─────────────────────────────────────────────
All 11 vars required for production:

  CORE (app + auth)
    DATABASE_URL  JWT_SECRET  JWT_REFRESH_SECRET  NODE_ENV  CORS_ORIGINS

  PAYMENTS
    RAZORPAY_KEY_ID  RAZORPAY_KEY_SECRET  RAZORPAY_WEBHOOK_SECRET

  STORAGE
    CLOUDINARY_CLOUD_NAME  CLOUDINARY_API_KEY  CLOUDINARY_API_SECRET

Are all 11 set in your production environment?

  1  Yes — all 11 are set and correct
  2  Some are missing — I know which ones
  3  Not sure — show me how to verify

Type 1 / 2 / 3:
```

Branch:
- **1** → mark PASS → proceed to HITL-2
- **2** or **3** → HARD HALT immediately:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CORTEX  /cortex-production            HARD HALT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Blocked    H1 — Not all 11 env vars confirmed
  Required   Set all 11 vars in your production environment
             then re-run /cortex-production
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
  Do not proceed to HITL-2. Stop here.

---

### HITL-2 — Razorpay webhook (CRITICAL)

```
─────────────────────────────────────────────
HITL CHECK 2 of 6 — Razorpay Webhook
─────────────────────────────────────────────
Your endpoint: POST /api/payments/razorpay/webhook  ✔ (verified in code)

Without this, payments are never confirmed — orders stay PENDING forever.
Users will pay but never get order confirmation.

Is the Razorpay webhook registered in your dashboard?

  1  Yes — registered and pointing to my domain
  2  No — I need to set it up
  3  Registered but not sure which events are enabled

Type 1 / 2 / 3:
```

Branch:
- **1** → ask: "Are these 3 events enabled: payment.captured · payment.failed · refund.processed? (Y/N)"
  - Y → PASS → proceed to HITL-3
  - N → "Go to Razorpay Dashboard → Settings → Webhooks → edit → enable those 3 events." → ask "Done? Y to continue."
- **2** → output:
  ```
  1. Razorpay Dashboard → Settings → Webhooks → + Add New Webhook
  2. URL: https://YOUR-DOMAIN/api/payments/razorpay/webhook
  3. Secret: value of RAZORPAY_WEBHOOK_SECRET
  4. Enable: payment.captured · payment.failed · refund.processed
  5. Save
  ```
  Ask: "Done? Type Y to continue."
- **3** → output: "Edit your webhook → enable: payment.captured · payment.failed · refund.processed" → ask "Done? Y to continue."

---

### HITL-3 — Shiprocket webhook (HIGH)

```
─────────────────────────────────────────────
HITL CHECK 3 of 6 — Shiprocket Webhook
─────────────────────────────────────────────
Your endpoint: POST /api/delivery/webhook/shiprocket  ✔ (verified in code)

Without this, orders never auto-update to SHIPPED or DELIVERED.
Customers will see PROCESSING forever.

Is the Shiprocket webhook configured in your account?

  1  Yes — configured and pointing to my domain
  2  No — I need to set it up
  3  Skip — I will update order status manually for now

Type 1 / 2 / 3:
```

Branch:
- **1** → PASS → proceed to HITL-4
- **2** → output:
  ```
  1. Shiprocket Dashboard → Settings → API → Webhooks
  2. URL: https://YOUR-DOMAIN/api/delivery/webhook/shiprocket
  3. Enable: shipment_status_changed · delivered · rto
  4. Save
  ```
  Ask: "Done? Type Y to continue."
- **3** → WARNING (acknowledged). Note: "Manual status updates required post-launch." → proceed to HITL-4

---

### HITL-4 — Health endpoint (HIGH)

```
─────────────────────────────────────────────
HITL CHECK 4 of 6 — Health Endpoint
─────────────────────────────────────────────
Does GET /api/health return 200 in production?

  1  Yes — tested it, returns 200
  2  Not deployed yet
  3  Running but returning something other than 200

Type 1 / 2 / 3:
```

Branch:
- **1** → PASS → proceed to HITL-5
- **2** → "Deploy first, then re-run /cortex-production." → mark BLOCKER
- **3** → ask "What does it return?"
  - 404 → "Health module not in AppModule imports — check app.module.ts"
  - 503 → "DB or Redis connection failing — check DATABASE_URL and REDIS_URL"
  - Other → "Share the error and I'll diagnose."
  Ask: "Fixed? Type Y when returning 200."

---

### HITL-5 — MSG91 OTP (HIGH)

```
─────────────────────────────────────────────
HITL CHECK 5 of 6 — MSG91 OTP
─────────────────────────────────────────────
OTP is the primary login for Indian users. If broken, no one can log in.

Have you tested a real OTP send via MSG91 in production?

  1  Yes — received SMS and verified OTP successfully
  2  Not tested yet
  3  Still using mock OTP (SMS_PROVIDER=mock)

Type 1 / 2 / 3:
```

Branch:
- **1** → PASS → proceed to HITL-6
- **2** → output:
  ```
  Test before launch:
  1. Set SMS_PROVIDER=msg91 in production env
  2. POST /api/auth/otp/send  { "phone": "+91XXXXXXXXXX" }
  3. Wait for SMS (< 30 seconds)
  4. POST /api/auth/otp/verify  { "phone": "...", "code": "..." }
  ```
  Ask: "Tested successfully? Y to continue / W to mark as warning and proceed."
  - Y → PASS → proceed to HITL-6
  - W → WARNING → proceed to HITL-6
- **3** → BLOCKER. "Switch SMS_PROVIDER=msg91 in production env before go-live. Mock OTP means real users cannot log in." → ask "Switched and tested? Y to continue."

---

### HITL-6 — Pre-delivery checklist (MEDIUM)

Read `ai/pre-delivery-checklist.md` and display its contents, then:

```
─────────────────────────────────────────────
HITL CHECK 6 of 6 — Pre-Delivery Checklist
─────────────────────────────────────────────
[checklist items shown above]

Have you reviewed and actioned all items?

  1  Yes — all checked
  2  Some pending — I know which ones
  3  First time — walk me through it

Type 1 / 2 / 3:
```

Branch:
- **1** → PASS → proceed to VERDICT
- **2** → ask "Which are pending?" → for each, give guidance → ask "Done? Y to continue."
- **3** → walk through each item one at a time. For each: what it is, why it matters, how to verify. After each: "Done? Y / S to skip with warning."

---

## VERDICT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTION READINESS REPORT — {today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  GO ✔  /  NO-GO ✖  /  GO WITH WARNINGS ⚠️

AUTOMATED
  A1 TypeScript      ✔/✖
  A2 Score >= 95     ✔/✖  {score}/100
  A3 No secrets      ✔/✖
  A4 Invariants      ✔/✖
  A5 Migrations      ✔/✖
  A6 Tests           ✔/⚠️  {N passed · coverage %}
  A7 Open issues     ✔/⚠️
  A8 Sentry          ✔/⚠️
  A9 Code patterns   ✔/⚠️

HUMAN-VERIFIED
  H1 All env vars (11)  ✔/✖
  H2 Razorpay webhook   ✔/✖
  H3 Shiprocket webhook ✔/⚠️
  H4 Health endpoint    ✔/✖
  H5 MSG91 OTP          ✔/✖
  H6 Pre-delivery list  ✔/⚠️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blockers: {list or NONE}
Warnings: {list or NONE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**GO** = all checks pass (warnings allowed)
**NO-GO** = any BLOCKER remains
**GO WITH WARNINGS** = no blockers, some acknowledged warnings

---

## POST-CHECK LOGGING

Append to `ai/lifecycle/LAYER_LOG.md`:
```
[{ISO timestamp}]
TYPE: PRELAUNCH_CHECK
ENV: production
VERDICT: GO / NO-GO / GO_WITH_WARNINGS
CHECKS_PASSED: {N}/{total}
WARNINGS: {N}
DETAIL: {one-line summary}
```

---

## COMPLETION BLOCKS

If GO or GO WITH WARNINGS:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-production              COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verdict    GO ✔  {or GO WITH WARNINGS ⚠️}
Checks     {N}/{total} passed · {W} warnings
Logged     LAYER_LOG · {date}
Next       Deploy · monitor Sentry on first traffic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If NO-GO:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-production            HARD HALT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verdict    NO-GO ✖
Blocked    {list failing checks}
Fix first  {ordered actions}
Re-run     /cortex-production when resolved
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

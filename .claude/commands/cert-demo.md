╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-demo  |  v8.0  |  TIER: 7  |  BUDGET: LEAN          ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L4 · L8                                        ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Read .env.example (never .env)                    ║
║               ║ - Read package.json, src/ imports                   ║
║               ║ - Run: health/ping scripts listed below             ║
║               ║ - Run: prisma db execute (read-only ping)           ║
║               ║ - Append to ai/lifecycle/LAYER_LOG.md               ║
║ CANNOT        ║ - Modify any source or config files                 ║
║               ║ - Read actual .env values                           ║
║               ║ - Send real OTP/email/payment transactions          ║
║               ║ - Push to remote                                    ║
║ REQUIRES      ║ - MASTER.md loaded                             ║
║               ║ - App server(s) running before this skill executes  ║
║ ESCALATES     ║ - Any CRITICAL service down → DEMO BLOCKED          ║
║ OUTPUTS       ║ - DEMO READY / DEMO BLOCKED verdict per service     ║
║               ║ - Completion block: COMPLETE or HARD HALT           ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Pre-demo connectivity verifier. Run this before every client-facing demo or presentation.
Checks that every external service the app depends on is actually reachable and responding —
not just that env vars are set, but that the connection works live.

Different from /cortex-prelaunch (code-level production gates).
This skill is purely about: "Will the app work end-to-end right now?"

$ARGUMENTS

Parse from $ARGUMENTS:
- `stack` — override detected stack: `nestjs` | `nextjs` | `spring` | `django` | `auto` (default: `auto`)
- `skip` — comma-separated services to skip (e.g. `skip=sentry,shiprocket`)
- `mode` — `demo` (default) | `staging` | `local`
- `quick` — skip advisory checks, run CRITICAL only

---

## STEP 0 — Service Discovery + User Declaration

### 0A — Auto-detect from project files

**A. Read `.env.example`** (if it exists) — list all key names present.
**B. Read `package.json`** — scan `dependencies` for service SDK packages.
**C. Read `src/` imports** (scan top-level service files for SDK imports).

Build a service map using these signals:

| Signal | Service detected |
|--------|-----------------|
| `DATABASE_URL` in env.example OR `prisma`, `typeorm`, `mongoose`, `sequelize` in package.json | Database |
| `REDIS_URL` or `REDIS_HOST` in env.example OR `ioredis`, `redis`, `bullmq` in package.json | Redis / Queue |
| `MSG91_*` OR `TWILIO_*` OR `FIREBASE_*` in env.example | OTP / SMS service |
| `RAZORPAY_*` in env.example OR `razorpay` in package.json | Razorpay |
| `STRIPE_*` in env.example OR `stripe` in package.json | Stripe |
| `PAYPAL_*` in env.example | PayPal |
| `RESEND_*` OR `SENDGRID_*` OR `SMTP_*` OR `MAILER_*` in env.example | Email service |
| `CLOUDINARY_*` in env.example OR `cloudinary` in package.json | Cloudinary |
| `AWS_*` + `S3_BUCKET` in env.example OR `@aws-sdk` in package.json | AWS S3 |
| `SHIPROCKET_*` in env.example | Shiprocket |
| `SENTRY_DSN` in env.example OR `@sentry/` in package.json | Sentry |
| `ALGOLIA_*` in env.example OR `algoliasearch` in package.json | Algolia |
| `ELASTICSEARCH_URL` in env.example OR `@elastic/` in package.json | Elasticsearch |
| `PUSHER_*` OR `FIREBASE_*` in env.example | Push notifications |
| Health endpoint exists (`/health`, `/api/health`) | App server health |

### 0B — User Declaration (ALWAYS ask, even if auto-detect succeeded)

After auto-detection, present the detected list and ask the user to confirm or extend it.
Output this exact prompt and WAIT for the user's response before continuing:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-demo  —  SERVICE DECLARATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auto-detected: {list each detected service}

Before I run connectivity checks, tell me:

1. Is this list complete, or are there services I missed?
   (e.g. a custom auth server, a third-party API, an internal microservice)

2. Which of these must work for your demo to succeed?
   Mark each as:
     [CRITICAL] — demo breaks without it (login, payments, core flow)
     [NEEDED]   — used in demo but has a workaround if it fails
     [OPTIONAL] — background / not shown in demo

3. Are there any services NOT auto-detected that you want me to check?
   (e.g. a specific API endpoint, an internal service URL, a webhook receiver)

Type your answers, then I will proceed with checks.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**IMPORTANT:** Do NOT run any checks until the user responds to Step 0B.
Merge user-declared services with auto-detected ones.
Override criticality level if user explicitly sets it differently from the default tier.

Output final confirmed service list before starting checks:
```
Confirmed services to check:
  [CRITICAL]  Database · Redis · OTP (MSG91) · Razorpay · App server
  [NEEDED]    Email (Resend) · Cloudinary
  [OPTIONAL]  Sentry · Shiprocket
  [SKIPPED]   {per --skip or user exclusion}
```

---

## CHECK TIERS

### TIER 1 — CRITICAL (any failure = DEMO BLOCKED)

These services going down will break the demo visibly for the client.

---

**D1 — Database connectivity**

Detected: PostgreSQL / MySQL / MongoDB / SQLite

For Prisma projects:
```bash
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1
```
For non-Prisma: ask user to run equivalent ping or check health endpoint.

- PASS: command exits 0 / returns result
- FAIL: connection refused / auth error / timeout → DEMO BLOCKED
- Detail on fail: show error line, suggest: check DATABASE_URL, check DB server is running

---

**D2 — Redis / Queue connectivity** _(if detected)_

```bash
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL || 'redis://localhost:6379'); r.ping().then(v => { console.log('PONG:', v); r.quit(); }).catch(e => { console.error('FAIL:', e.message); r.quit(); });" 2>&1
```

Or if bullmq:
```bash
node -e "const { Queue } = require('bullmq'); const q = new Queue('ping-test', { connection: { host: process.env.REDIS_HOST || 'localhost', port: 6379 }}); q.getJobCounts().then(() => { console.log('PASS'); q.close(); }).catch(e => { console.error('FAIL:', e.message); q.close(); });" 2>&1
```

- PASS: PONG received / job counts returned
- FAIL: ECONNREFUSED / auth error → DEMO BLOCKED
- Impact: background jobs (email queue, notification queue, order processing) will silently fail during demo

---

**D3 — App server health** _(if health endpoint exists)_

```bash
curl -sf http://localhost:4000/api/health 2>&1 || curl -sf http://localhost:3000/api/health 2>&1
```

Adapt port from project context (check `main.ts`, `package.json` start script, or `next.config.js`).

- PASS: HTTP 200 with body
- FAIL: connection refused / non-200 → DEMO BLOCKED
- Detail on fail: "API server is not running. Run: npm run start:dev"

---

### TIER 2 — HIGH (failure = DEMO BLOCKED unless --skip used)

These services will cause visible demo failures for specific flows.

---

**D4 — OTP / SMS service** _(if MSG91 / Twilio / Firebase detected)_

Do NOT send a real OTP. Instead check:
1. Env var presence: ask "Is [MSG91_AUTH_KEY / TWILIO_ACCOUNT_SID] set in your .env?"
2. If project has a test script: `node scripts/test-otp.js` or equivalent
3. Otherwise: ask "Did you receive an OTP successfully in a test login within the last hour?"

- PASS: user confirms or test script passes
- FAIL: user says no / script fails → DEMO BLOCKED
- Impact: login flow will break — the client cannot log in during demo
- Workaround: pre-login before demo starts and keep session active

---

**D5 — Payment gateway** _(if Razorpay / Stripe / PayPal detected)_

For Razorpay:
```bash
node -e "const Razorpay = require('razorpay'); const r = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }); r.orders.all({ count: 1 }).then(() => console.log('PASS')).catch(e => console.error('FAIL:', e.message));" 2>&1
```

For Stripe:
```bash
node -e "const Stripe = require('stripe'); const s = Stripe(process.env.STRIPE_SECRET_KEY); s.balance.retrieve().then(() => console.log('PASS')).catch(e => console.error('FAIL:', e.message));" 2>&1
```

- PASS: API call returns without auth error
- FAIL: 401 / invalid key → DEMO BLOCKED
- IMPORTANT: Always use TEST MODE keys for demos (check key prefix: `rzp_test_` / `sk_test_`)
- If LIVE keys detected → warn: "LIVE payment keys in demo environment — switch to test keys"

---

**D6 — Email service** _(if Resend / SendGrid / SMTP detected)_

For Resend:
```bash
node -e "const { Resend } = require('resend'); const r = new Resend(process.env.RESEND_API_KEY); r.emails.send({ from: 'test@yourdomain.com', to: 'test@example.com', subject: 'ping', html: 'ping' }).then(d => { if(d.error) console.error('FAIL:', d.error.message); else console.log('PASS:', d.data.id); }).catch(e => console.error('FAIL:', e.message));" 2>&1
```

For SMTP: ask "Can you send a test email from the app (e.g. password reset)?"

- PASS: email sent or ID returned
- FAIL: auth error / timeout → DEMO BLOCKED if email flow is in the demo script
- If email is not part of demo script → downgrade to WARNING

---

**D7 — File storage** _(if Cloudinary / S3 detected)_

For Cloudinary:
```bash
node -e "const cloudinary = require('cloudinary').v2; cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET }); cloudinary.api.ping().then(r => console.log('PASS:', r.status)).catch(e => console.error('FAIL:', e.message));" 2>&1
```

For S3:
```bash
node -e "const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3'); const s3 = new S3Client({ region: process.env.AWS_REGION }); s3.send(new ListBucketsCommand({})).then(() => console.log('PASS')).catch(e => console.error('FAIL:', e.message));" 2>&1
```

- PASS: ping/list returns successfully
- FAIL: auth error / network error → DEMO BLOCKED if upload/image display is in demo
- Common cause: Cloudinary free-tier storage limit exceeded → check dashboard

---

### TIER 3 — ADVISORY (failure = WARNING — demo can proceed, note the gap)

These won't break the demo but could cause awkward moments or silent failures.

---

**A1 — Shipping / logistics API** _(if Shiprocket / EasyPost / etc. detected)_

Ask: "Did you test order creation → shipping webhook flow recently?"
Check that webhook endpoint exists: scan `src/` for `webhook/shiprocket` or equivalent.

- PASS: user confirms + endpoint exists
- WARNING: demo may show incorrect order status after shipment creation

---

**A2 — Push notifications** _(if Firebase / Pusher / OneSignal detected)_

Ask: "Are push notifications working in the demo environment?"
Check FCM/Pusher credentials are set.

- PASS: user confirms
- WARNING: notification bell / real-time updates may not fire during demo

---

**A3 — Error monitoring** _(if Sentry detected)_

Ask: "Is Sentry capturing events from this environment?"
Check: `SENTRY_DSN` is set, `NODE_ENV` is not `test`.

- PASS: user confirms or DSN is set
- WARNING: errors during demo won't be captured — manual logging only

---

**A4 — Demo data exists**

Ask: "Is there meaningful seed/demo data in the database?"
Check: at least one of these exists (ask user to confirm):
- At least 1 user account with known credentials
- At least 1 product / item visible in the storefront
- At least 1 completed order (for order history demo)
- No "Lorem ipsum" / placeholder text visible in the UI

- PASS: user confirms all demo data is in place
- WARNING: demo may hit empty states or error pages

---

**A5 — Test / debug mode not active**

Scan for these in source (changed files or `src/main.ts`, `src/app.module.ts`):
```bash
grep -r "console\.log\|DEBUG.*true\|NODE_ENV.*test\|isDev.*true" src/main.ts src/app.module.ts 2>/dev/null | grep -v "spec.ts"
```

Check: is `NODE_ENV=production` or `NODE_ENV=staging` (not `development` or `test`)?
Ask: "Are you demoing against production/staging, or local dev?"

- PASS: no debug flags / production env confirmed
- WARNING: console logs / debug panels may appear during client demo

---

**A6 — Live keys vs test keys**

Scan `.env.example` for key naming patterns. Ask:
"Are all service keys in TEST mode? (Razorpay: rzp_test_ | Stripe: sk_test_ | MSG91: test template)"

- PASS: user confirms test keys
- WARNING if demo is on prod keys: "Live payment keys active — real charges possible during demo"
- HARD WARN: if demo is intended to be transactional with real data, flag this explicitly

---

## VERDICT

After all checks, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEMO CONNECTIVITY REPORT — {today} — {mode}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:   DEMO READY ✔  /  DEMO BLOCKED ✖  /  DEMO READY WITH WARNINGS ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL  (any failure = DEMO BLOCKED)
  D1  Database           ✔ / ✖  {detail}
  D2  Redis / Queue      ✔ / ✖  {detail}      [SKIP if not detected]
  D3  App server health  ✔ / ✖  {port checked}

HIGH  (failure = DEMO BLOCKED for that flow)
  D4  OTP / SMS          ✔ / ✖  {provider}    [SKIP if not detected]
  D5  Payment gateway    ✔ / ✖  {provider · test/live key}
  D6  Email service      ✔ / ✖  {provider}    [SKIP if not detected]
  D7  File storage       ✔ / ✖  {provider}    [SKIP if not detected]

ADVISORY  (note only — demo can proceed)
  A1  Shipping API       ✔ / ⚠️  {detail}
  A2  Push notifications ✔ / ⚠️  {detail}
  A3  Error monitoring   ✔ / ⚠️  {Sentry status}
  A4  Demo data          ✔ / ⚠️  {missing items}
  A5  Debug mode off     ✔ / ⚠️  {flags found}
  A6  Test keys active   ✔ / ⚠️  {live key warning}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blockers:     {list all D/H failures — or NONE}
Fix now:      {ordered quick-fix list}
Proceed with: {advisory items to mention to team but not blockers}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**DEMO READY** = all D and H checks pass (advisory warnings allowed)
**DEMO BLOCKED** = any D or H check fails
**DEMO READY WITH WARNINGS** = D + H pass, some A warnings

---

## GUIDED TROUBLESHOOTING (step-by-step on failure)

When any check fails, do NOT dump all fixes at once.
Walk the user through recovery ONE STEP AT A TIME.

**Protocol:**
1. Show what failed and why (one line).
2. Give Step 1 only.
3. Ask: "Did that work? (yes / no / error: <paste error>)"
4. Based on response, give Step 2 or branch to the relevant sub-path.
5. Continue until connection succeeds or user decides to skip.

Use this structure for each failed service:

---

### Database connection failed

```
DATABASE — FAILED
Error: {connection refused / auth failed / timeout}

Let's fix this step by step.

Step 1: Is your database server running?
  PostgreSQL: run  →  pg_ctl status   (or check Docker: docker ps | grep postgres)
  MySQL:      run  →  mysqladmin ping
  Docker:     run  →  docker-compose ps
  → Did it show as running? (yes / no)
```

If no:
```
Step 2: Start the database.
  Docker:      →  docker-compose up -d db
  PostgreSQL:  →  pg_ctl start -D /usr/local/var/postgresql
  MySQL:       →  brew services start mysql   (macOS) / sudo systemctl start mysql (Linux)
  → Run it and tell me what you see.
```

If yes (running but still failing):
```
Step 2: Check your DATABASE_URL in .env
  Expected format:
    PostgreSQL: postgresql://USER:PASSWORD@HOST:5432/DBNAME
    MySQL:      mysql://USER:PASSWORD@HOST:3306/DBNAME
  → Does your DATABASE_URL match this format? (yes / no / paste the URL without password)
```

If URL looks wrong:
```
Step 3: Fix the DATABASE_URL in your .env, then re-run:
  npx prisma db execute --stdin <<< "SELECT 1;"
  → What does it output?
```

If URL looks right but still failing:
```
Step 3: Test the connection directly.
  psql "postgresql://USER:PASSWORD@HOST:5432/DBNAME" -c "SELECT 1;"
  → Paste the error you see.
```

Continue branching based on the error pasted (auth error → check password, host not found → check HOST, SSL → add ?sslmode=require).

---

### Redis connection failed

```
REDIS — FAILED
Error: {ECONNREFUSED / auth error}

Step 1: Is Redis running?
  Run:  redis-cli ping
  Docker: docker ps | grep redis
  → Did you get PONG? (yes / no)
```

If no:
```
Step 2: Start Redis.
  Docker:  →  docker-compose up -d redis
  Local:   →  redis-server
  macOS:   →  brew services start redis
  → Run it. Does  redis-cli ping  now return PONG?
```

If yes but app still fails:
```
Step 2: Check your REDIS_URL / REDIS_HOST in .env
  Expected: redis://localhost:6379  (or redis://:PASSWORD@HOST:PORT if auth)
  → Is yours correct?
```

If Redis has a password set:
```
Step 3: Test with auth:
  redis-cli -h HOST -p PORT -a PASSWORD ping
  → Result?
```

---

### App server not responding

```
APP SERVER — FAILED
Port {4000 / 3000} not responding.

Step 1: Is the server process running?
  Run:  lsof -i :{port}   (macOS/Linux)
        netstat -ano | findstr :{port}   (Windows)
  → Is anything listening on that port? (yes / no)
```

If no:
```
Step 2: Start the server.
  API:    →  npm run start:dev   (from exena-api / your backend dir)
  Web:    →  npm run dev         (from exena-web / your frontend dir)
  Admin:  →  npm run dev         (from exena-admin)
  → Paste the startup output or any errors.
```

If startup errors:
```
Step 3: Check for missing env vars.
  Common causes:
    - "Cannot connect to database" → DATABASE_URL wrong (fix Database step above)
    - "Cannot connect to Redis"    → Redis not running (fix Redis step above)
    - "Module not found"           → run npm install
    - Port already in use          → kill the process:  kill $(lsof -t -i:{port})
  → Which error are you seeing?
```

---

### OTP / SMS service failed

```
OTP SERVICE — FAILED

Step 1: Check that your OTP provider key is set in .env
  MSG91:   MSG91_AUTH_KEY should be present and non-empty
  Twilio:  TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
  → Is the key set? (yes / no)
```

If no:
```
Step 2: Get the key from your provider dashboard.
  MSG91:  https://control.msg91.com → API → Auth Key
  Twilio: https://console.twilio.com → Account Info
  Add it to your .env, restart the server, then re-run /cortex-demo.
```

If yes but failing:
```
Step 2: Test the key directly.
  MSG91 example:
    curl -X POST "https://api.msg91.com/api/v5/otp?mobile=91XXXXXXXXXX&authkey=YOUR_KEY&template_id=YOUR_TEMPLATE"
  → Paste the response (not the key — just the response body).
```

Branch based on response:
- `{"type":"success"}` → key works, issue is in app config → check template ID / sender ID
- `{"message":"Authentication failed"}` → key is wrong or expired → regenerate in dashboard
- Network error → check server has outbound internet access

---

### Payment gateway failed

```
PAYMENT GATEWAY — FAILED
Error: {401 / invalid key / network error}

Step 1: Verify you are using TEST keys (not live keys) for demo.
  Razorpay test key format:  rzp_test_XXXXXXXXXXXX
  Stripe test key format:    sk_test_XXXXXXXXXXXX
  → What is the prefix of your key? (rzp_test_ / rzp_live_ / sk_test_ / sk_live_)
```

If live key in demo:
```
STOP — Live keys detected in demo environment.
Do NOT proceed with live keys during a client demo — real charges can occur.

Step 2: Switch to test keys.
  Razorpay: https://dashboard.razorpay.com → Settings → API Keys → Test Mode
  Stripe:   https://dashboard.stripe.com → Developers → API Keys → Test
  Update RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env, restart server.
  → Done? Re-run /cortex-demo.
```

If test key but still failing:
```
Step 2: Verify the key is active.
  Razorpay: Log in → API Keys → confirm test key matches .env
  → Does it match? (yes / no)
```

If mismatch:
```
Step 3: Copy the exact key from the dashboard into .env.
  No trailing spaces or quotes. Restart server. Re-run.
```

---

### Email service failed

```
EMAIL — FAILED

Step 1: Is your API key set?
  Resend:    RESEND_API_KEY
  SendGrid:  SENDGRID_API_KEY
  → Is it set and non-empty in .env? (yes / no)
```

If no: → direct to provider dashboard to get key.

If yes:
```
Step 2: Test the key directly.
  Resend:
    curl -X POST https://api.resend.com/emails \
      -H "Authorization: Bearer YOUR_KEY" \
      -H "Content-Type: application/json" \
      -d '{"from":"test@yourdomain.com","to":["test@example.com"],"subject":"ping","html":"<p>ping</p>"}'
  → Paste the response.
```

Branch:
- `{"id":"..."}` → key works, check FROM address is verified domain
- `{"statusCode":401}` → key invalid or expired → regenerate
- `{"statusCode":403}` → FROM address not verified → verify domain in Resend/SendGrid dashboard

---

### File storage failed (Cloudinary / S3)

```
FILE STORAGE — FAILED

Step 1: Are credentials set in .env?
  Cloudinary: CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
  S3:         AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION + S3_BUCKET
  → Are all three/four vars set? (yes / no)
```

If yes:
```
Step 2: Test the ping directly.
  Cloudinary:
    node -e "const c=require('cloudinary').v2; c.config({cloud_name:'YOUR_CLOUD',api_key:'YOUR_KEY',api_secret:'YOUR_SECRET'}); c.api.ping().then(r=>console.log(r)).catch(e=>console.error(e.message));"
  → What does it output?
```

Branch:
- `{"status":"ok"}` → credentials work, issue is in app config → check env var names
- `Must supply api_key` → CLOUDINARY_API_KEY is empty or wrong name in code
- `Invalid credentials` → key/secret mismatch → copy fresh from Cloudinary dashboard
- Storage limit error → check Cloudinary dashboard for plan limits

---

### Generic / User-Declared Service failed

When a user-declared service (Step 0B) that has no built-in check fails:

```
{SERVICE NAME} — could not verify automatically.

Step 1: What does this service do in your app?
  (e.g. "it's an internal auth microservice on port 5001")

Step 2: How can I test it?
  Options:
    a) Give me the health endpoint URL
    b) Give me the test command
    c) Tell me the expected response when it's working

→ Your answer?
```

Then run the provided command/URL and guide from the actual output.

---

## POST-CHECK

After check (pass or fail), append to `ai/lifecycle/LAYER_LOG.md`:

```
[{ISO timestamp}]
TYPE:    DEMO_CHECK
MODE:    {mode}
VERDICT: DEMO READY / DEMO BLOCKED / DEMO READY WITH WARNINGS
SERVICES_CHECKED: {list}
SERVICES_PASSED:  {N}
SERVICES_FAILED:  {list or NONE}
WARNINGS:         {N}
DETAIL:  Pre-demo connectivity check. {one-line summary of result}
```

---

## COMPLETION

If DEMO READY:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-demo                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verdict    DEMO READY ✔
Services   {N}/{total} connected
Warnings   {N}
Logged     LAYER_LOG · {date}
Next       Start demo · keep this terminal open for quick diagnosis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If DEMO BLOCKED:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-demo                 HARD HALT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Policy     Demo readiness gate
Verdict    DEMO BLOCKED ✖
Blocked    {list of failed services}
Fix now    {ordered quick-fix list}
Re-run     /cortex-demo after fixing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

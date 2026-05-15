# cortex-discover — Universal Project Intelligence
> Runs once when CORTEX is installed in any project.
> Re-run after major architectural changes or when starting fresh.
> Output: PROJECT_INTELLIGENCE.md — the project's auto-generated brain.

---

## What This Skill Does

Scans ANY codebase end-to-end, detects its type, maps its structure,
infers business rules from code, and produces a complete project intelligence
document. Works on any language, any framework, any business domain.

---

## PHASE 1 — STACK DETECTION

Scan these files to identify the tech stack:

```bash
# Package managers + dependencies
cat package.json 2>/dev/null
cat requirements.txt 2>/dev/null
cat Gemfile 2>/dev/null
cat pom.xml 2>/dev/null
cat go.mod 2>/dev/null
cat composer.json 2>/dev/null

# Framework detection
ls src/ 2>/dev/null
ls app/ 2>/dev/null
find . -name "*.module.ts" | head -5      # NestJS
find . -name "settings.py" | head -3      # Django
find . -name "application.properties" | head -3  # Spring
find . -name "next.config.*" | head -3    # Next.js
find . -name "nuxt.config.*" | head -3    # Nuxt
```

Build the stack profile:
```
Language:      TypeScript | JavaScript | Python | Java | Go | Ruby | PHP
Backend:       NestJS | Express | FastAPI | Django | Spring | Rails | Laravel
Frontend:      Next.js | Nuxt | Remix | React SPA | Vue SPA | None
Database:      PostgreSQL | MySQL | MongoDB | SQLite | Redis
ORM:           Prisma | TypeORM | SQLAlchemy | Hibernate | ActiveRecord
Queue:         BullMQ | Celery | Sidekiq | RabbitMQ | None
Auth:          JWT | Session | OAuth | OTP | None detected
Payments:      Razorpay | Stripe | PayPal | None
Storage:       Cloudinary | S3 | GCS | Local
Email:         Resend | SendGrid | SES | Mailchimp | None
```

---

## PHASE 2 — BUSINESS TYPE DETECTION

Analyse routes, models, and naming to classify the business:

### Signals to look for:

**E-commerce:**
- Models: Product, Order, Cart, Payment, Coupon, Shipment, Invoice
- Routes: /products, /cart, /orders, /checkout, /payments/webhook
- Services: inventory, shipping, tax calculation

**SaaS / Subscription:**
- Models: Tenant, Subscription, Plan, Usage, Invoice, Feature
- Routes: /subscriptions, /plans, /billing, /usage
- Patterns: multi-tenancy, usage limits, plan gates

**Marketplace:**
- Models: Seller/Vendor, Buyer, Listing, Bid, Payout, Commission
- Routes: /listings, /sellers, /bids, /payouts
- Patterns: two-sided (supply + demand), escrow payments

**Fintech:**
- Models: Account, Transaction, Ledger, KYC, Wallet, Transfer
- Routes: /accounts, /transfers, /kyc, /statements
- Patterns: double-entry accounting, compliance checks

**Healthcare:**
- Models: Patient, Doctor, Appointment, Prescription, Record
- Routes: /appointments, /patients, /records
- Patterns: HIPAA-aware, role-based clinical access

**EdTech:**
- Models: Course, Student, Enrollment, Lesson, Quiz, Certificate
- Routes: /courses, /enroll, /progress, /certificates
- Patterns: content delivery, progress tracking

**Content/Media:**
- Models: Post, Author, Category, Comment, Media, Tag
- Routes: /posts, /authors, /media/upload
- Patterns: CMS-like, publishing workflow

**Generic API / Unknown:**
- When none of the above signals are clearly present

Output: `BUSINESS_TYPE: <type>` + confidence level + top 3 signals that determined it.

---

## PHASE 3 — ENDPOINT MAPPING

Scan all controllers/routes and build the endpoint registry:

```bash
# NestJS
grep -r "@Get\|@Post\|@Put\|@Patch\|@Delete" src/ --include="*.controller.ts" -l

# Express
grep -r "router\.\(get\|post\|put\|patch\|delete\)" src/ -l

# FastAPI / Django / Rails
grep -r "@app\.\|urlpatterns\|resources :" . -l
```

For each endpoint, infer:
- HTTP method + path
- Auth level (public / authenticated / admin)
- Input shape (from DTO or request body type)
- Response shape (from return type)
- Business purpose (from function name + body)

Build count: `N endpoints across M modules`

---

## PHASE 4 — DATA MODEL MAPPING

Scan schema/models to map all entities:

```bash
# Prisma
cat prisma/schema.prisma

# Django
find . -name "models.py" | xargs grep "class.*Model"

# TypeORM / Hibernate
find . -name "*.entity.ts" -o -name "*.entity.java"

# Rails
find . -path "*/db/schema.rb"
```

For each model:
- Name + table name
- Key fields (especially: id type, soft-delete, timestamps)
- Relations (hasMany, belongsTo, etc.)
- Business significance (what does this model represent?)

Build count: `N models, N enums`

---

## PHASE 5 — BUSINESS RULES INFERENCE

Read service files to infer business rules:

```bash
find src/ -name "*.service.ts" -o -name "services.py" | head -20
```

Look for:
- State machines (status transitions)
- Validation rules (DTO constraints + service checks)
- Financial calculations (tax, discount, fee)
- Access control (role checks beyond guards)
- External service calls (when + why)

Document each rule as: `RULE: [what] | WHERE: [file:line] | WHY: [inferred purpose]`

---

## PHASE 6 — GAP ANALYSIS

Compare what exists against what a typical project of this type needs:

### E-commerce gap checklist:
- [ ] Inventory management (stock tracking)
- [ ] Payment processing + webhooks
- [ ] Order lifecycle management
- [ ] Tax calculation
- [ ] Shipping integration
- [ ] Invoice generation
- [ ] Coupon/discount system
- [ ] Review/rating system
- [ ] Notification system
- [ ] Admin dashboard

### SaaS gap checklist:
- [ ] Subscription lifecycle
- [ ] Usage metering
- [ ] Plan enforcement (feature gates)
- [ ] Billing/invoicing
- [ ] Multi-tenancy isolation
- [ ] Onboarding flow
- [ ] Analytics/reporting
- [ ] Admin tooling

### Universal checklist (all project types):
- [ ] Authentication + authorization
- [ ] Input validation
- [ ] Error handling (mapped, not raw)
- [ ] Rate limiting
- [ ] Logging + observability
- [ ] Health endpoint
- [ ] Tests (unit + integration)
- [ ] API documentation

Output each gap as: `GAP-N: [what] | Severity: HIGH/MEDIUM/LOW | Effort: S/M/L`

---

## PHASE 7 — OUTPUT: PROJECT_INTELLIGENCE.md

Write `ai/PROJECT_INTELLIGENCE.md` with this structure:

```markdown
# PROJECT INTELLIGENCE
Generated: [ISO date] by /cortex-discover
Project: [name from package.json or directory name]

## Stack
[filled from Phase 1]

## Business Type
DETECTED: [type] (confidence: HIGH/MEDIUM/LOW)
Signals: [top 3 signals]
Domain skills to load: [ecom-* | saas-* | marketplace-* | etc.]

## Scale
Endpoints: N | Models: N | Test files: N | Est. lines of code: N

## Endpoint Registry
[table: method | path | auth | purpose]

## Data Model Map
[table: model | key fields | relations | purpose]

## Business Rules (inferred)
[list of RULE entries]

## Gaps Found
[list of GAP-N entries with severity]

## CORTEX Recommendations
1. Skills to load for this project type: [list]
2. Highest risk areas: [list]
3. Suggested first /cortex-analyse run: [focus areas]
4. PRD: run /cortex-prd to generate full product spec
```

---

## PHASE 8 — AUTO-CONFIGURE CORTEX

Based on detected business type, update `ai/core/MASTER.md`:

```
PROJECT_TYPE: <detected type>
DOMAIN_SKILLS: <relevant skill files to auto-load>
```

Update `ai/state/session-state.json`:
```json
"project_type": "<detected type>",
"domain_skills": ["ecom-payments", "ecom-orders", ...],
"discovery_run": "<ISO date>"
```

If CLAUDE.md does not exist: offer to generate it from PROJECT_INTELLIGENCE.md.
If app.prd.md does not exist: output "Run /cortex-prd to generate full PRD from this intelligence."

---

## STEP [LOG]

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="DISCOVERY_COMPLETE: type=[business_type] endpoints=[N] models=[N] gaps=[N]"
```

Append to `ai/lifecycle/LAYER_LOG.md`:
```
TYPE: ANALYSIS
PROJECT: [detected name]
ROLE: SENIOR_FULLSTACK
LAYER_ORIGIN: L4_SERVICE
LAYERS_TOUCHED: L1_CONTROLLER, L4_SERVICE, L5_PRISMA
LAYER_VIOLATED: NONE
FRONTEND_IMPACT: NONE
PA_REQUIRED: NO
MODULE: cortex
FILES: ai/PROJECT_INTELLIGENCE.md
DETAIL: /cortex-discover complete — [business_type], [N] endpoints, [N] models, [N] gaps
```

---

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-discover                COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File       ai/PROJECT_INTELLIGENCE.md written
Type       {business type detected}
Coverage   {n endpoints · n models · n modules}
Gaps       {n identified}
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       /cortex-extract → /cortex-prd → /cortex-spec
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## v7.1 Enhancement: Spec Extraction
After standard discovery: automatically run /cortex-extract.
cortex analyze now outputs both:
  PROJECT_INTELLIGENCE.md (intelligence layer — existing)
  ai/spec/ folder (source of truth layer — v7.1 new)
Show spec confidence report alongside intelligence report.

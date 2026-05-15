╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-estimate  |  v1.0  |  TIER: 1  |  BUDGET: MODERATE  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 (Intent) + L2 (Domain)                           ║
║ AUTHORITY     ║ ANALYST + ARCHITECT                                  ║
║ CAN           ║ - Detect app type from description                   ║
║               ║ - Map type → required modules automatically          ║
║               ║ - Score complexity per module (calibrated table)    ║
║               ║ - Calculate timeline with team-size scenarios        ║
║               ║ - Calculate cost range (INR + USD)                  ║
║               ║ - Output structured estimation report (PDF-ready)   ║
║               ║ - Flag known complexity traps for this app type     ║
║ CANNOT        ║ - Write code or design architecture                 ║
║               ║ - Guarantee accuracy beyond ±30%                   ║
║               ║   (estimation is inherently uncertain — be honest)  ║
║               ║ - Replace discovery calls or technical scoping      ║
║ WHEN TO RUN   ║ - When a founder describes an idea                  ║
║               ║ - Before starting any new project                   ║
║               ║ - When quoting a client (agency/freelancer use)     ║
║               ║ - When a founder wants to pitch to investors        ║
║ STACKS WITH   ║ cert-app-type · cert-blueprint · cert-precheck      ║
║ CALIBRATION   ║ adapters/estimation/module-complexity.md            ║
║               ║ Grounded in: Exena India (real project, 2026)       ║
║               ║   103 endpoints · 28 models · 19 modules · 6 months ║
║ OUTPUTS       ║ - App type + risk category                          ║
║               ║ - MVP module list (in vs out)                       ║
║               ║ - Timeline by team size                             ║
║               ║ - Cost range (INR + USD)                            ║
║               ║ - Top 3 complexity traps                            ║
║               ║ - Stack recommendation                              ║
║               ║ - 4 pre-build questions                             ║
╚═══════════════╩══════════════════════════════════════════════════════╝

**Cortex estimation engine. Grounded in real project data, not templates.**
The founder describes their idea in plain English.
Cortex maps it to known modules, applies real calibration data, and outputs
a structured report the founder can share with developers or investors.

Usage:
  /cert-estimate "describe the app in 1–3 sentences"
  /cert-estimate --modules "list the modules you know you need"
  /cert-estimate --type commerce "already know the type"

HONESTY RULE: Always show ranges. Never show a single number.
              Always name the calibration source. Never invent data.
              Always flag the ±30% uncertainty band.

---

## STEP 1 — Understand what's being built

Read the description from $ARGUMENTS.

If description is too vague (e.g., "a mobile app" / "an e-commerce site"):
```
⚠️ /cert-estimate — need more context
  What problem does it solve, and for whom?

  Try:
    /cert-estimate "food ordering platform where restaurants list menus,
     customers order, and kitchen gets a token — like Zomato for small QSRs"

    /cert-estimate "B2B SaaS where teams track client projects, assign tasks,
     and bill hours — subscription model, ₹999/month per workspace"
```

---

## STEP 2 — Detect app type (two-pass)

**Pass 1 — Risk category:**
Match description to primary architectural risk:
```
Signals for RISK A (Transaction Integrity):
  → money changes hands · orders · payments · checkout · cart · inventory
  → escrow · commissions · wallets · transfers · ledger

Signals for RISK B (Data Isolation):
  → multiple companies/teams use it · subscriptions · tenants · workspaces
  → internal tool · admin panel · role-based access · dashboard

Signals for RISK C (Scale & Content):
  → user posts · followers · feed · comments · UGC · moderation
  → real-time · notifications · viral content

Signals for RISK D (API Contract Stability):
  → developer-facing · public API · webhooks · SDK · API keys · headless

Cross-cutting mobile signals:
  → mobile app · iOS · Android · offline · QR scan · push notifications
```

**Pass 2 — Subtype:**
Within the detected risk category, identify: commerce / marketplace / fintech / saas / internal / social / api-first

Output:
```
TYPE DETECTED
─────────────────────────────────────────────────────
Primary risk:  [A / B / C / D] — [risk name]
App type:      [subtype]
Mobile layer:  [YES — add mobile cross-cutting risks | NO]
Multi-type:    [YES — [type1] + [type2] | NO]
Confidence:    HIGH / MEDIUM / LOW

Signals found:
  [matched keywords from description]
─────────────────────────────────────────────────────
```

---

## STEP 3 — Map to required modules

Read `C:\luv\Cortex\adapters\estimation\module-complexity.md`.

Based on detected type, map to the MVP-minimum module set:

```
commerce MVP minimum:
  Foundation · Auth (OTP + RBAC) · Products + Variants · Cart · Orders (complex)
  Payments (COD + online) · Invoices (basic/GST if India) · Admin (CRUD + tables)

marketplace MVP minimum:
  All commerce + Seller onboarding · Listings · Commission · Escrow · Disputes

fintech MVP minimum:
  Foundation · Auth (KYC-ready RBAC) · Wallet · Transactions · Ledger (double-entry)
  Payouts · Audit log · Admin dashboard

saas MVP minimum:
  Foundation · Auth (JWT + refresh) · Organizations · Plans · Billing (Stripe/Razorpay)
  Feature flags · Self-serve onboarding · Admin

internal MVP minimum:
  Foundation · Auth (RBAC 2–4 roles) · Core domain tables · Admin tables
  Audit log · Data export

social MVP minimum:
  Foundation · Auth · User profile · Feed (chronological) · Follow
  Notifications (async) · Content moderation queue

api-first MVP minimum:
  Foundation · Auth (API key) · Rate limiting · Core API endpoints
  Webhook delivery + retry · API versioning · Developer docs (basic)
```

**Non-MVP modules** (present in later phases):
Flag which modules the founder mentioned that are NOT in MVP:
```
OUT OF MVP (Phase 2+):
  → [module] — reason: [nice-to-have / post-launch / depends on traction]
```

---

## STEP 4 — Score complexity

For each IN-MVP module, look up its entry in the calibration table.
Record: backend days (min–max) + frontend days (min–max) + complexity tier.

Present as a module breakdown table:
```
MODULE BREAKDOWN
─────────────────────────────────────────────────────────────────
Module                    Backend      Frontend     Complexity
─────────────────────────────────────────────────────────────────
Project scaffold          2–3 days     —            LOW
Auth (OTP + RBAC ×4)      4–6 days     3–4 days     MEDIUM
Products + variants       4–6 days     5–7 days     MEDIUM
Cart                      3–4 days     3–5 days     MEDIUM
Orders (complex)          6–9 days     5–7 days     HIGH
Payments (COD + online)   7–10 days    4–6 days     HIGH
Invoices (GST)            4–6 days     2–3 days     MEDIUM
Admin (CRUD + tables)     3–5 days     6–9 days     MEDIUM
─────────────────────────────────────────────────────────────────
RAW SUBTOTAL              33–49 days   28–41 days
COMBINED RAW              61–90 days
─────────────────────────────────────────────────────────────────
```

---

## STEP 5 — Build timeline

**Apply overhead (from calibration table):**
```
Overhead multiplier: +50% of raw combined (midpoint of 40–60% range)
Adjusted total:      [raw combined] × 1.5 = [adjusted days]
```

**Apply team-size multipliers:**
```
Solo (1 dev):           [adjusted days] × 1.0 = [days] ÷ 5 = [weeks]
2-person team:          [adjusted days] × 0.55 = [days] ÷ 5 = [weeks]
Small agency (3–4):     [adjusted days] × 0.40 = [days] ÷ 5 = [weeks]
```

**Map to Phase 0→6 (dev-blueprint sequence):**
```
TIMELINE — Phase breakdown
─────────────────────────────────────────────────────
Phase 0 — Orient + decide        1 week
Phase 1–2 — Schema + API design  1–2 weeks
Phase 3 — Backend build          [N] weeks
Phase 4 — Frontend build         [N] weeks
Phase 5 — Integration + test     2 weeks
Phase 6 — Deploy + launch prep   1 week
─────────────────────────────────
MVP TOTAL (solo):        [N]–[N] weeks
MVP TOTAL (2-person):    [N]–[N] weeks
MVP TOTAL (agency):      [N]–[N] weeks
─────────────────────────────────────────────────────
```

---

## STEP 6 — Calculate cost

**Total hours = adjusted total days × 8 hrs/day (solo) or team-adjusted**

For each team size scenario, calculate range:
```
COST RANGE (INR)
─────────────────────────────────────────────────────
                          Min              Max
Solo freelancer          ₹[X]L           ₹[X]L
  (₹800–1,500/hr × [N] hrs)

Senior freelancer        ₹[X]L           ₹[X]L
  (₹1,500–3,000/hr × [N] hrs)

Small agency             ₹[X]L           ₹[X]L
  (₹2,500–5,000/hr × [N] hrs)

Mid-size agency          ₹[X]L           ₹[X]L
  (₹5,000–10,000/hr × [N] hrs)
─────────────────────────────────────────────────────

COST RANGE (USD — global rates)
  Freelancer:   $[X]K – $[X]K
  Agency:       $[X]K – $[X]K
─────────────────────────────────────────────────────
⚠️ Uncertainty band: ±30% on all numbers above.
   Calibration source: Exena India (1 real project, 2026)
   Confidence grows as more Cortex-governed projects complete.
─────────────────────────────────────────────────────
```

---

## STEP 7 — Flag complexity traps

From the calibration table's "Known Complexity Traps" section, identify which traps apply to this specific app:

```
⚠️ COMPLEXITY TRAPS — these will cost more than the estimate suggests
─────────────────────────────────────────────────────────────────────
1. [trap name]
   Why for your app: [specific reason based on the detected modules]
   Typical overrun:  +[N]–[N] days

2. [trap name]
   [...]

3. [trap name]
   [...]
─────────────────────────────────────────────────────────────────────
Plan for these BEFORE signing a contract or setting expectations.
```

---

## STEP 8 — Stack recommendation

Based on detected type + complexity profile:
```
STACK RECOMMENDATION
─────────────────────────────────────────────────────
Backend:   NestJS + Prisma + PostgreSQL + Redis
           [reason for this type — e.g., "financial ops need $transaction"]

Frontend:  Next.js 15 (App Router) + Tailwind
           [reason — e.g., "admin-heavy = table components, Next.js ecosystem"]

Queue:     BullMQ (if async jobs required — payments, notifications, delivery)
Storage:   Cloudinary (image-heavy) / S3 (document storage)
Payments:  [Razorpay for India / Stripe for global]
Deploy:    Docker + Coolify/Railway for MVP · AWS/GCP for scale

Why Cortex recommends this:
  Full governance adapter coverage (nestjs-patterns + nextjs-patterns)
  Calibration data exists (Exena India built on this exact stack)
  No unknown territory — every module has a Cortex blueprint.
─────────────────────────────────────────────────────
Alternative (simpler for early validation):
  Next.js only (App Router + Server Actions) + Supabase
  → Good if: minimal backend logic, 1-person team, validation phase
  → Not suitable if: complex order lifecycle, payment gateway, queue requirements
─────────────────────────────────────────────────────
```

---

## STEP 9 — Pre-build questions

Output the 4 most critical unanswered questions for this app type
(pulled from cert-app-type's pre-build question set + detected type).

```
❓ ANSWER THESE BEFORE STARTING BUILD
─────────────────────────────────────────────────────────────────────
These 4 questions change the architecture. Wrong answers = rebuild.

Q1: [most impactful decision for this type]
    → Impacts: [which modules + how]

Q2: [second most impactful]
    → Impacts: [which modules + how]

Q3: [third]
    → Impacts: [...]

Q4: [fourth]
    → Impacts: [...]
─────────────────────────────────────────────────────────────────────
```

---

## FULL REPORT OUTPUT

Combine all steps into the founder-readable report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUNDER ESTIMATOR — [App Name / Description]
Generated by CORTEX · [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APP TYPE:    [type] · Risk Category [A/B/C/D]
COMPARABLE:  [real app this resembles] — [what it shares]
REFERENCE:   Exena India (real Cortex-built project · 2026)

─────────────────────────────────
SECTION 1 — WHAT YOU'RE BUILDING
[2 sentences plain-English description of detected scope]

─────────────────────────────────
SECTION 2 — MVP SCOPE

IN MVP:
  [module list with one-line reason each]

OUT OF MVP (Phase 2+):
  [module list with one-line reason each]

─────────────────────────────────
SECTION 3 — MODULE COMPLEXITY

[Full module breakdown table from Step 4]

─────────────────────────────────
SECTION 4 — TIMELINE

[Phase breakdown from Step 5]

─────────────────────────────────
SECTION 5 — COST RANGE

[Cost table from Step 6]

─────────────────────────────────
SECTION 6 — COMPLEXITY TRAPS ⚠️

[Top 3 traps from Step 7]

─────────────────────────────────
SECTION 7 — STACK RECOMMENDATION

[Stack output from Step 8]

─────────────────────────────────
SECTION 8 — BEFORE YOU BUILD

[4 pre-build questions from Step 9]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by CORTEX v11.3 · Calibrated against Exena India (2026)
Uncertainty band: ±30% · For discovery only — not a binding quote
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cert-estimate v1.0
STATUS:     COMPLETE
TYPE:       [detected type]
MODULES:    [N in MVP] · [N deferred]
TIMELINE:   [N]–[N] weeks (solo) · [N]–[N] weeks (2-person)
COST:       ₹[X]L – ₹[X]L (INR) · $[X]K – $[X]K (USD)
TRAPS:      [N] flagged
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT: /cert-app-type  → full pre-build constraint package
      /cert-blueprint → load relevant blueprints for this type
      /cert-precheck  → pre-work gate before first line of code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## INSTALL

```bash
# Tier 1 — install to all Cortex projects
cp C:\luv\Cortex\skills\cert-estimate.md [project]\.claude\commands\cert-estimate.md
```

╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-app-type  |  v2.0  |  TIER: 1  |  BUDGET: LEAN      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Pre-build gate) + L1 (Intent)                   ║
║ AUTHORITY     ║ ANALYST + ARCHITECT                                  ║
║ CAN           ║ - Detect app type from description or codebase       ║
║               ║ - Load matching blueprint stack + domain adapters    ║
║               ║ - Surface highest-risk decisions for this type       ║
║               ║ - Generate tailored constraint package               ║
║               ║ - Ask critical pre-build questions                   ║
║ CANNOT        ║ - Write code or modify source files                  ║
║               ║ - Generate full architecture (use cert-blueprint)    ║
║ WHEN TO RUN   ║ - Starting ANY new project (before Phase 0)          ║
║               ║ - When project scope shifts (adding marketplace      ║
║               ║   features to an existing ecom, for example)         ║
║               ║ - When you're unsure which blueprints apply          ║
║ STACKS WITH   ║ cert-blueprint → cert-enforce → dev-blueprint        ║
║ OUTPUTS       ║ - Detected app type + confidence                     ║
║               ║ - Blueprint stack for this type                      ║
║               ║ - Top 5 highest-risk decisions                       ║
║               ║ - Critical pre-build questions (unanswered = BLOCK)  ║
║               ║ - Ready-to-run cert-blueprint invocation             ║
╚═══════════════╩══════════════════════════════════════════════════════╝

**App type detector + blueprint generator.**
Describe what you're building. Get back exactly which blueprints + adapters apply,
the top risks for your app type, and the questions you must answer before writing a line.

Input: `cert-app-type "describe the app in 1–3 sentences"`
       `cert-app-type --scan` (detect from existing codebase)
       `cert-app-type --list` (show all 8 app types)

---

## APP TYPE TAXONOMY — 4 RISK CATEGORIES

8 types organized by primary architectural risk. Types in the same risk category
share the same class of failure. A real app can span multiple categories.

```
RISK A — TRANSACTION INTEGRITY (money moves, must be atomic + idempotent)
  commerce     → products · cart · orders · checkout · payments · inventory
  marketplace  → sellers · buyers · listings · escrow · commissions · disputes
  fintech      → ledger · transactions · wallets · transfers · KYC · audit

RISK B — DATA ISOLATION (tenants or roles must never see each other's data)
  saas         → subscriptions · tenants · billing · plans · feature flags · trial
  internal     → dashboard · bulk ops · reports · audit logs · RBAC · data export

RISK C — SCALE & CONTENT INTEGRITY (fan-out, moderation, real-time)
  social       → feed · follows · posts · real-time · notifications · moderation

RISK D — API CONTRACT STABILITY (clients you don't control depend on your API)
  api-first    → public API · webhooks · SDKs · versioning · rate limits · API keys

CROSS-CUTTING (adds specific risks to any primary type above)
  mobile       → iOS/Android · push notifications · offline · long-lived sessions
```

Why this structure: identifying the risk category tells you immediately which blueprints
are critical and which questions to answer first — before looking at any specific type.

---

## STEP 1 — Detect Risk Category + Type

Detection runs in two passes: risk category first, then subtype.
This avoids false positives (a saas with payments is Risk B primary, not Risk A).

**If `--list`:** output the taxonomy table above and stop.

**If `--scan`:** Read these files to infer type:
```
CLAUDE.md            → §1 TOPOLOGY: module list, tech stack, domain
ai/STATUS.md         → What Is Complete section
prisma/schema.prisma → schema models reveal domain:
                       Order/Product/Cart          → Risk A (commerce)
                       Ledger/Transaction/Wallet   → Risk A (fintech)
                       Listing/Seller/Commission   → Risk A (marketplace)
                       Tenant/Subscription/Plan    → Risk B (saas)
                       AuditLog/BulkOperation      → Risk B (internal)
                       Feed/Post/Follow            → Risk C (social)
                       ApiKey/Webhook/RateLimit     → Risk D (api-first)
src/modules/         → module names confirm domain
```

**If description provided:** match description keywords against the risk category signals
in `C:\luv\Cortex\adapters\blueprints\blueprint-app-type.md`.

**Two-pass output:**
```
PASS 1 — Risk Category
  PRIMARY RISK: [A / B / C / D]  (what will most likely destroy this app)
  REASON: [one line — the architectural concern that governs everything else]
  CROSS-CUTTING: mobile? [YES / NO]  api-first layer on top of another type? [YES / NO]

PASS 2 — Subtype
  TYPE: [commerce | marketplace | fintech | saas | internal | social | api-first]
  CONFIDENCE: HIGH / MEDIUM / LOW

  Signals found:
    [matched keywords / modules / schema models]

  If MULTI-TYPE detected (e.g., saas-commerce):
    PRIMARY: [type]  SECONDARY: [type]
    → Loading risk set for BOTH. See COMBINATION PATTERNS in blueprint-app-type.md.

  If LOW confidence:
    This matches [type-A] AND [type-B]. Which is primary?
    → Respond with the primary type to continue.
```

---

## STEP 2 — Load Blueprint Stack

Read `C:\luv\Cortex\adapters\blueprints\blueprint-app-type.md`.

Find the section for the detected type. Extract:
- REQUIRED blueprints
- DOMAIN adapters
- CRITICAL blueprint sections

Load each REQUIRED blueprint from `C:\luv\Cortex\adapters\blueprints\`.
Load each DOMAIN adapter from `C:\luv\Cortex\adapters\domains\`.

---

## STEP 3 — Surface Highest-Risk Decisions

From the detected type's section in `blueprint-app-type.md`, extract the `Highest-risk decisions` block.

Output:
```
⚡ TOP RISKS — [detected type] — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the decisions that most commonly destroy [type] apps.
They must be resolved BEFORE the first line of code is written.

  ✖ [risk 1] — [why it destroys the app]
  ✖ [risk 2]
  ✖ [risk 3]
  ✖ [risk 4]
  ✖ [risk 5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 4 — Ask Critical Pre-Build Questions

From the detected type's `Critical pre-build questions` in `blueprint-app-type.md`, ask each one.

**HARD RULE:** If any critical question is unanswered, output BLOCKED and explain why.

```
🔴 BLOCKED — [N] critical questions unanswered

  These questions determine which blueprint decisions apply.
  Building without answers means building the wrong thing.

  Q1: [question]
  Q2: [question]
  ...

  Answer these before proceeding. Run /cert-app-type again with answers.
```

If all answered (or user provides answers inline), continue to Step 5.

---

## STEP 5 — Generate Constraint Package

Output the full tailored constraint package for this session:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP TYPE:     [type]
DETECTED:     [HIGH/MEDIUM confidence]
DATE:         [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BLUEPRINT STACK ACTIVE:
  ✅ blueprint-api-design    → [specific decisions active for this type]
  ✅ blueprint-database      → [specific decisions active for this type]
  ✅ blueprint-auth          → [specific decisions active for this type]
  ✅ blueprint-security      → [specific decisions active for this type]
  ✅ blueprint-architecture  → [specific decisions active for this type]
  [+ any type-specific blueprints]

DOMAIN ADAPTERS ACTIVE:
  ✅ [domain adapter name]   → [what it covers]
  [or: none found for this type — using blueprint stack only]

TYPE-SPECIFIC HARD RULES:
  ✖ NEVER [risk 1 from this type]
  ✖ NEVER [risk 2 from this type]
  ✖ NEVER [risk 3 from this type]
  ✔ ALWAYS [type-specific must-do]
  ✔ ALWAYS [type-specific must-do]

PRE-BUILD ANSWERS ON RECORD:
  [Q1]: [answer]
  [Q2]: [answer]
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT:  /cert-blueprint [task] → load full blueprint set
       /cert-enforce [module] → load module-level guardrails
       /dev-blueprint         → start Phase 0 with this context loaded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 6 — Save Answers to Project Config (if PROJECT_CONFIG exists)

If `ai/config/PROJECT_CONFIG.md` exists in the current project:
Append the pre-build answers under a `## APP TYPE DECISIONS` section.
These answers are durable — they should not need to be re-answered each session.

If `PROJECT_CONFIG.md` doesn't exist: note it and suggest creating one.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cert-app-type v2.0
STATUS:     COMPLETE
TYPE:       [detected type]
BLUEPRINTS: [N] loaded
RISKS:      [N] surfaced
BLOCKED:    [N unanswered questions | NONE]
NEXT:       cert-blueprint → cert-enforce → dev-blueprint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## INSTALL

```bash
# Tier 1 — install to all Cortex projects
cp C:\luv\Cortex\skills\cert-app-type.md [project]\.claude\commands\cert-app-type.md
```

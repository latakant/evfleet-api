╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-blueprint  |  v2.2  |  TIER: 1  |  BUDGET: LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L0 (Pre-work Gate)                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Load relevant SDLC blueprints for current task     ║
║               ║ - Load design aesthetic DNA                          ║
║               ║ - Load development session sequence (Phase 0→6)     ║
║               ║ - Flag if work sequence is out of order              ║
║               ║ - Scan for blueprint violations in staged code       ║
║               ║ - Run Decision Gate from ai/BLUEPRINT.md (--gate)   ║
║               ║ - Check project blueprint vs template (--check)     ║
║               ║ - Show upgrade diff for stale blueprint (--upgrade) ║
║ CANNOT        ║ - Write code or modify source files                  ║
║               ║ - Replace cert-enforce (they stack, not swap)        ║
║ WHEN TO RUN   ║ - Start of any feature, fix, or design session       ║
║               ║ - Before any refactoring work                        ║
║               ║ - Before any new schema, API, or auth design         ║
║ STACKS WITH   ║ cert-enforce (module constraints) + cert-blueprint   ║
║ OUTPUTS       ║ - Active blueprint decisions for this session        ║
║               ║ - Phase sequence reminder                            ║
║               ║ - Violations if --scan provided                      ║
╚═══════════════╩══════════════════════════════════════════════════════╝

**The full SDLC intelligence gate.**
163 decisions across 11 blueprints. Loads what's relevant for your task.
Stack adapters tell you HOW. Blueprints tell you WHAT and WHY — before you start.
v2.2 adds: Project Blueprint Decision Gate — the first gate before any technical blueprint loads.

---

## MODES

| Invocation | What it does |
|-----------|-------------|
| `/cert-blueprint` (default) | Step 0 project gate + load SDLC blueprints for current task |
| `/cert-blueprint --gate "description"` | Run only the Decision Gate from ai/BLUEPRINT.md |
| `/cert-blueprint --check` | Compare project blueprint cortex_version vs current Cortex version |
| `/cert-blueprint --upgrade` | Show which new template sections the project blueprint is missing |

---

## STEP 0 — CORTEX RUNTIME GUARD

Run: `node scripts/runtime-guard.js cert-blueprint`
- Exit 0 → proceed to STEP 1
- Exit 1 → WARN (PHASE_MISMATCH). Ask: "Phase mismatch detected. Continue? (YES to proceed)"
  - YES → run: `node scripts/runtime-guard.js cert-blueprint --confirmed` → STEP 1
  - Anything else → STOP
- Exit 2 → HALT — do not proceed

---

## STEP 1 — Project Blueprint Gate (NEW in v2.2)

**Runs before any technical blueprint loads.** If `ai/BLUEPRINT.md` does not exist, skip to Step 1.

```bash
cat ai/BLUEPRINT.md 2>/dev/null | head -5
```

If found:

### 0a — Staleness check

Read `ai/BLUEPRINT.md` Section 6 (Blueprint Health):
- `cortex_version` < current Cortex version → warn: "Blueprint stale — run `/cert-blueprint --check`"
- `last_evaluated` > 30 days ago → warn: "Blueprint not reviewed in 30+ days"
- `gate_overrides` > 3 → warn: "High override count — revisit Phase Map"

### 0b — Decision Gate (run for any proposed improvement)

Read Section 4 (Decision Gate) from `ai/BLUEPRINT.md`. Run all 4 questions:

```
Q1 — Phase alignment: Is this in current phase scope?
Q2 — Principle check: Does it violate any project Principle (P1–PN)?
Q3 — Goal alignment: Does it serve Phase [current] primary goal?
Q4 — Proportionality: Is effort within Phase [current] effort cap?
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT BLUEPRINT GATE — [proposed change]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q1 Phase:        [PASS | DEFER Phase N+1]
Q2 Principles:   [PASS | REJECT P[N]: reason]
Q3 Goal:         [PASS | DEFER]
Q4 Effort cap:   [PASS (Xh of Yh cap) | DEFER]
─────────────────────────────────────────────
VERDICT:         [ACCEPT | DEFER Phase N | REJECT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If DEFER or REJECT: **stop here**. Do not load technical blueprints. Log in `ai/state/open-issues.json`.
If ACCEPT: continue to Step 1 (SDLC blueprints).

### 0c — --check mode

Compare `cortex_version` in `ai/BLUEPRINT.md` Section 6 against current Cortex version.
Read `adapters/blueprints/blueprint-project.md` → extract `template_version`.
Read `ai/BLUEPRINT.md` → extract `template_version`.

If project template_version < template file template_version:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT BLUEPRINT — STALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project blueprint version:  [X.Y]
Template version:           [A.B]
Gap:                        [list section names added in newer template]
Action:                     run `/cert-blueprint --upgrade` to add missing sections
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If up to date:
```
PROJECT BLUEPRINT — UP TO DATE (template v[X.Y] · cortex [version])
```

### 0d — --upgrade mode

Read the template (`adapters/blueprints/blueprint-project.md`) and the project blueprint (`ai/BLUEPRINT.md`).
Identify sections in the template that are missing from the project blueprint.

For each missing section:
```
NEW SECTION: [section name]
─────────────────────────────
[section content from template, with FILL IN markers]
─────────────────────────────
Add this to ai/BLUEPRINT.md Section [N]. Fill in [FILL IN] fields.
```

The project's EXISTING decisions are NEVER modified. Only additive.
After showing the diff: "Add these sections to ai/BLUEPRINT.md, fill in the [FILL IN] fields, then update Section 7 (Evolution History)."

---

## BLUEPRINT MAP

```
Task involves...              → Load blueprint
─────────────────────────────────────────────────
API endpoint design           → blueprint-api-design.md
Schema / Prisma model         → blueprint-database.md
Authentication / tokens / OTP → blueprint-auth.md
Any user input / webhooks     → blueprint-security.md
New module / service design   → blueprint-architecture.md
Docker / deploy / env config  → blueprint-deployment.md
Slow endpoint / optimization  → blueprint-performance.md
Bug investigation             → blueprint-debugging.md
Restructuring existing code   → blueprint-refactoring.md
Writing / reviewing tests     → blueprint-testing.md
Starting a new project        → blueprint-app-type.md + /cert-app-type
UI / visual work              → design-aesthetic.md
Full feature (design → ship)  → dev-blueprint.md (Phase 0→6)
```

All blueprints: `C:\luv\Cortex\adapters\blueprints\`
Design + dev workflow: `C:\luv\Cortex\adapters\design\`

---

## STEP 2 — Identify relevant blueprints

Read the task description. Match to the blueprint map above. Load all that apply.

Common combinations:
```
New endpoint:      api-design + security + (auth if protected)
New Prisma model:  database + architecture
Full feature:      dev-blueprint + api-design + database + security
Bug fix:           debugging
Refactor:          refactoring
UI component:      design-aesthetic + dev-blueprint (Phase 5)
Deploy:            deployment
```

---

## STEP 3 — Output active constraints

For each loaded blueprint, surface the CRITICAL decisions only:

```
⚡ BLUEPRINT LOAD — [task description] — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[BLUEPRINT: api-design]  ← if loaded
  ✖ NEVER concatenate user input into SQL
  ✖ NEVER return 200 for errors — status codes are the contract
  ✖ NEVER omit pagination meta from list responses
  ✔ ALWAYS validate at boundary with whitelist approach
  ✔ ALWAYS include idempotency key for payment/order creation

[BLUEPRINT: database]  ← if loaded
  ✖ NEVER use Float for money — Decimal(10,2)
  ✖ NEVER hard delete business entities — use isActive soft delete
  ✖ NEVER auto-increment integer PKs — CUID or UUID
  ✔ ALWAYS use $transaction for 2+ table writes
  ✔ ALWAYS index foreign key columns

[BLUEPRINT: auth]  ← if loaded
  ✖ NEVER access token TTL > 15 minutes
  ✖ NEVER put PII in JWT payload
  ✖ NEVER compare payload.exp to Date.now() directly (units differ)
  ✔ ALWAYS guard order: JwtAuthGuard → RolesGuard
  ✔ ALWAYS clear both localStorage AND cookie on logout

[BLUEPRINT: security]  ← if loaded
  ✖ NEVER secrets in code or committed files
  ✖ NEVER use dangerouslySetInnerHTML with unsanitized content
  ✖ NEVER mass-assign request body to DB update
  ✔ ALWAYS verify webhook HMAC signatures
  ✔ ALWAYS validate required env vars at startup

[BLUEPRINT: architecture]  ← if loaded
  ✖ NEVER Prisma calls in controllers
  ✖ NEVER inline await for email/SMS/push — queue it
  ✖ NEVER cross-module DB queries — call the service
  ✔ ALWAYS side effects to queues
  ✔ ALWAYS shared logic in SharedModule

[BLUEPRINT: deployment]  ← if loaded
  ✖ NEVER start app without env validation
  ✖ NEVER run containers as root
  ✖ NEVER skip CI gate under time pressure
  ✔ ALWAYS multi-stage Dockerfile
  ✔ ALWAYS run migrations before app start

[BLUEPRINT: performance]  ← if loaded
  ✖ NEVER optimize without a measured baseline
  ✖ NEVER unbounded findMany() — always paginate
  ✖ NEVER N+1 queries — use include
  ✔ ALWAYS fix N+1 before adding cache
  ✔ ALWAYS measure P95, not average

[BLUEPRINT: debugging]  ← if loaded
  ✖ NEVER change code before reproducing the bug
  ✖ NEVER read only the first line of a stack trace
  ✔ ALWAYS check recent changes first
  ✔ ALWAYS isolate at the boundary with direct API test

[BLUEPRINT: refactoring]  ← if loaded
  ✖ NEVER refactor and add feature in same commit
  ✖ NEVER touch code you don't understand
  ✖ NEVER change external contracts without migration plan
  ✔ ALWAYS pass tests before AND after

[BLUEPRINT: testing]  ← if writing/reviewing tests
  ✖ NEVER mock the DB in integration tests
  ✖ NEVER assert only success:true on list endpoints — check data.length > 0
  ✖ NEVER read array length from page 1 to verify state change — use meta.total
  ✖ NEVER hardcode tokens in test scripts — they expire
  ✔ ALWAYS use dedicated test user, not shared demo/seed user
  ✔ ALWAYS tag or clean up test-created entities

[BLUEPRINT: app-type]  ← if starting a new project
  → Run /cert-app-type first — detect type, load matching blueprint stack
  → 8 app types: ecom · saas · fintech · marketplace · social · internal · api-first · mobile
  → Each type has known failure class + required blueprint stack + critical pre-build questions

[DESIGN AESTHETIC]  ← if UI work
  ✖ NO dark background as default · NO gradient text · NO pill buttons
  ✖ NO glassmorphism · NO mixed icon sets · NO arbitrary spacing
  ✔ Light background · one accent color · 8pt grid · 3 component states

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENFORCING: [N] blueprint decisions active this session
NEXT: cert-enforce <module> → build per blueprint sequence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 4 — Session phase (if full feature work)

If the task is a full feature (not just a bug fix or refactor), output current phase:

```
🗺  DEV BLUEPRINT — Phase sequence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 0 — Orient:      Who · What · Done defined?
Phase 1 — Constraints: cert-enforce loaded?
Phase 2 — Schema:      DB model verified before service?
Phase 3 — Build:       Bottom-up? (schema→service→controller→frontend)
Phase 4 — Validate:    Manual API test + failure path?
Phase 5 — UI:          Aesthetic loaded, tokens verified?
Phase 6 — Ship:        cert-verify run, metrics synced?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 5 — Scan (if --scan flag)

Grep recently modified files for blueprint violations:

| Violation | Pattern to find |
|-----------|----------------|
| Float money | `Float\|float\|number.*price\|number.*amount` in schema files |
| Integer PK | `autoincrement\(\)` in schema files |
| Inline side effect | `await.*[Mm]ail\|await.*[Ss]ms\|await.*[Nn]otif` in service methods |
| Secrets in code | `['"][A-Za-z0-9]{20,}['"]` near `secret\|key\|password\|token` |
| No pagination | `findMany\(\)` without `take:` in list endpoint |
| Mass assignment | `{ \.\.\.req\.body\|\.\.\.dto\b }` in prisma update call |
| Unsanitized HTML | `dangerouslySetInnerHTML` in TSX files |
| Wrong guard order | `RolesGuard.*JwtAuthGuard` in same decorator |

Output violations per blueprint-debugging.md format.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:       cert-blueprint v2.0
STATUS:      COMPLETE
BLUEPRINTS:  [N loaded] of 9 available
DECISIONS:   [N active] constraints for this session
VIOLATIONS:  [N found | NONE]
NEXT:        cert-enforce <module> → build per blueprint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## INSTALL

```bash
# Tier 1 — install to all Cortex projects
cp C:\luv\Cortex\skills\cert-blueprint.md [project]\.claude\commands\cert-blueprint.md
```

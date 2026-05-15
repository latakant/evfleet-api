```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-certify  |  v11.2  |  TIER: 6  |  BUDGET: MODERATE   ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L5 · L9                                             ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read all skill files (skills/ + adapters/)        ║
║               ║ - Write skill files (cert block only — append top)  ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (CERTIFY)         ║
║ CANNOT        ║ - Modify skill logic or step content                ║
║               ║ - Modify src/ files                                 ║
║               ║ - Push to remote                                     ║
║ REQUIRES      ║ - MASTER.md loaded (cert block spec)          ║
║ ESCALATES     ║ - Skill with no OUTPUTS field → flag for PA review  ║
║ OUTPUTS       ║ - CERTIFICATION REPORT                              ║
║               ║ - Missing cert blocks added to skill files          ║
║               ║ - Completion block: COMPLETE or PARTIAL             ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Audit all skills for valid v8 certification blocks. Add missing blocks. Flag malformed authority declarations.

$ARGUMENTS

Parse: `scope` (optional) — `audit` (report only) | `fix` (add missing blocks) | blank = fix

---

## WHAT IS A VALID CERT BLOCK?

Per MASTER.md, every skill MUST begin with:

```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /skill-name  |  v11.2  |  TIER: N  |  BUDGET: LEAN/MOD/ARCH  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ [L1 through L10 — which layers this skill touches]  ║
║ AUTHORITY     ║ [OBSERVER|ANALYST|EXECUTOR|BUILDER|GOVERNOR|ORCH]   ║
║ CAN           ║ - [explicit file paths or operations]               ║
║ CANNOT        ║ - [hard limits]                                     ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║ ESCALATES     ║ - [condition] → [HARD HALT | PA Phase N]           ║
║ OUTPUTS       ║ - [deliverables]                                    ║
║               ║ - Completion block (COMPLETE|PARTIAL|FAILED|HALT)  ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

**Required fields:** CERT header · LAYER SCOPE · AUTHORITY · CAN · CANNOT · REQUIRES · ESCALATES · OUTPUTS

**Authority levels (from least to most power):**
```
OBSERVER   — Read only, no writes
ANALYST    — Read + write logs/state files only
EXECUTOR   — Read + write src/ files (bounded scope)
BUILDER    — Read + write src/ + schema + tests
GOVERNOR   — All EXECUTOR + can approve overrides
ORCH       — Spawns sub-agents, coordinates across domains
```

**Budget levels:**
```
LEAN    — Token-minimal. No deep reads. < 5 files.
MODERATE — Read target module + context. 5-15 files.
ARCH    — Full codebase read authorized. PA-level.
```

---

## STEP 1 — SCAN ALL SKILLS

```bash
ls C:\luv\Cortex\skills\*.md | wc -l
ls C:\luv\Cortex\adapters\**\*.md | wc -l
```

For each skill file, check line 1:
- Does it start with ` ╔══` (cert block)? → **CERTIFIED**
- Does it start with anything else? → **UNCERTIFIED**

Build the audit table:
```
SKILL CERTIFICATION AUDIT
─────────────────────────────────────────────────────────────
[skill-name]            v11.2 ✅ CERTIFIED    AUTHORITY: [level]
[skill-name]            pre-v11.2 ❌ UNCERTIFIED  → needs cert block
─────────────────────────────────────────────────────────────
Certified:   [N]
Uncertified: [N]
```

---

## STEP 2 — VALIDATE EXISTING CERT BLOCKS

For skills that DO have a cert block, validate each field:

| Field | Valid? | If invalid |
|-------|--------|-----------|
| TIER | 1–14 | Flag — must match MASTER tier assignment |
| AUTHORITY | One of 6 valid levels | Flag for PA review |
| LAYER SCOPE | L1–L10 subset | Flag if empty |
| CAN | ≥ 1 bullet | Flag — empty CAN = undefined permission |
| CANNOT | ≥ 1 bullet | Flag — must have explicit limits |
| OUTPUTS | includes "Completion block" | Flag — completion is mandatory |

---

## STEP 3 — ADD MISSING CERT BLOCKS (if scope = `fix`)

For each UNCERTIFIED skill, generate the correct cert block based on:
1. The skill name → maps to TIER via MASTER.md skill quick-reference
2. The skill content → infer AUTHORITY from what operations it performs
3. The skill's existing steps → infer LAYER SCOPE, CAN, CANNOT, ESCALATES, OUTPUTS

**Authority inference rules:**
- Skill only reads files → ANALYST
- Skill writes src/ files → EXECUTOR (minimum)
- Skill runs tests, migrations → BUILDER
- Skill manages approvals, overrides → GOVERNOR
- Skill spawns sub-agents → ORCH

**Template for adding cert block to a skill:**

Prepend to the file:
```markdown
[cert block here]

[existing skill content — unchanged]
```

The cert block MUST NOT modify any existing content below it.

---

## STEP 4 — TIER ASSIGNMENT VERIFICATION

Cross-check every skill's declared TIER against the official assignment in MASTER.md:

```
Tier 1  — Session: cortex-session, cortex-status, cortex-init, cortex-help, cortex-roles
Tier 2  — Daily: cortex-bug, cortex-fix, cortex-feature, cortex-modify, cortex-remove,
           cortex-upgrade, cortex-diagnose, cortex-analyse
Tier 3  — Domain: cortex-build, cortex-task, cortex-scaffold
Tier 4  — Spec: cortex-spec, cortex-extract, cortex-generate, cortex-prd, cortex-propose, cortex-discover
Tier 5  — Governance: cortex-commit, cortex-rollback, cortex-stuck, cortex-diagram,
           cortex-lifecycle, cortex-score, cortex-learn, cortex-audit, cortex-report
Tier 6  — Quality: cortex-certify, cortex-health, cortex-hotfix, cortex-refactor, cortex-perf, cortex-security
Tier 7  — DevOps: cortex-env, cortex-secrets, cortex-migrate, cortex-index, cortex-changelog
Tier 8  — Docs: cortex-docs, cortex-swagger, cortex-handoff
Tier 9  — Intelligence: cortex-predict, cortex-pattern, cortex-clean
Tier 10 — NestJS Backend: dev-backend-context, dev-backend-endpoint, dev-backend-schema,
           dev-backend-test, dev-backend-debug, dev-backend-auth, dev-backend-queue
Tier 11 — Next.js Frontend: dev-frontend-context, dev-frontend-page, dev-frontend-component,
           dev-frontend-service, dev-frontend-debug, dev-frontend-lint,
           dev-frontend-form, dev-frontend-table, dev-frontend-search
Tier 12 — Fullstack: dev-fullstack-feature, dev-fullstack-debug
Tier 13 — Intelligence Tools: dev-debugger, dev-tester, dev-tdd, dev-tdd-constraint
Tier 14 — E-Commerce India: ecom-orders, ecom-payments, ecom-cart, ecom-inventory,
           ecom-tax, ecom-reviews, ecom-coupons, ecom-delivery
```

---

## CERTIFICATION REPORT

```
CORTEX CERTIFICATION REPORT — {date}
═════════════════════════════════════════════════════════
Total skills scanned:  [N]
Certified (v11.2):      [N] ✅
Uncertified:           [N] ❌ (added cert blocks if scope=fix)
Invalid fields:        [N] ⚠ (flagged for PA review)
═════════════════════════════════════════════════════════
UNCERTIFIED SKILLS (fixed):
  [list of skills that had cert blocks added]

FLAGGED FOR PA REVIEW:
  [skill] — [what field is invalid / why]
═════════════════════════════════════════════════════════
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-certify                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skills     [N] scanned | [N] certified | [N] fixed
Flagged    [N] for PA review
Logged     LAYER_LOG (CERTIFY) · {date}
Next       [/cortex-commit "chore: certify all skills v11.2" | PA review required]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

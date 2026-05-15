# /cortex-meta — Skill 77
# Meta-skill: Analyze and develop CORTEX itself
# Turns CORTEX's own governance tools inward — on its own skill files
# v11.2 | TIER: 15 | BUDGET: ARCH

---

```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-meta  |  v11.2  |  TIER: 15  |  BUDGET: ARCH        ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L5 · L6 · L9                                   ║
║ AUTHORITY     ║ GOVERNOR                                             ║
║ CAN           ║ - Read all skills/*.md files                        ║
║               ║ - Read all adapters/**/*.md files                   ║
║               ║ - Read all core/*.md protocol files                 ║
║               ║ - Read all templates/*.template files               ║
║               ║ - Read CHANGELOG.md + README.md + VERSION.md        ║
║               ║ - Write ai/logs/META_ANALYSIS.md                   ║
║               ║ - Write skill files (with explicit user approval)   ║
║               ║ - Write LAYER_LOG.md (TYPE: META)                  ║
║ CANNOT        ║ - Auto-apply skill changes without showing diff     ║
║               ║ - Delete existing skills                            ║
║               ║ - Modify core protocols without PA approval         ║
║ REQUIRES      ║ - Mode argument (audit | develop | propose | build) ║
║ ESCALATES     ║ - Proposed new core protocol → PA review            ║
║               ║ - Skill cert block changes → show diff, wait confirm║
║ OUTPUTS       ║ - META_ANALYSIS.md (full skill health report)       ║
║               ║ - Gap list with severity + effort                   ║
║               ║ - Proposed new skill files (propose mode)           ║
║               ║ - Applied fixes (develop mode, with approval)       ║
║               ║ - LAYER_LOG entry (TYPE: META)                     ║
║               ║ - Completion block: COMPLETE or PARTIAL             ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

---

## Purpose

`/cortex-meta` is the self-improvement skill for CORTEX. It runs CORTEX's
own governance patterns *against CORTEX itself* — scanning skill files the
same way cortex-analyse scans application code.

Use it to:
- Audit the health of all skill files (cert blocks, completion blocks, path refs)
- Find gaps across tiers (missing skills, thin coverage areas)
- Propose and build new skills when a gap is worth filling
- Track CORTEX's own version maturity over time

---

## Arguments

```
/cortex-meta audit           → full health scan (read-only, no changes)
/cortex-meta develop         → fix identified gaps in-session
/cortex-meta propose <area>  → propose a new skill for an area
/cortex-meta build <skill>   → build a new skill file from scratch
/cortex-meta diff            → compare current state vs CORTEX-v11.2-BUILD-PROMPT.md
```

---

## Phase 1 — Load CORTEX Self-Context

```
Read: skills/*.md               (all skill files, count them)
Read: adapters/**/*.md          (adapter skills)
Read: shared/*.md               (shared skills)
Read: ecom-india/*.md           (ecom skills)
Read: core/*.md                 (all protocol files)
Read: CORTEX-v8.0-BUILD-PROMPT.md (target spec, if present)
Read: CHANGELOG.md              (version history)
Read: README.md                 (documented skill count)
```

Build inventory:
```
Total skill files:      N
Adapter skill files:    N
Protocol files:         N
Template files:         N
Expected (v8.0 spec):   76 skills
Gap:                    76 - N = X missing
```

---

## Phase 2 — Skill Health Audit (audit + develop modes)

For each skill file, check all 8 health dimensions:

### 2.1 Certification block present?
```
PASS  → ╔══ block exists with all 7 fields
FAIL  → missing cert block entirely
WARN  → cert block present but incomplete (missing fields)
```

### 2.2 Completion block present?
```
PASS  → ━━━ completion block at end of file
FAIL  → no completion block
WARN  → completion block present but missing Next: field
```

### 2.3 File path references correct?
```
PASS  → all references use core/MASTER.md (no version suffix)
FAIL  → references old path ai/CORTEX-MASTER.md or ai/core/MASTER-v14.0.md (now archived) or ai/MASTER.md
```

### 2.4 Skill has budget class declared?
```
PASS  → BUDGET: LEAN | MODERATE | ARCH in cert block
FAIL  → no BUDGET declared
```

### 2.5 CANNOT list covers the 3 minimums?
```
Required minimums in CANNOT:
  1. Schema modification (or N/A for non-backend skills)
  2. Destructive file operations without user confirm
  3. Remote push / git push
PASS  → all 3 relevant minimums present
FAIL  → one or more minimums missing
```

### 2.6 Tier correctly assigned?
```
PASS  → skill tier in cert matches its actual position in help directory
FAIL  → tier missing or wrong
```

### 2.7 OUTPUTS lists completion block format?
```
PASS  → OUTPUTS mentions "Completion block: COMPLETE/PARTIAL/etc."
FAIL  → OUTPUTS does not mention completion block
```

### 2.8 Steps section is substantive?
```
PASS  → skill has numbered steps, not just output format
WARN  → skill has output format but no steps (thin implementation)
FAIL  → skill has no steps and no output format
```

---

## Phase 3 — Coverage Gap Analysis

Compare skill inventory against the v11.2 spec tiers:

```
TIER 1  Session Management     (target: 5)   actual: N   gap: X
TIER 2  Daily Development      (target: 8)   actual: N   gap: X
TIER 3  Domain Build           (target: 3)   actual: N   gap: X
TIER 4  Spec + Generation      (target: 6)   actual: N   gap: X
TIER 5  Governance             (target: 9)   actual: N   gap: X
TIER 6  Quality + Security     (target: 6)   actual: N   gap: X
TIER 7  DevOps + Environment   (target: 5)   actual: N   gap: X
TIER 8  Documentation          (target: 3)   actual: N   gap: X
TIER 9  Intelligence Loop      (target: 3)   actual: N   gap: X
TIER 10 NestJS Backend         (target: 7)   actual: N   gap: X
TIER 11 Next.js Frontend       (target: 9)   actual: N   gap: X
TIER 12 Fullstack              (target: 2)   actual: N   gap: X
TIER 13 Intelligence Tools     (target: 2)   actual: N   gap: X
TIER 14 E-Commerce India       (target: 8)   actual: N   gap: X
TIER 15 Meta                   (target: 1)   actual: N   gap: X
─────────────────────────────────────────────────────────────
TOTAL                          (target: 77)  actual: N   gap: X
```

For each identified gap, classify:
```
GAP-N: Missing /skill-name
  Tier:     X
  Severity: HIGH (blocks workflow) | MEDIUM (reduces coverage) | LOW (nice to have)
  Effort:   S (< 50 lines) | M (50-150 lines) | L (150+ lines)
  Rationale: [why this gap matters]
```

---

## Phase 4 — Protocol Health Check

For each core protocol file in core/:

```
MASTER.md          → Check: all 30 principles present?
MASTER.md      → Check: 4 block formats present? (RESPONSE_PROTOCOL merged)
MASTER.md      → Check: token budget rules present? (TOKEN_BUDGET merged)
MASTER.md      → Check: parallel-safe pairs listed? (EXECUTION_PROTOCOL merged)
INVARIANT_PROTOCOL.md   → Check: 3 tiers with examples?
CERTIFICATION_PROTOCOL.md → Check: 7 cert fields described?
PA_PROTOCOL.md          → Check: PA paths 1-4 + Emergency?
PROTOCOL_GUIDE.md       → Check: decision tree present?
```

Flag any protocol file that is:
- Missing (FAIL)
- Shorter than expected (< 30 lines for MASTER → WARN)
- References old version paths (FAIL)

---

## Phase 5 — Output: META_ANALYSIS.md

Write `ai/logs/META_ANALYSIS.md`:

```markdown
# CORTEX META ANALYSIS
Generated: {date} by /cortex-meta
Mode: {audit|develop|propose|build|diff}

## Inventory
Skills found:   {N} ({N} universal + {N} adapter + {N} ecom)
Target (v11.2): 86
Gap:            {N missing}

## Health Scores
Cert blocks:    {N pass / N fail / N warn}    {X}%
Completion:     {N pass / N fail / N warn}    {X}%
Path refs:      {N pass / N fail}             {X}%
Budget class:   {N pass / N fail}             {X}%
Thin skills:    {N} (steps section empty)

## Tier Coverage
{tier table from Phase 3}

## Gaps (ordered by severity)
{GAP-N entries}

## Protocol Health
{protocol check results}

## Recommendations
1. Fix all FAIL cert blocks (N files)
2. Add missing skills in tier priority order
3. Run /cortex-certify after fixes
```

---

## Phase 6 — Mode Actions

### audit mode (read-only)
Output META_ANALYSIS.md. No changes. Show summary to user.

### develop mode
For each FAIL finding:
1. Show exact fix needed (diff format)
2. Ask: "Apply this fix? (y/n/skip)"
3. Apply confirmed fixes only
4. Log each fix to LAYER_LOG

### propose mode `<area>`
Generate a complete draft for a new skill file covering `<area>`.
Format: full cert block + steps + completion block.
Save to: `skills/cortex-<area>.md.proposed`
Show to user. Do NOT activate until user renames it.

### build mode `<skill-name>`
Interactive skill builder:
1. Ask: "What does this skill do? (one sentence)"
2. Ask: "Which tier does it belong to? (1-15)"
3. Ask: "What layers does it touch?"
4. Ask: "What is the budget class? (LEAN/MODERATE/ARCH)"
5. Ask: "What can it read/write?"
6. Ask: "What is it explicitly prohibited from doing?"
7. Generate: full certified skill file from answers
8. Save to: `skills/<skill-name>.md`
9. Add to: cortex-help.md directory listing

### diff mode
Compare actual skill files against CORTEX-v8.0-BUILD-PROMPT.md:
- Skills in build prompt but not on disk → list as MISSING
- Skills on disk but not in build prompt → list as EXTRA (may be newer)
- Skills in both → compare cert block (MATCH / DRIFT)

Output diff table:
```
SKILL                  STATUS        NOTE
/start                 MATCH         cert block aligned
/cortex-hotfix         MISSING       not yet built from spec
/cortex-xyz            EXTRA         on disk, not in spec
/dev-backend-auth      DRIFT         BUDGET class differs
```

---

## Phase 7 — Log + Completion

Log to LAYER_LOG.md:
```
TYPE: META
DATE: {date}
ROLE: PA
MODULE: cortex
DETAIL: /cortex-meta {mode} — skills:{N} gaps:{N} fails:{N}
LAYER_ORIGIN: L5_AGENT
PA_REQUIRED: NO
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-meta                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode       {audit|develop|propose|build|diff}
Skills     {N found / 77 target}  |  Gap: {N}
Health     {N PASS · N FAIL · N WARN}  ({X}%)
Gaps       {N identified — see META_ANALYSIS.md}
Logged     LAYER_LOG (TYPE: META) · {date}
Next       {/cortex-certify (if FAIL) | /cortex-meta build <gap>}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If FAILED block:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-meta                    PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done       {N fixes applied | audit complete}
Blocked    {N fixes pending user approval}
Logged     LAYER_LOG (TYPE: META) · {date}
Next       Approve pending fixes → re-run /cortex-meta develop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Why This Skill Exists

CORTEX governs application code with invariants, audits, and memory.
Without `/cortex-meta`, CORTEX itself has no governance mechanism —
it grows by hand, without self-consistency checks.

With `/cortex-meta`:
- Every new skill must pass the same cert + completion block checks
  that application code passes via `cortex-analyse`
- Gaps are surfaced systematically, not discovered accidentally
- CORTEX's own development follows CORTEX's own principles:
  **P5 Chain of Custody · P10 Minimal Footprint · P21 Completion Required**

The system can audit itself. That is what makes it sovereign.

---

## Quick patterns

```
First use:         /cortex-meta audit → understand current health
After adding skill: /cortex-meta diff → confirm spec alignment
Gap spotted:       /cortex-meta propose <area> → draft the skill
Build new skill:   /cortex-meta build <name> → interactive builder
Weekly:            /cortex-meta audit → track CORTEX maturity score
```

<!-- Load the current ai/core/MASTER-v*.md (match the highest version present) and ai/memory/team-roles.md before executing this skill -->
<!-- LOOP_CAPABLE: true | LOOP_STEP: executing | LOOP_INVARIANTS: I-01, I-02, I-03 | LOOP_DOMAIN: (from feature request) -->
Execute the full FEATURE: protocol from AI-MANUAL.md.

$ARGUMENTS

---

**STEP 0 — CORTEX RUNTIME GUARD**

Run: `node scripts/runtime-guard.js cert-feature`
- Exit 0 → proceed to STEP 0.1
- Exit 1 → WARN (PHASE_MISMATCH). Ask: "Phase mismatch detected. Continue? (YES to proceed)"
  - YES → run: `node scripts/runtime-guard.js cert-feature --confirmed` → STEP 0.1
  - Anything else → STOP
- Exit 2 → HALT — do not proceed

---

**STEP 0.1 — Work type + role classification (always first)**

Read: `ai/memory/team-roles.md` (Work Type Classification section)

Apply the 4-question protocol to the feature request:
- Q1: Production emergency? → HOTFIX (wrong skill — use /cortex-bug)
- Q2: System structure change (new module, schema, env var)? **Check: does the module/schema already exist before flagging MIGRATION.**
  - "create X module" where X already exists in src/ → NOT MIGRATION → go to Q3
  - Truly new module (not found in src/) → MIGRATION path — ARCH approval required
- Q3: Anything exist? **Do NOT answer from memory — grep src/ for the module or feature name first.**
  - Found → MAINTENANCE or REFACTOR (go to Q4)
  - Not found → GREENFIELD
  - Uncertain → default to MAINTENANCE (cert-ground at Step 2 will correct if wrong)
- Q4: Behaviour changes? No → REFACTOR | Yes → MAINTENANCE

Output:
```
WORK TYPE: <GREENFIELD | MAINTENANCE | MIGRATION>
Reason:    <one line>
Projects:  <list affected repos from session-state.json project field>
Roles:     <list active roles>
PA:        YES (Phase <n>) | NO
```

Update `ai/state/session-state.json`: set `active_work_type`, `active_role` = SENIOR_FULLSTACK, `session_date`.

Log to `ai/ROLE_LOG.md`:
```
[<ISO>] ROLE=SENIOR_FULLSTACK ACTION=PLAN WORK_TYPE=<type> PROJECTS=<list> DETAIL="FEATURE: <description>"
```

If PA required → STOP and present what needs PA approval before proceeding.

---

**STEP 0.5 — Contract check + session init (auto — fires before path classification)**

Run the executor gate first (contract check + session init in one call):

```bash
node $CORTEX_ROOT/scripts/cortex-executor.js start --task "$TASK_TYPE" --version "v18"
```

Where `$TASK_TYPE` is the classified task type (e.g. `create-order`, `create-module`).
Result `BLOCK` → halt. Result `WARN` → note and continue. Result `PASS` → continue.

Then load remaining contracts:
- Code generation tasks → check `ai/mappings/` (e.g. `nestjs.md`, `nextjs.md`)
- Execution tasks → check `ai/contracts/` (e.g. `deploy-exena.md`)

Match on task intent:
- "create [module name] module" → `ai/mappings/nestjs.md` → `create-module`
- "create auth" / "add authentication" → `ai/mappings/nestjs.md` → `create-auth`
- "create order" / "add orders module" → `ai/mappings/nestjs.md` → `create-order`
- "deploy exena" / "deploy to railway" → `ai/contracts/deploy-exena.md`

If contract found → load it now and apply CONTRACT ENFORCEMENT:

```
CONTRACT ENFORCEMENT
────────────────────────────────────────────────
Contract : <file path loaded>
Task     : <matched task name>

Rules:
1. Output MUST match contract structure exactly — no additions, no omissions
2. File list from contract is authoritative — do NOT invent files outside it
3. Responsibilities per file are fixed — do NOT move logic between layers

If output deviates from contract at any point:
→ STOP immediately
→ Report: CONTRACT VIOLATION — <what deviated and why>
→ Do NOT generate partial output
→ Wait for human to resolve before continuing
────────────────────────────────────────────────
```

If no contract found → proceed. Standard skill flow applies.

**Code Governance Engine check (fires for NestJS create-* tasks):**

If `--spike` is in $ARGUMENTS:
```
⚡ ENGINE SKIPPED — --spike flag detected
   Code Governance Engine rules not enforced for this session.
   Use for exploratory/prototype work only. Remove --spike before any production commit.
```
Skip engine load entirely. Proceed to multi-agent check.

Detect task type from $ARGUMENTS:
- Contains "create controller" or task_type = create-controller → load `adapters/dev/nestjs-contracts/create-controller.md`
- Contains "create service" or task_type = create-service → load `adapters/dev/nestjs-contracts/create-service.md`
- Contains "create dto" or task_type = create-dto → load `adapters/dev/nestjs-contracts/create-dto.md`
- Contains "create module" or "add module" or task_type = create-module → load `adapters/dev/nestjs-contracts/create-module.md`

For any of the above, also load in order:
1. `adapters/dev/code-design.md`           ← principles layer (5 contracts — always)
2. `adapters/dev/nestjs-code-design.md`    ← NestJS implementation (templates + tokens)
3. `adapters/dev/code-governance-engine.md` ← enforcement gate (BLOCK/FLAG rules)

Step 1 — extract 5 contracts from code-design.md:
  Layer contract · Input contract · Error contract · Response contract · Naming contract

Step 2 — extract NestJS tokens from nestjs-code-design.md:
  Layer ownership table · Component templates · Error mapping · Module anatomy

Step 3 — load governance engine rules for Step 3.5 enforcement.

Use extracted contracts + tokens throughout Steps 2–4 to guide generation.

On successful load, output:
```
ENGINE LOADED — [task-type] · [N] rules active
  Principles : adapters/dev/code-design.md (5 contracts extracted)
  Stack impl : adapters/dev/nestjs-code-design.md (NestJS tokens loaded)
  Contract   : adapters/dev/nestjs-contracts/[task-type].md
  Engine     : adapters/dev/code-governance-engine.md
  Rules      : R-CG1–R-CG6 (BLOCK) · R-CN1–R-CN5 (FLAG) · R-CS1–R-CS5 (FLAG)
  Enforcement at Step 3.5
```

If code-design.md is NOT found:
```
⚠ CODE DESIGN SYSTEM — principles file not found
  Expected: adapters/dev/code-design.md
  5 contracts NOT loaded — generation will proceed without design principles.
  Risk: naming drift · layer violations · inconsistent error + response handling.
  Proceeding with stack impl + governance engine only.
```

If nestjs-code-design.md is NOT found (for NestJS projects):
```
⚠ CODE DESIGN SYSTEM — stack implementation not found
  Expected: adapters/dev/nestjs-code-design.md
  NestJS templates NOT loaded — generation will proceed with principles only.
  Risk: no NestJS-specific patterns available for code generation.
  Proceeding with principles layer + governance engine only.
```

If code-governance-engine.md is NOT found:
```
⚠ CODE GOVERNANCE ENGINE — contract not found
  Expected: adapters/dev/code-governance-engine.md
  Engine rules NOT enforced for this task.
  Proceeding without code-level governance — review output manually.
```
Do NOT silently skip. Surface this warning before continuing.

If nestjs-contract file is NOT found for matched task type:
```
⚠ CODE GOVERNANCE ENGINE — task contract not found
  Expected: adapters/dev/nestjs-contracts/{task-type}.md
  Contract rules NOT enforced for this task.
  Proceeding with engine rules only (naming + layer boundary checks still apply).
```

**Multi-agent contract review (fires when `--multi-agent` flag is in $ARGUMENTS):**

For complex features spanning design + backend (flag: `--multi-agent`):

```
STEP 0.5a — Spawn contract-reviewer agent
──────────────────────────────────────────────────────────
1. Collect available contracts:
     ai/contracts/requirements.md    (if exists)
     ai/contracts/architecture.md    (if exists)
     ai/contracts/ui-contract.md     (if exists)

2. Run contract-reviewer agent with:
     feature: <$ARGUMENTS without --multi-agent>
     contracts: <list of files that exist>

3. Parse JSON verdict field:
     "CLEAR"    → output CLEAR summary · proceed to next step
     "CONFLICT" → HARD HALT

If CONFLICT:
──────────────────────────────────────────────────────────
CONTRACT CONFLICT — HARD HALT
Do not write any code.
Surface the full conflict report.
Action: fix the conflicting contracts, then re-run /cert-feature --multi-agent
──────────────────────────────────────────────────────────
```

If `--multi-agent` not present → skip this block entirely.
Reference: `agents/contract-reviewer.md` · `adapters/contracts/ui-contract-format.md`

**Requirements contract check (fires after execution contract check):**

1. Check if `ai/contracts/requirements.md` exists
   - NOT FOUND → WARN:
     ```
     ⚠ No requirements contract at ai/contracts/requirements.md
     Run /cortex-intake or /cortex-prd to generate one, or create manually.
     Proceeding without scope declaration — solo dev exception applies.
     ```
   - FOUND → read it and check:
     a. Is the feature request within SCOPE?
        - YES → proceed, note which scope item covers it
        - NO, and feature is in OUT_OF_SCOPE → BLOCK:
          ```
          REQUIREMENTS VIOLATION — feature is explicitly out of scope
          Scope declared: <out_of_scope entry>
          Action: update ai/contracts/requirements.md before proceeding
          ```
        - NO, but not in OUT_OF_SCOPE → WARN: feature may be outside declared scope — confirm before continuing

     b. Does it touch modules listed in AFFECTED_MODULES?
        - YES → carry the module list into the G2 architecture check below
        - NO → note as potentially new module, flag for architecture contract review

**Architecture contract check (fires after requirements contract check):**

1. Check if `ai/contracts/architecture.md` exists
   - NOT FOUND → WARN:
     ```
     ⚠ No architecture contract at ai/contracts/architecture.md
     Run /cert-blueprint to generate one, or create manually.
     Proceeding without architecture boundary declaration.
     ```
   - FOUND → read it and check:
     a. Does this feature add a new module not in MODULE_BOUNDARIES?
        - YES → ARCHITECTURE VIOLATION (WARN):
          ```
          ⚠ Module '<name>' is not in the agreed module list.
          Update ai/contracts/architecture.md before or after this build.
          ```
     b. Does the planned implementation use a FORBIDDEN_PATTERN?
        - YES → CONTRACT VIOLATION (BLOCK):
          ```
          CONTRACT VIOLATION — forbidden pattern detected
          Pattern : <pattern name>
          Reason  : <from FORBIDDEN_PATTERNS>
          STOP — do not generate code with this pattern.
          ```
     c. Does the planned data flow match AGREED data flow?
        - NO → CONTRACT VIOLATION (BLOCK):
          ```
          CONTRACT VIOLATION — data flow violation
          Planned : <what was planned>
          Agreed  : <from DATA_FLOW>
          STOP — fix approach before continuing.
          ```

---

**STEP 0.7 — Edge Case Engine (fires automatically if ai/context/business-rules.md exists)**

```bash
cat ai/context/business-rules.md 2>/dev/null
```

If file exists: map the feature being built to affected modules.
Find all rules where `module:` matches an affected module.
Surface the relevant rules as edge cases the dev MUST handle:

```
EDGE CASES — [feature name]
───────────────────────────────────────────────────────────
From business-rules.md (auto-detected for modules: [list]):

  BL-XX  [BLOCK]  [module]
         Rule:    [description]
         Handle:  Must implement [specific check] before writing code
         Plain English: [human: field]

  BL-XX  [WARN]   [module]
         Rule:    [description]
         Handle:  Consider [specific check]
───────────────────────────────────────────────────────────
[N] edge cases surfaced · [N] BLOCK (required) · [N] WARN (recommended)
```

BLOCK edge cases are requirements — dev must handle them before STEP 1 path classification.
WARN edge cases are recommendations — dev notes them and handles if applicable.

If no business-rules.md → skip silently. Output: "Edge case engine: no rules file — skipped"

---

**STEP 0.8 — Instinct Injection (fires automatically — always)**

Run the instinct engine against the feature description:

```bash
node [CORTEX_ROOT]/scripts/instinct-engine.js inject "$FEATURE_DESCRIPTION"
```

Where `CORTEX_ROOT` is the Cortex repo root (`C:\luv\Cortex` or read from `CORTEX_PATH` env var).

**If the script is available:** Parse its output and surface the INSTINCT CHECK block to the user before proceeding to Step 1. The engine auto-detects domains from the task text and loads relevant graduated + pending-critical instincts.

**If the script is not found:** Fall back to manual domain detection:
- Touches Prisma model / schema → domain: `database`, `migrations`
- Touches controller / route → domain: `architecture`, `security`, `api-design`
- Touches payment / Razorpay → domain: `payments`
- Touches notification / SMS / MSG91 → domain: `notifications`
- Touches frontend hook / query → domain: `frontend-state`
- Touches test / spec file → domain: `qa`
- Touches main.ts / bootstrap → domain: `error-handling`
Then manually load and filter `knowledge/instincts.json` + `knowledge/pending-instincts.json`.

**Enforcement rules:**
- `severity: critical` instincts → hard requirements. Violation must be flagged before code is accepted.
- `severity: high` instincts → flag if anti-pattern appears in generated code.
- `severity: medium/low` → surface as notes only.
- `pending + critical` → surface with evidence count and promote_when for awareness.

If no matching instincts → output: "Instinct check: no matching instincts for active domains — skipped"

---

**STEP 1 — Path classification**
- Read `ai/AI-MANUAL.md` (Three Paths section)
- Read `ai/context/forbidden.md`
  - If not found: apply CLAUDE.md coding standards (no cross-module DB, no circular imports, no `any`)
- Read `ai/context/invariants.md`
  - If not found: use CLAUDE.md critical business rules section instead
- Classify: TRIVIAL / FEATURE / ARCH

If **ARCH path** — stop here and list what requires explicit human approval before proceeding:
- Prisma migrations (`prisma migrate dev`)
- New environment variables
- New external services (Razorpay, Shiprocket, etc.)
- Auth / payment / webhook flow changes
- New module creation
- Destructive DB operations

Do not proceed past Step 1 on ARCH path without "approved" or "go ahead" from the user.

---

**STEP 2 — Ground + Read existing code**

**Run /cert-ground "<feature description>"** — before reading anything manually.

- 🔴 BLOCKED → stop (feature may already exist, or baseline is broken) — resolve first
- ⚠ REVIEW NEEDED → feature or parts of it may already be implemented — adjust scope
- ✅ GROUNDED → proceed with verified file/symbol state as anchor

After grounding:
- Read the related Mermaid diagram in `ai/mermaid/` (cert-ground doesn't cover these)
- Read `ai/app.prd.md` — confirm the feature isn't already specced differently
- Use cert-ground's Ground Truth block instead of re-reading controller/service/DTOs

---

**STEP 3 — Plan first (FEATURE path only — skip for TRIVIAL)**
Output:
- PRD diff: what will be added to `ai/app.prd.md`
- Diagram change: what will change in `00-PROJECT-MASTER.md`
- Files to create or modify (list them)

Wait for user to confirm "OK" or "go ahead" before writing any code on FEATURE path.

---

**STEP 3.5 — Structural Safety Check (auto — fires before every implementation)**

Using context already loaded (invariants, forbidden, grounded file state), output:

```
STRUCTURAL CHECK — [feature name]
────────────────────────────────────────────────────────
Access Control  : [which routes will be public vs guarded? name the guards.
                   If touching existing routes — are current guards correct?]
State Integrity : [does this touch 2+ tables? name them. $transaction required?
                   Flag UNGUARDED if multi-table write without transaction]
Side Effects    : [will this send emails/notifications/webhooks? queued or inline?
                   Flag INLINE RISK if side-effect not queued]
Sensitive Data  : [does any response shape or log include tokens, passwords, or PII
                   beyond what the auth level permits?]
Invariant Match : [state which CLAUDE.md §2 rule this feature touches and whether
                   the planned implementation respects or risks it]
────────────────────────────────────────────────────────
Risk: LOW ✅  → proceed to Step 4
      MEDIUM ⚠ → proceed, note risk in code comment
      HIGH 🚫  → STOP — explain risk, wait for explicit PROCEED
```

If MEDIUM or HIGH → update the plan from Step 3 before implementing.

**Code Governance Engine enforcement (fires if engine was loaded at Step 0.5):**

If `adapters/dev/code-governance-engine.md` was loaded, run all rules against the proposed plan now:

```
ENGINE CHECK — [feature name]
────────────────────────────────────────────────────────
Layer Boundary  : [check R-CG1–R-CG6 against planned files — BLOCK if violated]
Naming          : [check R-CN1–R-CN5 against planned class/file/method names — FLAG if wrong]
Structure       : [check R-CS1–R-CS5 against planned module structure — FLAG if wrong]
Anti-Patterns   : [surface AP-1–AP-5 relevant to affected modules]
────────────────────────────────────────────────────────
Engine result: PASS ✅  → proceed to Step 4
               BLOCKED 🚫 → STOP — list all BLOCK rules triggered
               FLAGGED ⚠  → list all FLAG issues — human must acknowledge before "go ahead"
```

If engine result is BLOCKED → output ENGINE BLOCK format from code-governance-engine.md.
Do NOT proceed to Step 4 until all BLOCK rules are resolved.
FLAGGED issues must be acknowledged by human before implementation begins.

---

**STEP 4 — Implement**
- Controller (HTTP only) — parse request, call service, return response
- Service (business logic) — validate rules, $transaction boundary, queue side-effects
- PrismaService — Prisma queries with include/select
- DTOs with class-validator for all inputs
- Guards (JwtAuthGuard, RolesGuard) for all auth endpoints
- No `any` — use `unknown` + type guards
- Explicit return types on all functions
- If contract specifies a `*.service.spec.ts` → write unit tests for the service layer now, not after Step 5

---

**STEP 5 — Verify**
- Run: `npx tsc --noEmit`
- Must pass with 0 errors before continuing.

---

**STEP 6 — Update blueprint**
- Append changelog entry to `ai/app.prd.md`
- Update `ai/mermaid/00-PROJECT-MASTER.md` — Module Health Scorecard if module status changed
- Update the domain-specific Mermaid file if system topology changed

---

**STEP 7 — Update TRACKER**
Append to `ai/TRACKER.md` under today's date:
```
[YYYY-MM-DD] FEATURE_ADDED — [module] — [endpoint or capability added]
```

---

**STEP 8 — Log lifecycle event**
Run: `node scripts/lifecycle.js log --action=FEATURE_ADDED --module=<module> --detail="<what was added>"`

---

**STEP 9 — Contract feedback signal**

If a requirements or architecture contract was loaded in Step 0.5, prompt:

```
Did output match the contract? (Y/N)
Optional note: <what matched or diverged>
```

Log response to `ai/state/contract-feedback.json` (append, create if missing):

```json
{
  "date": "<YYYY-MM-DD>",
  "contract": "<requirements | architecture | both>",
  "task": "<feature description>",
  "matched": true,
  "note": "<optional>"
}
```

If file doesn't exist, create it as a JSON array `[]` then append the entry.

---

**LAYER LOG — append to `ai/lifecycle/LAYER_LOG.md`:**

```
[<ISO timestamp>]
TYPE: BUILD
PROJECT: <exena-api|exena-web|exena-admin>
ROLE: <active_role from ai/state/session-state.json>
LAYER_ORIGIN: <starting layer of the build>
LAYER_FIXED: <primary layer where implementation lives>
LAYERS_TOUCHED: <comma-separated, e.g. L3_DTO, L4_SERVICE, L1_CONTROLLER, L8_TEST>
LAYER_VIOLATED: NONE
FRONTEND_IMPACT: <NONE|LOW|MEDIUM|HIGH>
PA_REQUIRED: <YES Phase n | NO>
CONTRACT: <UNCHANGED|NON_BREAKING|BREAKING>
ENGINE: <LOADED rules=[N] task=[type] result=[PASS|BLOCKED|FLAGGED|SKIPPED(--spike)|NOT_LOADED]>
MODULE: <module>
FILES: <files created or modified>
DETAIL: <one-line description of what was built>
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-feature                   COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files      {n created · n modified}
PA         {YES Phase n — pending review | NO}
Logged     LAYER_LOG (TYPE: BUILD) · {date}
Next       npx tsc --noEmit → /cortex-commit → /cortex-diagram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If ARCH path detected before implementation:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-feature                   HALTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Policy     ARCH path — explicit approval required
Attempted  {what was planned}
Blocked    Schema change / new module / new env var
Logged     LAYER_LOG · {date}
PA needed  Review plan above → "approved" to proceed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If contract violation detected:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-feature          CONTRACT VIOLATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract   {contract file loaded}
Violation  {what deviated from contract}
Output     STOPPED — no partial output generated
Action     Resolve deviation → re-run from Step 0.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If requirements violation detected:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-feature     REQUIREMENTS VIOLATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract   ai/contracts/requirements.md
Violation  {feature is explicitly listed in OUT_OF_SCOPE}
Output     STOPPED — scope boundary enforced
Action     Update requirements contract → re-run from Step 0.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If architecture violation detected (BLOCK-level):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-feature    ARCHITECTURE VIOLATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract   ai/contracts/architecture.md
Violation  {forbidden pattern | data flow violation}
Output     STOPPED — architecture boundary enforced
Action     Fix implementation approach → re-run from Step 0.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

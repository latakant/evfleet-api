# /cortex-spec — Skill 46
# LOAD WHEN: /cortex-spec (any subcommand)
# Spec lifecycle management. All spec changes go through this skill.
# PA approval required for every spec change.

$ARGUMENTS

## Usage
cortex spec init      → create/populate spec (greenfield or fresh definition)
cortex spec propose   → propose a spec change (PA required before any code)
cortex spec validate  → check spec completeness + confidence scores
cortex spec diff      → spec vs code delta (compliance score /20)
cortex spec version   → show version history (SPEC_VERSION.md)
cortex spec history   → full change timeline (SPEC_LOG.md last 10 entries)

## TOKEN BUDGET (this skill)
spec init:    load INTENT.yaml (check if exists) — one file
spec propose: load relevant layer file only (not all spec)
spec diff:    grep source + read spec files — no full tree reads
spec history: read SPEC_LOG.md last 10 entries only

---

## MODE: init

Step 1: Check if spec/intent/INTENT.yaml has confidence PENDING_EXTRACT
  If confidence is already HIGH: ask "Spec exists — extend or redefine?"

Step 2: For Exena (brownfield — code exists):
  Recommend running /cortex-extract first to populate from code.
  If user wants manual init: ask questions ONE AT A TIME.

Step 3: Greenfield init questions (one at a time, wait for each):
  Q1: "What does this system fundamentally do? (1-2 sentences)"
  Q2: "Who are the primary users? (list all user types)"
  Q3: "What are the 3-5 most important things the system must do?"
  Q4: "What can NEVER happen? (absolute constraints)"
  Q5: "What are the core entities? (User, Order, Product etc.)"
  Q6: "Business type: ecommerce / saas / marketplace / fintech / booking / custom"

Step 4: Generate/update spec files from answers
  Update: spec/intent/INTENT.yaml (confidence: HIGH — human-defined)
  Create: spec/domain/entities/<entity>.yaml for each entity

Step 5: PA review — show summary, wait for APPROVE or MODIFY
Step 6: On APPROVE — bump spec to 0.1.0, append to SPEC_LOG + PA_LOG

---

## MODE: propose

Step 1: Identify which spec layer is affected (intent/domain/contract/policy)
Step 2: Load only the affected file (not all spec)
Step 3: Show: current state | proposed change | code impact
Step 4: ⛔ HARD HALT if change is INTENT layer — always PA. Always both Luv + Claude.
Step 5: Wait for PA approval — do not proceed without it
Step 6: On APPROVE — apply change, bump version, append to SPEC_LOG + PA_LOG

---

## MODE: diff (spec compliance check)

Step 1: Read spec/domain/DOMAIN_OVERVIEW.yaml (entity list)
Step 2: For each entity: grep src/modules/ for matching service/schema
Step 3: Read spec/contracts/api/*.yaml — compare against API_CONTRACT.md
Step 4: Score each check:
  spec/domain/entities/ exists:        +4
  spec version PA-approved:            +4
  code matches spec entities:          +4
  code matches spec contracts:         +4
  policies enforced in code:           +4
  Total: /20
Step 5: Output compliance report + recommend: /cortex-extract to fill gaps

---

## HARD HALT trigger
⛔ HARD HALT — [POL-CRIT-001] Spec change without PA approval
Action required: Use /cortex-spec propose to propose this change
Cannot continue until PA approves.

---

## Completion block (MASTER.md)

### If spec updated:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-spec                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files      {spec files written/updated}
Compliance {n}/20
Logged     LAYER_LOG (TYPE: BUILD) · {date}
Next       /cortex-generate to produce code from updated spec
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If HARD HALT (unapproved spec change):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-spec                    HALTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Policy     POL-CRIT-001 — spec change requires PA approval
Attempted  {what was proposed}
Blocked    Not PA-approved
PA needed  /cortex-spec propose → PA reviews → approval → re-run
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

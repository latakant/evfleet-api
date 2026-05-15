# /cortex-extract — Skill 48
# LOAD WHEN: /cortex-extract | /cortex analyze | brownfield → spec
# Extract spec from Exena's existing code. Confidence-scored.
# Human review REQUIRED before using extracted spec.

$ARGUMENTS

## Usage
cortex extract all        → full Exena codebase → spec extraction
cortex extract <module>   → single module extraction (e.g., cortex extract orders)
cortex extract validate   → check existing spec accuracy vs current code

## TOKEN BUDGET (ARCH path — reads deeply)
Load before starting: ARCHITECTURE_MEMORY.md + DOMAIN_MEMORY.md
Read modules ONE AT A TIME — not all at once.
Use grep for discovery, Read only the specific service files.

---

## Extraction Protocol

Step 1: Load ARCHITECTURE_MEMORY.md (understand Exena module structure)
Step 2: Load DOMAIN_MEMORY.md (know which modules are BUILT)
Step 3: List modules: ls src/modules/

Step 4: For each module (one at a time — RULE B):
  a. Read <module>.service.ts → extract business rules + constraints
  b. Read schema section for this entity (grep prisma/schema.prisma)
  c. Read <module>.controller.ts → extract API contract (routes + auth)
  d. Generate: spec/domain/entities/<entity>.yaml with confidence scores
  e. Generate: spec/contracts/api/<module>-api.yaml

Step 5: Generate workflows from $transaction patterns:
  grep "prisma.\$transaction" src/ → identify all transaction sequences
  Map to spec/domain/workflows/

Step 6: Update DOMAIN_OVERVIEW.yaml with confirmed entity list

Step 7: Output confidence report:
```
EXTRACTION REPORT — Exena
=========================
Modules extracted: <n>/19

Confidence breakdown:
  HIGH (directly from code):   <n> items
  MEDIUM (inferred patterns):  <n> items
  LOW (needs Luv input):       <n> items

LOW confidence items (human review required):
  - INTENT.yaml: purpose, goals — confirm with Luv
  - CONSTRAINTS.yaml: business constraints — confirm with Luv
  - <list any inferred rules that need validation>

Next steps:
  1. Review LOW confidence items above
  2. Run /cortex-spec propose to confirm/correct
  3. PA approves extracted spec
  4. Run /cortex-spec diff to check compliance score
```

---

## Confidence Rules
  Entity fields from prisma schema    → HIGH confidence
  Business rules from service methods → MEDIUM confidence
  API routes from controller          → HIGH confidence
  Guard/auth patterns                 → HIGH confidence
  Intent/purpose (WHY)                → LOW confidence — always Luv defines this
  Business constraints                → LOW confidence — always human-validated

## Exena-Known Extractions (pre-filled)
The following are already HIGH confidence for Exena:
  - 19 modules built (see DOMAIN_MEMORY.md)
  - 28 Prisma models (see prisma/schema.prisma)
  - 103 endpoints (see ai/governance/API_CONTRACT.md)
  - Order state machine (7 states — see order-states.yaml)
  - Payment flow (Razorpay HMAC + COD auto-confirm)
  Run: cortex extract to populate remaining entity YAML files.

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-extract                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modules    {n}/{total} extracted
Confidence HIGH: {n} · MEDIUM: {n} · LOW: {n} (review required)
Files      ai/spec/domain/entities/ · ai/spec/contracts/api/
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       Review LOW confidence items → /cortex-spec propose → PA approval
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

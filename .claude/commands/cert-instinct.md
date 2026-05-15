╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-instinct  |  v1.0  |  TIER: 1  |  BUDGET: LEAN      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ governance · intelligence                            ║
║ AUTHORITY     ║ INTELLIGENCE CURATOR                                 ║
║ CAN           ║ - Inject relevant instincts for any task             ║
║               ║ - Check a new rule for conflicts before adding       ║
║               ║ - Validate + execute graduation of a pending instinct║
║               ║ - Show current instinct system status                ║
║ CANNOT        ║ - Auto-graduate without human confirmation           ║
║               ║ - Add instincts directly (human must confirm)        ║
║               ║ - Modify graduated instincts (new evidence required) ║
║ SCRIPT        ║ scripts/instinct-engine.js                           ║
║ READS         ║ knowledge/instincts.json                             ║
║               ║ knowledge/pending-instincts.json                     ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-instinct v1.0 — Instinct management skill.

$ARGUMENTS

Parse sub-command from $ARGUMENTS:
- `inject <task>`          → inject
- `conflict-check <rule>`  → conflict-check
- `promote <id>`           → promote
- `status`                 → status
- (no args)                → show help

---

## inject

**Usage:** `/cert-instinct inject add payment controller to orders module`

Run:
```bash
node [CORTEX_ROOT]/scripts/instinct-engine.js inject "$TASK_DESCRIPTION"
```

Surface the INSTINCT CHECK output.
For CRITICAL instincts: highlight them as hard requirements before any code is written.
For HIGH instincts: remind to check generated code for the anti-pattern.

---

## conflict-check

**Usage:** `/cert-instinct conflict-check` (interactive) or with inline args

Step 1 — Collect from user if not in $ARGUMENTS:
- Domain (required)
- Rule text (required)
- Anti-pattern text (optional)
- ID for the new instinct (optional)

Step 2 — Run:
```bash
node [CORTEX_ROOT]/scripts/instinct-engine.js conflict-check \
  --id "<id>" \
  --domain "<domain>" \
  --rule "<rule text>" \
  --anti "<anti-pattern text>"
```

Step 3 — Interpret result:
- `CLEAR`     → safe to add. Guide user to append to `knowledge/pending-instincts.json` with correct schema (confidence: 0.5–0.7, evidence_count: 1, graduated: false, severity, scope, trigger, promote_when).
- `DUPLICATE` → show which existing instinct it duplicates. Ask: update existing or discard new?
- `CONFLICT`  → show conflicting instinct. BLOCK: do not add until conflict is resolved.
- `REVIEW`    → show trigger overlap. User decides whether both are needed.

---

## promote

**Usage:** `/cert-instinct promote p2025-to-not-found-exception`

Step 1 — Run gate check:
```bash
node [CORTEX_ROOT]/scripts/instinct-engine.js promote --id "<id>"
```

Step 2 — Interpret result:
- `GATE FAIL`        → show what's missing (confidence or evidence_count). Do NOT promote. Guide user to update pending entry first.
- `ALREADY GRADUATED`→ cleaned from pending. Nothing else needed.
- `PROMOTED`         → confirm moved to instincts.json. Remind to propagate cert-feature update if the domain gained its first instinct.

Step 3 — If promoted: check if this domain now has enough instincts for domain-level enforcement to be meaningful (3+ instincts in domain → suggest domain is well-covered).

---

## status

**Usage:** `/cert-instinct status`

Load both knowledge files. Output:

```
INSTINCT SYSTEM STATUS
──────────────────────────────────────────────────────
Graduated  : [N] instincts · [N] domains covered
Pending    : [N] instincts · [N] critical

DOMAIN COVERAGE (graduated):
  [domain] · [N] instincts · [min confidence: X]
  ...

READY TO GRADUATE (pending with confidence ≥ 0.85 AND evidence_count ≥ 3):
  [id] · [domain] · confidence: [X] · evidence: [N]
  ...  (or "none ready" if none qualify)

CRITICAL PENDING (not yet graduated, severity=critical):
  [id] · [domain] · evidence: [N] · promote when: [text]
  ...

──────────────────────────────────────────────────────
Run /cert-instinct promote <id> to graduate a pending instinct.
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:     cert-instinct
COMMAND:   [inject | conflict-check | promote | status]
RESULT:    [outcome]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

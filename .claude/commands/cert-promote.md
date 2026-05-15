╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-promote  |  v1.0  |  TIER: 5  |  BUDGET: LEAN       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L9 (Feedback) — intelligence evolution               ║
║ AUTHORITY     ║ ANALYST + limited WRITE (shared-instincts.json only) ║
║ CAN           ║ - Run promote-patterns.js to find candidates         ║
║               ║ - Show instincts ready for shared pool              ║
║               ║ - Write approved instincts to shared-instincts.json ║
║ CANNOT        ║ - Modify project instincts.json files               ║
║               ║ - Auto-promote without human review                 ║
║               ║ - Modify adapter laws (use /cert-learn --promote)   ║
║ WHEN TO RUN   ║ - Monthly (at retrospective)                        ║
║               ║ - After 3+ projects fix the same class of bug       ║
║               ║ - When promote-patterns.js shows 1+ candidates      ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-promote — Review and approve cross-project instinct promotion.

When a pattern graduates in one project (confidence ≥ 0.8), it stays local.
When the same pattern appears in 2+ projects, it becomes a candidate for
the shared pool (knowledge/shared-instincts.json). Once in the shared pool,
ALL projects benefit — diagnose.js checks shared before project-local.

This skill governs the promotion decision. A human reviews each candidate.
No auto-promotion. The shared pool is the most trusted knowledge layer.

$ARGUMENTS

Parse from $ARGUMENTS:
- `list` → show all current candidates (default)
- `approve <id>` → promote instinct to shared pool
- `reject <id>` → mark instinct as rejected (not suitable for sharing)
- `status` → show current shared pool + candidate counts

---

## STEP 1 — Find candidates

```bash
node scripts/promote-patterns.js --min=2 --json
```

Show each candidate:
```
CANDIDATE — [instinct title]
  Projects : [project-a] · [project-b]
  Domain   : [domain]
  Pattern  : [what to do]
  Evidence : [confidence] across [N] projects
  ID       : [id]
```

If 0 candidates: output "No cross-project instincts ready — healthy isolation."
Stop here if 0 candidates.

---

## STEP 2 — Human review gate

For each candidate, ask:

```
Promote "[title]" to shared pool?

  Pattern : [what to do]
  Domain  : [domain]
  Projects: [project-a] · [project-b]
  Risk    : [low | medium — state why]

  [Y] Approve — add to knowledge/shared-instincts.json
  [N] Reject  — keep project-local only
  [S] Skip    — decide later

Type Y / N / S:
```

Wait for human input before proceeding. Never auto-approve.

---

## STEP 3 — Write approved instincts to shared pool

For each approved candidate, add to `knowledge/shared-instincts.json`:

```json
{
  "id": "[domain]-[slug]",
  "title": "[instinct title]",
  "domain": "[domain]",
  "pattern": "[what to do]",
  "anti_pattern": "[what not to do]",
  "why": "[reason this matters]",
  "confidence": [value],
  "projects": ["[project-a]", "[project-b]"],
  "promoted": "[YYYY-MM-DD]",
  "source": "cross-project promotion via cert-promote"
}
```

---

## STEP 4 — Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Shared Instinct Promotion Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candidates reviewed : N
  Approved          : N → added to shared pool
  Rejected          : N → kept project-local
  Skipped           : N → review next time

Shared pool total   : N instincts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next: run /cert-promote again when promote-patterns.js finds new candidates
```

---

## MUST-VERIFY

```
☐ Step 1 — promote-patterns.js ran, candidates listed
☐ Step 2 — human reviewed each candidate (no auto-approvals)
☐ Step 3 — approved instincts written to shared-instincts.json
☐ Step 4 — promotion report shown
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS   : COMPLETE
Skill    : /cert-promote
Approved : N instincts → shared pool
Shared   : N total instincts
Next     : /cert-promote at next retrospective
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

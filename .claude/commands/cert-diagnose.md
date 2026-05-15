```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cert-diagnose  |  v11.2  |  TIER: 2  |  BUDGET: LEAN       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ ALL layers                                           ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Match error against graduated pattern library      ║
║               ║ - Run Precision gate before any fix is proposed      ║
║               ║ - Feed intelligence layer with diagnosis outcome     ║
║ CANNOT        ║ - Write any fix (use /cert-bug after this)           ║
║               ║ - Skip Precision gate even for KNOWN patterns        ║
║               ║ - Proceed if Confidence is LOW without human approval║
║ REQUIRES      ║ - MASTER.md loaded                           ║
║               ║ - scripts/diagnose.js + scripts/learn.js exist      ║
║ OUTPUTS       ║ - KNOWN/UNKNOWN verdict · Precision gate · Next step ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Run diagnosis against the pattern library. Precision gate before any fix is proposed.

$ARGUMENTS

Parse from $ARGUMENTS: error description or requestId (required).

---

## STEP 1 — Load pattern library

```
node scripts/diagnose.js --patterns
```

Review all graduated patterns before matching. Know what you are matching against.

---

## STEP 2 — Diagnose

- If requestId provided: `node scripts/diagnose.js --id=<requestId>`
- If error description provided: `node scripts/diagnose.js --match="<error description>"`
- If neither: `node scripts/diagnose.js --summary` then manually match against pattern library

---

## STEP 3 — Interpret result

**If KNOWN pattern:**
- Report: pattern name · domain · root cause · resolution steps
- Check if this module has had this pattern before — if yes, this is a regression
- If regression: escalate — determine why it regressed before proposing same fix again

**If UNKNOWN pattern:**
- Note the error type, module, approximate frequency
- Run: `node scripts/learn.js analyze` — does this match any untracked pattern class?
- Proceed to Step 3.5 with lower confidence baseline

---

## STEP 3.5 — PRECISION GATE (mandatory — do not skip)

Before proposing any fix or handing off to /cert-bug, output this block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRECISION GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Why this works   → [reason from matched pattern's rule/why field — not just "it fixes it"]
What could break → [side effects, cascade risks, or NONE]
Confidence       → [HIGH ≥0.8 · MEDIUM 0.5–0.8 · LOW <0.5]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Confidence is LOW → STOP. Do not proceed to cert-bug.**
Surface to human: "Confidence is LOW — this pattern is not well understood. Human decision required before any fix."

**Confidence is MEDIUM or HIGH → proceed to Step 4.**

---

## STEP 4 — Feed intelligence layer

```bash
node scripts/learn.js health
```

- Is the affected module already trending degrading?
- If this is the 2nd+ UNKNOWN occurrence of this error class: flag for promotion
  - Run: `node scripts/learn.js analyze` to add to pending patterns
  - Next: run `/cert-learn` to promote it into the graduated library

---

## STEP 5 — Log outcome

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="DIAGNOSE: result=[KNOWN/UNKNOWN] pattern=[name or none] module=[affected] confidence=[HIGH/MEDIUM/LOW] regression=[yes/no]"
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cert-diagnose                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result     KNOWN: {pattern name} | UNKNOWN
Confidence {HIGH | MEDIUM | LOW}
Regression {YES — escalated | NO}
Precision  Why: {reason} · Risk: {risk or NONE}
Next       {if HIGH/MEDIUM → /cert-bug to fix}
           {if LOW → human decision required first}
           {if 2nd+ UNKNOWN → /cert-learn to promote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

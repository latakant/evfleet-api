# /cortex-decide — Plain English Feature Intake
# Alias skill — routes to the appropriate full protocol based on input type.

$ARGUMENTS

---

## What this does

You describe what you want to build in plain English.
Cortex routes your request to the right protocol.

---

## Routing

**If you have a clear feature idea (ready to spec):**
→ Run `/cortex-intake "$ARGUMENTS"`
  Cortex asks 3–5 clarifying questions, then writes `ai/contracts/requirements.md` and a ticket breakdown.

**If you need to make an architectural decision (choose between approaches):**
→ Run `/cortex-decision "$ARGUMENTS"`
  Cortex documents the decision, options considered, and rationale to `ai/decisions/`.

**If unsure which to use:**
→ Describe the request in plain English here.
  Cortex will ask one question to route correctly.

---

## Quick rule

- Building something new → `/cortex-intake`
- Deciding between technical approaches → `/cortex-decision`
- Not sure → stay here, answer Cortex's question

---

## Completion

Output the routing decision and the command the user should run next.

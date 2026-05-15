╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-loop  |  v1.0  |  TIER: 5  |  BUDGET: ARCH        ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ governance                                           ║
║ AUTHORITY     ║ EXECUTOR                                             ║
║ CAN           ║ - Start an agentic loop for a bounded goal           ║
║               ║ - Read and surface loop state (--status)             ║
║               ║ - Handle escalation resume decisions (--resume A|B|C)║
║               ║ - Abort an active loop (--abort)                     ║
║               ║ - Execute plan steps with Cortex enforcement active  ║
║ CANNOT        ║ - Bypass PermissionResolver on any tool call         ║
║               ║ - Auto-bypass invariants on retry                    ║
║               ║ - Execute more than 3 retries on a single step       ║
║               ║ - Proceed past ESCALATED without human input         ║
║ REQUIRES      ║ - ai/STATE.json exists in project (state-loader.js)  ║
║               ║ - scripts/loop-engine.js                             ║
║               ║ - Goal must be achievable within project scope       ║
║ OUTPUTS       ║ - COMPLETE (all steps passed) or ESCALATED (human    ║
║               ║   decision required)                                  ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Agentic loop with bounded failure and memory. Claude executes. Cortex governs.
Every step is PermissionResolver-gated. Every failure is logged. Human decides on escalation.

$ARGUMENTS

Parse from $ARGUMENTS:
- `"<goal>"` — start a new loop with this goal (enters PLANNING)
- `--status` — show current STATE.loop contents
- `--resume A|B|C` — respond to escalation (A=redesign, B=skip, C=abort)
- `--abort` — force loop to IDLE immediately
- (no args) — show current status if loop is active, else show usage

---

## STEP 0 — Read loop state

```javascript
const loop = require('C:/luv/Cortex/scripts/loop-engine');
const { loadState, findProjectRoot } = require('C:/luv/Cortex/scripts/state-loader');

const projectRoot = findProjectRoot(process.cwd());
const state = loadState(projectRoot);
const loopState = state?.loop || { status: 'idle' };
```

Show current status:
```
Loop: [loopState.status] | Goal: [loopState.goal || '(none)'] | Step: [loopState.current_step]/[loopState.plan?.length || 0]
```

---

## STEP 1 — Route by argument

### --status
Display full STATE.loop object:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOOP STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:       [status]
Goal:         [goal]
Plan:         [plan.length] steps
Current step: [current_step] — [plan[current_step] || 'n/a']
Attempts:     [attempt_count] / 3 max
Domain:       [domain || 'unset']
Constraints:  [constraints_active.join(', ') || 'none']
Escalated:    [escalated]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
If failure_log has entries, show last 3:
```
Recent failures:
  [step attempt] [reason] → [fix_attempted]
```
STOP — do not continue to Step 2.

### --abort
If loop.status === 'idle': output "Loop is already idle." STOP.
Otherwise: call `loop.abort(projectRoot)`. Output: "Loop aborted. State reset to IDLE." STOP.

### --resume A|B|C
If loop.status !== 'escalated': output "No escalated loop to resume." STOP.

Decision A — Redesign:
- Call `loop.transition(projectRoot, 'planning')`
- Ask: "Describe the revised approach for step [current_step]: [plan[current_step]]"
- User provides new step description
- Replace plan[current_step] with new description in loop state
- Call `loop.transition(projectRoot, 'executing')`
- Proceed to STEP 3 (EXECUTING) for the redesigned step

Decision B — Skip:
- Log in failure_log: { reason: 'skipped by human', fix_attempted: 'manual override', escalated: true }
- Call `loop.advanceStep(projectRoot)` (moves to next step or COMPLETE)
- If more steps: proceed to STEP 3 (EXECUTING)
- If no more steps: output COMPLETE block

Decision C — Abort:
- Call `loop.abort(projectRoot)`
- Output: "Loop aborted by human decision. State reset to IDLE." STOP.

### "<goal>" — start new loop

If loop.status !== 'idle':
```
BLOCKED — loop already active (status: [status], goal: [goal])
Run /cortex-loop --abort to clear, or /cortex-loop --status to inspect.
```
STOP.

Proceed to STEP 2 (PLANNING).

---

## STEP 2 — PLANNING

Call: `loop.start(projectRoot, goal, domain, constraints)`

Identify domain from goal text (auth | orders | payments | products | users | ...):
- Look for module keywords in goal string
- When unclear: ask "Which primary domain does this goal touch? (auth / orders / payments / users / other)"

Identify active invariants from goal context:
- Mentions payments/webhooks → include I-04 (HMAC verification)
- Mentions multi-table writes → include I-03 ($transaction)
- Default minimum: ['I-01', 'I-02'] for all NestJS work

Show the plan to the user before executing:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOOP PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal:         [goal]
Domain:       [domain]
Constraints:  [constraints]
Max retries:  3 per step

Steps:
  1. [step description]
  2. [step description]
  3. [step description]
  ...

Failure boundaries:
  × score < 85 → ESCALATED
  × invariant violation × 3 → ESCALATED
  × domain bleed (write outside [domain]/) → ESCALATED

Proceed? (yes / revise / abort)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for confirmation. If "revise": collect changes, regenerate plan. If "abort": call `loop.abort(projectRoot)`, STOP.

Once confirmed:
- Call `loop.setPlan(projectRoot, planArray)`
- Call `loop.transition(projectRoot, 'executing')`
- Proceed to STEP 3.

---

## STEP 3 — EXECUTING

Read current step:
```javascript
const current = loopState.plan[loopState.current_step];
```

If failure_log has prior attempts for this step, show:
```
Step [n]: [current] (attempt [attempt_count + 1]/3)
Prior attempts:
  [attempt 1] [reason] → [fix_attempted]
  [attempt 2] [reason] → [fix_attempted]
Constraint [I-XX]: [invariant description] — non-negotiable.
```

Execute the step. During execution:
- PermissionResolver runs automatically on every Write/Edit/Bash call (pre-tool-use.js hook)
- Domain bleed (write outside loop.domain path) → PermissionResolver returns 'escalate' → ESCALATED
- Score drop below 85 → check before next step via `loop.checkBoundaries(projectRoot, { score })`

After step execution completes → STEP 4 (VALIDATING).

---

## STEP 4 — VALIDATING

Run Cortex invariant checks for the active constraints:

For each constraint in loop.constraints_active:
```
I-01 — cert-verify run: check that no --no-verify appears in any command
I-02 — scan generated files: grep for PrismaService in any Controller
I-03 — scan for multi-table writes: confirm $transaction wrapping
I-04 — scan for webhook handlers: confirm HMAC verification present
I-05 — scan for hardcoded secrets or .env files staged
```

Check boundaries:
```javascript
const boundary = loop.checkBoundaries(projectRoot, { score: state.score });
if (boundary.violated) → call loop.escalate(projectRoot, boundary.reason, boundary.code)
```

If ALL checks pass:
- Call `loop.advanceStep(projectRoot)`
- If more steps: go back to STEP 3 for next step
- If no more steps: STEP 5 (COMPLETE)

If a check fails:
- Record: `loop.recordFailure(projectRoot, reason, code, fixAttempted)`
- If returned `escalated: true` → STEP 6 (ESCALATED)
- If returned `escalated: false` → go back to STEP 3 (retry, same step)

---

## STEP 5 — COMPLETE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOOP COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal:     [goal]
Steps:    [plan.length] / [plan.length] complete
Domain:   [domain]
Duration: [started_at] → [completed_at]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Run /cert-commit to commit the output of this loop.

---

## STEP 6 — ESCALATED

Call: `formatEscalationBlock(loopState)` from loop-engine.js.
Output the escalation block verbatim. Wait for `/cortex-loop --resume A|B|C`.
Do NOT take any autonomous action. Human decides.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:    cortex-loop v1.0
GOAL:     [goal]
STATUS:   [COMPLETE | ESCALATED | ABORTED]
STEPS:    [current_step] / [plan.length]
NEXT →    /cert-commit (if COMPLETE) | /cortex-loop --resume A|B|C (if ESCALATED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

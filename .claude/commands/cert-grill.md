# /cert-grill — Pre-Implementation Plan Stress-Test
# skill: cert-grill | domain: governance | version: 1.0 | added: 2026-04-30
# Relentless sequential questioning of a plan before any code is written.
# Resolves every decision dependency. Outputs GO or NO-GO.
# Absorbed from: mattpocock/skills grill-me (Layer 1) → converted to Cortex-certified (Layer 4).

---

## TRIGGER

Use when:
- About to implement a feature touching 3+ files or 2+ modules
- The implementation approach feels "roughly clear" but not fully resolved
- Making an architectural decision with meaningful reversal cost
- Starting a new module, service, or domain boundary
- Resuming a feature after a context gap (new session, days between sessions)

Do NOT use for:
- Trivial changes: one-liner fixes, typo corrections, config updates
- Changes already approved through `/cert-feature` planning
- Pure refactors with no behaviour change (use `/cert-refactor` instead)

---

## THE CORE PRINCIPLE

```
The single most expensive mistake in software development is
building the wrong thing correctly.

Debugging bad code costs hours.
Rebuilding a wrong design costs days or weeks.

/cert-grill is a forcing function:
  Before your hands touch the keyboard, your MIND must have resolved:
    → What exactly is being built?
    → What are the 3 most likely failure points?
    → What simpler alternative was considered and rejected?
    → What assumptions am I making that could be wrong?
    → What will break when this ships?

A plan that survives grilling is ready to execute.
A plan that collapses under grilling needed more thought — not more code.
```

---

## EXECUTION

### STEP 0 — Plan Statement

The developer states the plan in plain language (3–5 sentences maximum):

```
What: [what is being built — specific, not vague]
Why:  [the problem it solves — one sentence]
How:  [the implementation approach — specific enough to disagree with]
Touches: [which files, modules, or services are affected]
```

If the plan cannot be stated in 3–5 sentences, it is not ready to be grilled — it needs to be written down first.

---

### STEP 1 — Codebase-First Resolution

Before asking the developer, examine the codebase to resolve any questions that the code can answer:

```
□ Does a similar pattern already exist? (where — cite file + line)
□ What does the current data shape look like at this boundary?
□ Are there existing tests covering adjacent behaviour?
□ Does the existing naming/vocabulary conflict with the proposed approach?
```

Cite specific files and line numbers. Do not speculate about the codebase when it can be read directly.

---

### STEP 2 — Decision Tree Traversal

Map the complete decision tree of the plan. Traverse it sequentially — one question at a time, never in bulk.

For each decision node:

```
Question:       [the specific unresolved decision]
Why it matters: [what goes wrong if this is resolved incorrectly]
Recommended:    [the recommended answer with brief reasoning]
```

Categories of decisions to traverse:

```
INTERFACE DECISIONS
  → What do callers pass in? What do they get back?
  → What errors are possible and how are they communicated?
  → What are the invariants the caller must respect?

DATA DECISIONS
  → What is the shape of the data at each stage?
  → Where does state live? Who mutates it?
  → What happens to existing data when this ships?

DEPENDENCY DECISIONS
  → What does this touch that could break?
  → Are there circular dependencies being introduced?
  → Are we adding a dependency where an existing one should be reused?

SEQUENCING DECISIONS
  → Can this be built incrementally, or is it all-or-nothing?
  → Is there a simpler first version that delivers 80% of the value?
  → What order do the pieces need to be built in?

FAILURE DECISIONS
  → What happens if the external call fails?
  → What is the retry / rollback behaviour?
  → How is this observable when it goes wrong in production?
```

Await the developer's response to each question before proceeding to the next.
When the developer's response conflicts with the codebase, surface the conflict directly.

---

### STEP 3 — Failure Point Audit

Name the 3 most likely points of failure for this plan:

```
Failure 1: [specific — not "it might not work"]
  Risk level:   HIGH / MEDIUM / LOW
  Mitigation:   [what reduces this risk]

Failure 2: [specific]
  Risk level:   HIGH / MEDIUM / LOW
  Mitigation:   [what reduces this risk]

Failure 3: [specific]
  Risk level:   HIGH / MEDIUM / LOW
  Mitigation:   [what reduces this risk]
```

---

### STEP 4 — Simpler Alternative Check

For every non-trivial design choice, name the simpler alternative and why it was rejected:

```
Proposed approach:  [what the plan proposes]
Simpler approach:   [what could achieve the same outcome with less complexity]
Rejected because:   [specific technical reason — not "it's not clean enough"]
```

If no simpler alternative exists or was considered → flag this. "I didn't consider an alternative" is a plan gap, not a design virtue.

---

### STEP 5 — Assumption Audit

Name every assumption the plan makes that could be wrong:

```
Assumption 1: [what is being taken for granted]
  If wrong:   [what breaks]
  Verify by:  [how to confirm before building]

Assumption 2: ...
Assumption 3: ...
```

---

### STEP 6 — GO / NO-GO

Evaluate the plan against this gate:

```
GO conditions (ALL must be true):
  □ Every decision node in Step 2 is resolved
  □ No HIGH-risk failure point has an unaddressed mitigation
  □ The simpler alternative was considered and explicitly rejected
  □ Every assumption is either verified or has a verification plan
  □ The first commit is clear and specific (not "start implementing X")

NO-GO conditions (ANY triggers NO-GO):
  ✗ Any decision node is unresolved or "we'll figure it out"
  ✗ A HIGH-risk failure point has no mitigation
  ✗ No simpler alternative was considered
  ✗ A critical assumption cannot be verified before building
  ✗ The scope creeps during grilling (plan grew — re-grill the new scope)
```

---

## OUTPUT FORMAT

```
CERT-GRILL COMPLETE
──────────────────────────────────────────
Plan grilled:          [one-line summary]
Decisions resolved:    [N total]
Failure points:        [HIGH: N · MEDIUM: N · LOW: N]
Assumptions verified:  [N / N total]
Simpler alternative:   [considered and rejected: reason / not applicable]

VERDICT: GO ✅  /  NO-GO ❌

If GO:
  First commit:  [specific — file + what changes]
  Watch for:     [the highest-risk failure point to monitor during build]

If NO-GO:
  Blocking issues: [list each unresolved item]
  Required before proceeding: [what must be resolved first]
──────────────────────────────────────────
```

---

## HARD INVARIANTS

```
NEVER proceed to code if the verdict is NO-GO.
  A NO-GO verdict means the plan has unresolved dependencies.
  Writing code on an unresolved plan multiplies rework cost by the number of
  files touched. Resolve the plan first — always.

NEVER ask multiple questions simultaneously.
  The value of grilling is sequential resolution — each answer informs the next question.
  Bulk questions allow bulk evasion. One question → one answer → next question.

NEVER skip the simpler alternative check.
  "I didn't consider a simpler approach" is not acceptable.
  Complexity always has a cost. If you cannot name the simpler approach you rejected,
  you may be building complexity by default, not by necessity.

NEVER grill a plan that hasn't been stated (Step 0).
  "Let's figure it out as we go" is not a plan.
  If the developer cannot state the plan in 3–5 sentences, the prerequisite is
  writing the plan — not starting the grill.

NEVER accept "we'll figure it out later" as a resolved decision.
  Deferred decisions are unresolved decisions.
  "Later" in a plan means "in production" in practice.
```

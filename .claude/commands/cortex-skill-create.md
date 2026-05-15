╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-skill-create  |  v1.0  |  TIER: 6  |  BUDGET: LEAN  ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 · L9                                              ║
║ AUTHORITY     ║ WRITER                                               ║
║ CAN           ║ - Read git log, existing skills, instincts.json     ║
║               ║ - Write new skill file to skills/[domain]/          ║
║               ║ - Append to skills/README.md                        ║
║ CANNOT        ║ - Auto-propagate (human must confirm + cp)          ║
║               ║ - Modify existing skills                            ║
║ WHEN TO RUN   ║ - After a session that invented a repeatable workflow ║
║               ║ - When the same task was done 2+ times manually     ║
║ OUTPUTS       ║ - Fully formed skill .md file · propagation command ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Generate a new Cortex skill from git history and session patterns.
Use when a workflow was performed manually and should be codified for future reuse.

$ARGUMENTS

Parse: `name` — skill name (kebab-case) · `domain` — target domain folder

---

## STEP 1 — Evidence Gathering

Read git log for the most recent 20 commits related to the task:
```bash
git log --oneline -20 --all
```

Read instincts.json — filter for instincts related to this task domain.

Ask: "What problem did this skill solve? Describe it in one sentence."
Ask: "What were the exact steps taken?"
Ask: "What invariants must always hold when running this?"

Write to `/tmp/skill-create-scratch.md`:
```
SKILL NAME:      [kebab-case]
DOMAIN:          [governance/dev/qa/devops/discovery/design/marketing]
PROBLEM:         [one sentence]
STEPS:           [ordered list from session]
INVARIANTS:      [what must always be true]
OUTPUT:          [what the skill produces]
TIER:            [1-9 — see tier scale below]
BUDGET:          [LEAN / MODERATE / FULL]
```

**Tier scale:**
- 1–2: Session entry/exit, zero-intelligence wrappers
- 3–4: Verification, analysis, read-only
- 5–6: Governance, learning, reporting
- 7–8: Code generation, documentation
- 9: Full orchestration, multi-skill compound

---

## STEP 2 — Skill Structure

Generate the skill file using this exact structure:

```markdown
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /[skill-name]  |  v1.0  |  TIER: [N]  |  BUDGET: [LEAN/MOD/FULL] ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ [L-numbers]                                          ║
║ AUTHORITY     ║ [OBSERVER / ANALYST / WRITER / ORCHESTRATOR]        ║
║ CAN           ║ - [what this skill is allowed to do]                ║
║ CANNOT        ║ - [hard limits]                                     ║
║ WHEN TO RUN   ║ - [trigger conditions]                              ║
║ OUTPUTS       ║ - [what it produces]                                ║
╚═══════════════╩══════════════════════════════════════════════════════╝

[One-paragraph description of what this skill does and why it exists.]

$ARGUMENTS

Parse: [argument name] — [description]

---

## STEP 1 — [First step name]

[Step content]

---

## STEP N — [Last step]

[Step content]

---

## COMPLETION BLOCK

\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /[skill-name]                   COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Key output line 1]
[Key output line 2]
Next       [recommended next skill]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
```

---

## STEP 3 — Quality Gate

Before writing the file, self-evaluate:

| Dimension | Score (1-5) | Rationale |
|-----------|-------------|-----------|
| Specificity | ? | Does it have concrete steps, not vague guidance? |
| Actionability | ? | Can someone follow this without asking questions? |
| Scope Fit | ? | Is the name, tier, and domain correct? |
| Non-redundancy | ? | Does an equivalent skill already exist? |
| Coverage | ? | Does it cover the happy path AND the main failure cases? |

Any score ≤ 2 → improve that dimension before writing.
All scores ≥ 3 → write the file.

---

## STEP 4 — Write + Register

Write skill file to: `skills/[domain]/[skill-name].md`

Add entry to `skills/README.md` in the correct domain table:
```
| `/[skill-name]` | [one-line description] |
```

Output propagation command:
```bash
cp skills/[domain]/[skill-name].md [project]/.claude/commands/[skill-name].md
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-skill-create            COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skill      skills/[domain]/[name].md
Quality    [total]/25 · all dimensions ≥ 3
Next       cp skills/[domain]/[name].md [project]/.claude/commands/
           Then: /cert-verify to confirm no regressions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

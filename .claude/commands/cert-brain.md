╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-brain  |  v1.0  |  TIER: 2  |  BUDGET: LEAN         ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ governance                                           ║
║ AUTHORITY     ║ DISTILLER                                            ║
║ CAN           ║ - Read all ai/ project docs                         ║
║               ║ - Distill into one token-compressed BRAIN.md        ║
║               ║ - Update BRAIN.md when state changes                ║
║               ║ - Session start: load BRAIN.md instead of 5+ files  ║
║ CANNOT        ║ - Replace source files (BRAIN.md is a read layer)   ║
║               ║ - Make decisions (distills, does not invent)        ║
║               ║ - Be more than 120 lines                            ║
║ WHEN TO RUN   ║ - After initial PRD+ARD+lifecycle docs exist        ║
║               ║ - When any source doc is significantly updated      ║
║               ║ - When session context is tight (load BRAIN first)  ║
║ OUTPUTS       ║ - ai/BRAIN.md (max 120 lines, maximum signal density)║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-brain — Project Memory Compression.

The gap this fills:
  A project with 5+ planning docs (PRD, ARD, lifecycle, UX, tracker) burns
  context window loading everything. BRAIN.md is the distilled signal —
  100 lines that contain 80% of what any session needs.
  Load BRAIN first. Drill into source files only when needed.

Pattern name: Murmur Distillation
  Named for the pattern of taking high-volume input and producing a
  low-volume, high-fidelity summary that preserves the essential signal.
  Like a murmur hash: compress without losing what matters.

---

## INPUT PARSING

Parse from $ARGUMENTS:
- Project docs to read (default: all files in ai/ directory)
- `--update` — regenerate BRAIN.md from current state of source docs
- `--phase <phase>` — tag the current phase (0/1/2/3) for phase-aware summary
- `--focus <area>` — emphasize one area (e.g. payments, lifecycle, UX)

If ai/BRAIN.md already exists: read it first, then check for updates in source docs.
If source docs changed since last BRAIN.md: add "⚠️ STALE — regenerate with /cert-brain --update"

---

## STEP 1 — Read Project State

Read these files (in priority order, stop when context is sufficient):
1. `ai/BRAIN.md` — if exists, note last generated date
2. `ai/PRD.md` — problem, users, phases, features, open decisions
3. `ai/ARD.md` — architecture decisions, data model, API surface, stack
4. `ai/ORDER-LIFECYCLE.md` or equivalent lifecycle doc
5. `ai/STATUS.md` — if exists (Cortex-governed projects)
6. `ai/UX-FLOWS.md` — UX flows, critical moments
7. `ai/PROJECT_INTELLIGENCE.md` — if exists (gaps, Cortex analysis)

Extract the signal. Ignore the prose.

---

## STEP 2 — Identify What Must Be In BRAIN.md

Every BRAIN.md must contain these sections (in order, as compact as possible):

```
1. WHAT IT IS         — one sentence. What does this product do?
2. PHASE NOW          — current phase + gate condition
3. STACK              — tech choices, one line
4. ROLES              — who are the actors?
5. CORE LIFECYCLE     — state machine in 5 lines max (→ source file for detail)
6. MONEY RULES        — payment triggers, amounts, edge cases
7. PRICING WINDOW     — viable price range + why it's constrained
8. OPEN DECISIONS     — what is unresolved and blocking
9. CRITICAL UX RULES  — the 5 UX decisions that change conversion
10. GAPS TO FIX       — HIGH/MED/LOW before next phase
11. DATA MODEL        — models as one-liners (no field lists — link to source)
12. API SURFACE       — endpoint count + modules (no full table — link to source)
13. EXPANSION         — city/feature/scale roadmap (one line per phase)
14. FILES             — drill-down guide (which file answers which question)
```

Not all projects have all sections. Include what exists. Skip what doesn't apply.

**Hard limit: 120 lines maximum.**
If a section needs more than 5 lines, it belongs in a source file, not BRAIN.md.

---

## STEP 3 — Write BRAIN.md

Write to `ai/BRAIN.md`:

```markdown
# [PROJECT NAME] — PROJECT BRAIN
# Token-compressed context. Load this first. Skip all other ai/ files unless drilling down.
# Generated: [ISO date] | [Score if validated] | Phase: [current]

---

## WHAT IT IS
[one sentence — what the product does]

## PHASE NOW
[current phase + what is being done + gate condition]

## STACK (Phase N — [status: built/planned])
[tech on one line: Framework + DB + Cache + Frontend + key integrations]

## ROLES
[actor → what they do · earned/paid]

## [CORE LIFECYCLE NAME] (N states)
[state flow diagram in 3–5 lines — link to source file for detail]

## MONEY RULES
[bullet list — triggers, amounts, edge cases, constraints]

## PRICING WINDOW
[viable range + lower bound reason + upper bound reason]

## OPEN DECISIONS (blocking next phase)
[decision: current status or recommended resolution]

## CRITICAL UX RULES
[the decisions that directly impact conversion — bullet list]

## GAPS TO FIX BEFORE PHASE N
[HIGH/MED/LOW labels — one line per gap]

## DATA MODEL (core)
[model(key,fields) — one line per model — link to schema for full detail]

## API SURFACE (N endpoints, N modules)
[module: endpoint list one-liner — link to full table]

## EXPANSION
[Phase → city/feature/scale — one line per phase]

## FILES (drill-down)
[filename → what question it answers]
```

---

## STEP 4 — Staleness Guard

After writing, log the source files and their modification dates:

```markdown
## BRAIN FRESHNESS
Generated from:
  PRD.md      — [date]
  ARD.md      — [date]
  [other files] — [date]
Regenerate with: /cert-brain --update
```

If source file is newer than BRAIN.md → prepend `⚠️ STALE — regenerate` to BRAIN.md header on next read.

---

## STEP 5 — Session Load Protocol

When starting any new session on a project with BRAIN.md:

```
LOAD ORDER (token-efficient):
  1. Read BRAIN.md (max 120 lines — always load this)
  2. Read source files ONLY when the task requires them:
     - Implementing payment flow? → ORDER-LIFECYCLE.md
     - Building a UI screen? → UX-FLOWS.md
     - Writing DB migration? → ARD.md data model section
     - Checking project status? → STATUS.md or PROJECT_INTELLIGENCE.md
  
Do NOT load all ai/ files at session start.
BRAIN.md + the one relevant source file = sufficient for 80% of tasks.
```

---

## MURMUR PATTERN (Cortex Intelligence Pattern #13 — candidate)

Named for MurmurHash: high-throughput, low-collision compression.
Applied to project context: distill many docs → one signal-dense summary.

**When to apply:**
- Project has 3+ planning docs (PRD + ARD + lifecycle minimum)
- Session context will be shared with implementation work (leaves little room for docs)
- Project is pre-build (docs are the project state, not code)

**When NOT to apply:**
- Project has a codebase — use /cortex-discover for code-level intelligence
- BRAIN.md would just duplicate STATUS.md — skip if STATUS.md is already lean
- Project is < 1 week old with only 1–2 docs — too early for distillation

**Refresh trigger:**
- Any source doc changes more than 20% of its content
- Open decisions get resolved (BRAIN.md must reflect the decision)
- Phase changes (Phase 0 → Phase 1 = full regeneration)

---

## LOG

```bash
node scripts/lifecycle.js log --action=INSIGHT --module=cortex \
  --detail="BRAIN_GENERATED: project=[name] lines=[N] sources=[N files] phase=[N]"
```

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cert-brain v1.0
STATUS:     COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File:       ai/BRAIN.md written ([N] lines)
Sources:    [N] files read
Phase:      [current phase]
Refresh:    /cert-brain --update when source docs change
Pattern:    Murmur Distillation (P13 candidate)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next:
  Session start → load BRAIN.md first
  Phase change → /cert-brain --update
  Source doc updated → /cert-brain --update
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

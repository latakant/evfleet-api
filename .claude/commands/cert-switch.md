╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-switch  |  v1.0  |  TIER: 1  |  BUDGET: LEAN        ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 (Intent) + L2 (Context)                          ║
║ AUTHORITY     ║ ORCHESTRATOR                                         ║
║ CAN           ║ - Read CLAUDE.md of target project                   ║
║               ║ - Read ai/STATUS.md of target project                ║
║               ║ - Summarise what changes between projects            ║
║ CANNOT        ║ - Switch without human confirmation                  ║
║               ║ - Skip the permission prompt, ever                   ║
║ WHEN TO RUN   ║ - Manually when changing working directory           ║
║               ║ - Auto-triggered by cortex-project-guard hook        ║
║ OUTPUTS       ║ - Project diff summary · Permission prompt           ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-switch v1.0 — Controlled project context handoff.

PRINCIPLE
─────────────────────────────────────────────────────────────────────────
One Cortex instance per terminal per project.
Context bleeding between projects causes wrong stack rules, wrong invariants,
wrong conventions — silent mistakes that are hard to catch.
This command makes the switch explicit and human-approved.

WHERE THIS FILE LIVES
─────────────────────────────────────────────────────────────────────────
Source (one truth):   C:\luv\Cortex\skills\cert-switch.md
Installed per project: [project]/.claude/commands/cert-switch.md
─────────────────────────────────────────────────────────────────────────

---

## STEP 1 — DETECT SWITCH

Read the current working directory. Find the nearest `CLAUDE.md` by walking up
the directory tree. That directory is the **target project root**.

If no CLAUDE.md is found → output:
```
No CLAUDE.md found in current path.
This does not appear to be a Cortex-governed project.
Proceed without Cortex context? [yes/no]
```
And wait for human reply.

---

## STEP 2 — SURFACE THE DIFF

Read:
- `[target]/CLAUDE.md`
- `[target]/ai/STATUS.md` (if exists)

Produce a compact diff table:

```
╔══════════════════════════════════════════════════════════╗
║  PROJECT SWITCH DETECTED                                 ║
╠══════════════════════════════════╦═══════════════════════╣
║  From (previous context)         ║  [previous project name or "unknown"]
║  To   (new project)              ║  [target project name]
╠══════════════════════════════════╬═══════════════════════╣
║  Path                            ║  [target project root path]
║  Stack                           ║  [from CLAUDE.md §0 SNAPSHOT]
║  Status                          ║  [from STATUS.md score/phase, or "pre-build"]
║  Cortex version                  ║  [from CLAUDE.md governance section]
║  Key invariants                  ║  [top 3 from CLAUDE.md §5 or INVARIANT_MEMORY]
╚══════════════════════════════════╩═══════════════════════╝
```

---

## STEP 3 — ASK PERMISSION

Output exactly:

```
Load [project name] context and replace current session context?

  → yes   — switch now, run /start for [project name]
  → no    — stay in current context, do not switch
  → diff  — show full CLAUDE.md before deciding
```

**HARD RULE: Do not proceed with any work until the human replies.**
Do not assume "yes". Do not start coding. Just wait.

---

## STEP 4 — ON APPROVAL

If human says **yes**:
1. Acknowledge: "Switched to [project name]. Running session orientation…"
2. Immediately execute `/start` for the new project context.
3. Store the new project root in `~/.claude/cortex-last-project` (via Bash tool).

If human says **no**:
1. Acknowledge: "Staying in [previous project] context."
2. Note: "You are physically in [target path] but working with [previous] rules."
3. Do nothing else.

If human says **diff**:
1. Display full `CLAUDE.md` content.
2. Return to Step 3.

---

## USAGE

```bash
# Manual invocation
/cert-switch

# Called automatically by cortex-project-guard hook when cwd changes project root
```

╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-compact  |  v8.0  |  TIER: 5  |  BUDGET: LEAN      ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L9                                              ║
║ AUTHORITY     ║ OBSERVER                                             ║
║ CAN           ║ - Read session-state.json, TRACKER.md               ║
║               ║ - Write current work state to ai/state/             ║
║               ║ - Suggest compaction timing                         ║
║               ║ - Run /compact with summary                         ║
║ CANNOT        ║ - Modify source code                                ║
║               ║ - Auto-compact without user awareness               ║
║ REQUIRES      ║ - MASTER.md loaded                             ║
║ OUTPUTS       ║ - Compaction decision + state snapshot              ║
║               ║ - Completion block (COMPACT NOW or CONTINUE)        ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Strategic context compaction. Unlike auto-compact (which fires at arbitrary points),
this skill compacts at LOGICAL phase boundaries — preserving the right state
and ensuring Claude picks up exactly where you left off.

Run when: context is getting heavy, a phase just completed, or you're switching tasks.

---

## WHY STRATEGIC OVER AUTO-COMPACT

Auto-compact fires based on token count — it doesn't know if you're mid-function
or mid-thought. Strategic compaction fires at phase transitions:

```
Research complete → COMPACT (clean state, no active work lost)
Plan approved    → COMPACT (implementation phase starts fresh)
Bug fixed        → COMPACT (debugging context no longer needed)
Feature done     → COMPACT (start next feature with clean context)
Mid-function     → DO NOT COMPACT (work would be lost or corrupted)
```

**The rule:** Compact BETWEEN phases, never WITHIN a phase.

---

## DECISION GUIDE — WHEN TO COMPACT

| Situation | Compact? | Why |
|-----------|----------|-----|
| Research → Planning | YES | Research context no longer needed |
| Planning → Implementation | YES | Plan is in files, context is cheap overhead |
| Implementation → Testing | MAYBE | Keep if tests reference complex impl context |
| Bug diagnosed → fix ready | YES | Diagnosis context done — clean start for fix |
| Mid-function writing | NO | Would lose active work state |
| Mid-migration | NO | Schema context needed throughout |
| Mid-debugging (not solved) | NO | Context is the investigation trail |
| End of session | YES | Save state, fresh next session |
| After cortex-verify CLEAN | YES | Good checkpoint — everything verified |
| After cortex-commit | YES | Natural phase end |

**Threshold:** After 10+ tool calls in a single phase, consider whether compaction
makes sense before starting the next phase. See P30 CONTEXT DECAY.

---

## STEP 1 — ASSESS

Before compacting, answer:

1. **Are we at a phase boundary?** (research done, plan approved, feature committed)
   - YES → proceed to Step 2
   - NO → do not compact, continue working

2. **Is there active in-progress work that would be lost?**
   - Open files being edited → write them first
   - Partial implementation → finish the function, then compact
   - Uncommitted changes → commit or save state first

3. **What does the next phase need to know?**
   - This is what you write to `session-state.json` before compacting

---

## STEP 2 — WRITE STATE (before compact)

Write current state to `ai/state/session-state.json`:

```json
{
  "session_date": "2026-03-01",
  "last_session_domains": ["search", "products"],
  "role_activations_this_session": ["dev-backend-endpoint"],
  "pending_pa_reviews": 0,
  "last_handoff": "Search ranking implemented and verified (cortex-verify CLEAN). Next: write integration tests for search service then cortex-commit."
}
```

**The `last_handoff` field is critical** — this is what Claude reads at the START of the next session (or after compact) to understand exactly what to do next. Be specific:

```
BAD:  "Working on search feature"
GOOD: "search.service.ts findProducts() implemented. Pending: unit test for empty query edge case. Then: cortex-commit feat(search): add product search ranking"
```

---

## STEP 3 — COMPACT

Run: `/compact`

With a summary message:
```
/compact — Phase complete: [what was done]. Next phase: [what comes next].
Key context: [1-2 things Claude must remember after compact].
```

Example:
```
/compact — Phase complete: search ranking algorithm implemented + cortex-verify clean.
Next phase: write unit tests for search.service.ts (findProducts, empty query, typo handling).
Key context: search uses Prisma full-text search on Product.name + Product.description fields.
```

---

## WHAT SURVIVES COMPACTION

After compact, Claude retains:
- `CLAUDE.md` — project context (always loaded)
- `.claude/commands/` — all skills still available
- `ai/state/session-state.json` — your handoff note
- `ai/state/precompact-state.json` — timestamp of compact event
- `ai/TRACKER.md` — session log
- Git state — all committed work preserved

Claude does NOT retain:
- Previous conversation messages
- Tool call results from before compact
- Diagnostic context from debugging sessions
- The "why" behind decisions made before compact

**Write the "why" to session-state.json before compacting.** Anything important
that exists only in conversation memory will be lost.

---

## STEP 4 — RESUME

After compact (or at next session start), Claude reads `session-state.json`
and continues from `last_handoff` exactly.

To verify resume state:
```
/start
```
This loads MASTER + session-state + DOMAIN_MEMORY and confirms what's next.

---

## AUTOMATIC SUGGESTIONS (PreCompact hook)

The PreCompact hook in cortex-learn's hook setup writes to `precompact-state.json`
when Claude Code auto-compacts. After returning from auto-compact:

```bash
cat ai/state/precompact-state.json
# {"timestamp": "2026-03-01T10:32:00Z", "note": "Context compacted — check ai/state/session-state.json for last handoff"}
```

If auto-compact fired mid-task:
1. Read `session-state.json` for last known state
2. Check `ai/TRACKER.md` for today's entries
3. Run `git status` to see what files were being modified
4. Resume from there

---

## COMPACTION PATTERNS BY WORKFLOW

### Pattern 1: Plan → Build → Commit
```
/start        (load context)
... planning ...
/cortex-prd            (plan written to file)
→ COMPACT HERE (plan is in file, context no longer needed)
... implementation ...
/cortex-verify         (CLEAN)
→ COMPACT HERE (verify done, clean for commit)
/cortex-commit         (commit)
→ COMPACT HERE (natural end of feature)
```

### Pattern 2: Debug → Fix
```
/dev-backend-debug     (diagnosis)
... investigation ...
Root cause identified, fix clear
→ COMPACT HERE (write root cause to session-state, compact diagnosis context)
... fix implementation ...
/cortex-verify         (CLEAN)
/cortex-commit
```

### Pattern 3: Large Feature (3+ domains)
```
/cortex-task           (spawns sub-agent for isolation — preferred)
OR
Domain 1 done → COMPACT
Domain 2 done → COMPACT
Domain 3 done → COMPACT
/cortex-parallel verify (final verification)
```

---

## COMPLETION

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-compact              COMPACT NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase      {phase just completed}
State      Saved to session-state.json
Handoff    "{last_handoff content}"
Next       /compact → then /start to resume
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-compact               CONTINUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reason     {why compaction not recommended now}
Risk       {what would be lost}
Next       Finish {current task} → then compact
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

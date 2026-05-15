╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-feature-status  |  v1.0  |  TIER: 1  |  LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 (Intent) · L9 (Feedback)                        ║
║ AUTHORITY     ║ READ-ONLY                                           ║
║ CAN           ║ - Read feature progress from orchestrator          ║
║               ║ - Show step-by-step status for any feature         ║
║               ║ - Identify which step to resume next session       ║
║ CANNOT        ║ - Modify feature or step status                    ║
║               ║ - Write any code                                   ║
║ WHEN TO RUN   ║ - Session start when a multi-session feature is    ║
║               ║   in progress                                      ║
║               ║ - When user asks "what's done" or "where are we"   ║
║               ║ - Before resuming a feature mid-way                ║
║ OUTPUTS       ║ - Feature progress board · Next step to run        ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Feature Progress Engine — shows execution state of any active feature chain.

Reads from the CORTEX Orchestrator SQLite DB at localhost:7391 when running.
Falls back to `ai/TRACKER.md` when orchestrator is offline.

$ARGUMENTS

Parse from $ARGUMENTS:
- `[feature-name or id]` — show specific feature (partial name match)
- `--all` — show all features including completed
- `--project <name>` — filter by project name
- (no args) — show all active features for current project

---

## STEP 1 — Read current project

Identify project name from:
1. `ai/context/metadata.json` → project field
2. `package.json` → name field
3. Fallback: ask user "Which project?"

---

## STEP 2 — Fetch from orchestrator

If specific feature requested:
```
GET http://localhost:7391/features?project={project}&status=active
```
Then find matching feature by name (case-insensitive partial match).

If `--all`:
```
GET http://localhost:7391/features?project={project}
```

If `--project` override: use that project name instead.

If orchestrator is not running:
```
⚠️  Orchestrator offline — reading from local files.
```
Fallback: read `ai/TRACKER.md` last 20 lines to reconstruct feature progress.
Look for entries matching the feature name. If found, render them as the feature board
using the same format below. Note "Source: TRACKER.md (orchestrator offline)" in the output.
If not found in TRACKER: output "No local records found — start orchestrator for full history."

---

## STEP 3 — Output feature board

For each feature found, output this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE: [feature name]
Project: [project]  |  Intent: [FULL/BUILD/DESIGN/etc.]
Status:  [🟢 active | ✅ completed | 🔴 blocked | ⬜ abandoned]
Progress: [completed_steps]/[total_steps] steps done
Started:  [created_at]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEPS
─────────────────────────────────────────────────────
Step 1  ✅  /[skill-name] [args]
            [output_summary if exists]
            Done: [completed_at]

Step 2  ✅  /[skill-name] [args]
            [output_summary if exists]

Step 3  ⏳  /[skill-name] [args]    ← IN PROGRESS
            Session: [session_id]

Step 4  ⬜  /[skill-name] [args]    ← PENDING
Step 5  ⬜  /[skill-name] [args]    ← PENDING
─────────────────────────────────────────────────────
NEXT STEP TO RUN:
  /[skill-name] [args]

RESUME COMMAND:
  Run the next step above to continue this feature.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Step status icons:
- ✅ done
- ⏳ in_progress
- ⬜ pending
- 🔴 blocked
- ➖ skipped

---

## STEP 4 — Summary across all features

If multiple features shown, add a summary at the end:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY — [project]
Active:     [N] features in progress
Blocked:    [N] features blocked
Completed:  [N] features done

HIGHEST PRIORITY (resume this first):
  → [feature name] — Step [N]: /[skill] [args]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 5 — No features found

If no active features exist for the project:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No active features tracked for: [project]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To start tracking a feature, use:
  /cortex-intent "your feature request"

The intent engine will save the execution chain
automatically before running it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Integration

| Use case | Command |
|---|---|
| Start of session — check what's in progress | `/cortex-feature-status` |
| Resume a specific feature | `/cortex-feature-status "auth system"` |
| See all including done | `/cortex-feature-status --all` |
| Start a new tracked feature | `/cortex-intent "your request"` |
| Mark current step done | `/cortex-intent` marks steps automatically |

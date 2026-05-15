╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-patterns  |  v1.0  |  TIER: 2  |  BUDGET: LEAN   ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 (Learning) · L8 (Cross-project Intelligence)     ║
║ AUTHORITY     ║ ADVISOR                                             ║
║ CAN           ║ - Query orchestrator shared pattern library         ║
║               ║ - Find known fixes for current error/symptom       ║
║               ║ - Show patterns from other projects                ║
║               ║ - Apply a shared pattern to local diagnose.js      ║
║ CANNOT        ║ - Promote new patterns (use /cert-learn instead)   ║
║               ║ - Modify source code directly                      ║
║ WHEN TO RUN   ║ - When debugging an unknown error                  ║
║               ║ - Before starting a new domain (find prior art)    ║
║               ║ - At session start to check for new shared knowledge║
║ OUTPUTS       ║ - Pattern list · Relevance scores · Apply option   ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-patterns — queries the cross-project shared pattern library.

The problem it solves:
  Each project runs /cert-learn to promote patterns locally.
  Without sharing, TailorGrid fixes the same NestJS bug Exena fixed last week.
  With the orchestrator shared library: one fix = known everywhere.

$ARGUMENTS

Parse from $ARGUMENTS:
- `query "<symptom or error>"` — find patterns matching a description
- `query --module <module>` — find all patterns for a module type
- `query --project <name>` — find all patterns shared by a specific project
- `query --tag <tag>` — filter by tag (e.g. "nestjs", "prisma", "payments")
- `list` — show all patterns in the shared library (paginated, latest 20)
- `apply <pattern-id>` — pull a pattern into local scripts/diagnose.js
- `stats` — show library stats (total patterns, top contributors, top tags)

---

## STEP 1 — Check orchestrator

```
GET http://localhost:7391/health
```

Offline path:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Pattern Library Query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Check orchestrator
→ GET http://localhost:7391/health
✗ No response — OFFLINE

[2/3] Execute query
• Skipped — orchestrator not available

[3/3] Format results
• Skipped

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : FAILED at step 1/3
Reason : Orchestrator offline
Fix    : Run /cortex-server start, then retry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
Stop here if offline.

Online path:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Pattern Library Query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Check orchestrator
→ GET http://localhost:7391/health
✓ Online — [N] patterns in library

[2/3] Execute query "[symptom]"
→ Full-text search across description, errorClass, fixApproach, tags
✓ [N] matches found (confidence ≥ 0.7 shown first)

[3/3] Format results
✓ Ready
```

Results table follows below.

---

## STEP 2 — Execute query

### Mode: `query "<symptom>"`

```
GET http://localhost:7391/patterns?q=<url-encoded-symptom>&limit=10
```

The orchestrator performs full-text search across:
- pattern description
- errorClass
- fixApproach
- module
- tags

Returns patterns ordered by relevance score (0.0–1.0).

### Mode: `list`

```
GET http://localhost:7391/patterns?sort=promotedAt&order=desc&limit=20
```

### Mode: `apply <pattern-id>`

```
GET http://localhost:7391/patterns/<id>
```

Pull the pattern definition. Merge it into local `scripts/diagnose.js`:
- Add the pattern to the KNOWN_PATTERNS array
- Increment local pattern count
- Log the merge: `cortex-learn log --action=PATTERN_IMPORTED --id=<id>`

---

## STEP 3 — Output results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX PATTERNS — Shared Library
Query: "[symptom]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found [N] patterns  (confidence >= 0.7 shown first)

[id]  [description]
  Project:     [which project promoted this]
  Module:      [module type]
  Error class: [what triggers this]
  Fix:         [one-line fix approach]
  Confidence:  [0.0–1.0] · Evidence: [N occurrences]
  Tags:        [tag list]
  Promoted:    [date]
  ─────────────────────────────────────
  → Apply this pattern: /cortex-patterns apply [id]

[id]  [next pattern...]
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[N] patterns shown · [total] in library
To apply all matching: /cortex-patterns apply [id] for each
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If no results:
```
No patterns found matching "[symptom]".
This may be a new error type — fix it and run /cert-learn to add it.
```

---

## STEP 4 — Apply mode output

When `apply <id>` is used:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN APPLIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pattern:  [id] — [description]
Source:   [project] (promoted [date])
Applied:  scripts/diagnose.js — KNOWN_PATTERNS updated
Effect:   This error class will now resolve in ~30 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 5 — Stats mode output

When `stats` is used:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARED PATTERN LIBRARY — Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total patterns:    [N]
Active projects:   [N] (contributed at least 1 pattern)

Top contributors:
  [project]   [N] patterns
  [project]   [N] patterns

Top tags:
  [tag]       [N] patterns
  [tag]       [N] patterns

Recently promoted (last 7 days):
  [id]  [description]  ([project])
  ...

Local coverage: [N] local patterns applied from shared library
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Integration points

| Triggered by | When |
|-------------|------|
| `/cert-learn` Step 4.5 | After promoting patterns — pushes to shared library |
| `/cortex-bug` | Before starting debug — queries library for known fix |
| `cert-session` Step 1E | Counts local patterns, notes if shared library has more |
| Manual | Developer wants to check if a bug is already known |

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Duration: Xs
Next   : /cortex-patterns apply <id>  — pull a pattern locally
         /cert-learn  — promote new local patterns to share
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode     [query | list | apply | stats]
Found    [N] patterns
Applied  [N locally | none]
Library  [N total] patterns across [N] projects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

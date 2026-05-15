╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /start  |  v3.2  |  TIER: 1  |  BUDGET: LEAN             ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ REPLACES      ║ /cert-session · /cortex-session (both deprecated)   ║
║ AUTHORITY     ║ ORCHESTRATOR                                         ║
║ CAN           ║ - Read CORTEX global registry                       ║
║               ║ - Auto-detect project from CWD                      ║
║               ║ - Start orchestrator silently                       ║
║               ║ - Load project context (score, last session, laws)  ║
║               ║ - Show 2-level work menu (Dev / Design / Review / Research) ║
║               ║ - Switch context: backend / frontend / global       ║
║               ║ - Show design status board                          ║
║               ║ - Start lifecycle trace                             ║
║               ║ - Accept mode arg: /start dev · review · research   ║
║ CANNOT        ║ - Write code · Modify project files                 ║
║ WHEN TO RUN   ║ - First command of every session, no exceptions     ║
║ PAIRED WITH   ║ /end — run at session close                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/start — One command to begin any session on any project.
v3.2 adds: Pattern Intelligence block (STEP 3.6) — learning loop state visible every session.
v3.1 added: context modes (dev/review/research) — skip menu, load only what you need.
v3.0 added: global registry awareness + 2-level work menu (Development / Design)

---

## STEP 0 — Cortex Health Token (Cortex framework sessions only)

**Only runs when CWD is the Cortex framework itself** (contains HEALTH.md in root).
Skip entirely when working on any project that uses Cortex — not relevant there.

```bash
# Detect if this is a Cortex framework session
[ -f "HEALTH.md" ] && grep -m1 "^CORTEX-" HEALTH.md 2>/dev/null
```

Read `HEALTH.md`. Check the TOKEN line:

```
CORTEX-HEALTHY-*   → ✅ proceed — framework is stable
CORTEX-DEGRADED-*  → ⚠️ note failing checks — proceed with caution, fix before commit
CORTEX-ALARM-*     → 🚫 stop — fix all failing checks before any other work
```

Check the date in the token:
- ≤ 7 days old → trust it, proceed
- > 7 days old → re-verify all 8 checks in HEALTH.md, update token before proceeding

If HEALTHY + recent:
```
✅ CORTEX HEALTH: HEALTHY · v14.0 · [date] · 18/18 checks
```

If ALARM or DEGRADED: surface the failing checks, apply the ALARM RESPONSE protocol from HEALTH.md.

**Do not invent status.** Read the file. The token is only valid if it was verified.

---

## CORTEX_ROOT Resolution

Before reading any Cortex framework file, resolve the root path:

```bash
# 1. Use environment variable if set
CORTEX_ROOT="${CORTEX_ROOT:-}"
# 2. Walk up from CWD until REGISTRY.json is found
if [ -z "$CORTEX_ROOT" ]; then
  d=$(pwd)
  while [ "$d" != "/" ] && [ "$d" != "." ]; do
    [ -f "$d/REGISTRY.json" ] && CORTEX_ROOT="$d" && break
    d=$(dirname "$d")
  done
fi
# 3. Fallback
CORTEX_ROOT="${CORTEX_ROOT:-$HOME/.cortex}"
```

All paths below use `$CORTEX_ROOT`. Never hardcode `C:/luv/Cortex`.

---

## STEP 0.1 — Infrastructure Validation (v18.0+)

**Runs for every project session (not Cortex framework sessions).**
Validates the enforcement infrastructure is in place. Silent on pass. Reports gaps.

Check these 4 files exist in the project:

```
ai/core/MASTER.md           → governance constitution
ai/contracts/permissions.md → write scope enforcement
ai/BRAIN.md                 → session context (replaces STATUS.md for orientation)
```

And that the Cortex scripts are accessible:
```bash
node "$CORTEX_ROOT/scripts/cortex-executor.js" start --task "__validate__" 2>/dev/null
```

Output:
```
INFRASTRUCTURE CHECK
  ai/core/MASTER.md         ✅ / ❌ MISSING — run: cp $CORTEX_ROOT/core/MASTER.md ai/core/
  ai/contracts/permissions.md ✅ / ❌ MISSING — run: node $CORTEX_ROOT/installers/create-permissions.js --project .
  ai/BRAIN.md               ✅ / ❌ MISSING — run: node $CORTEX_ROOT/installers/create-brain.js --project .
  cortex-executor.js        ✅ / ❌ NOT FOUND
```

If all present → silent pass, continue to STEP 0.5.
If any missing → show INFRASTRUCTURE CHECK block, continue (WARN not BLOCK — project still usable).

---

## STEP 0.5 — Mode Detection (v3.1)

Parse `$ARGUMENTS` before any context loading:

| Argument   | Mode        | Effect                                                  |
|------------|-------------|---------------------------------------------------------|
| `dev`      | DEVELOPMENT | Skip Level 1 menu — jump to Layer selection (Level 2A)  |
| `review`   | REVIEW      | Skip all menus — go straight to Review context          |
| `research` | RESEARCH    | Skip all menus — go straight to Research context        |
| (none)     | INTERACTIVE | Show full menu (existing v3.0 behavior — no change)     |

```
MODE=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | xargs)
# MODE is empty, "dev", "review", or "research"
```

If mode is `review` or `research`: skip STEP 4C (adapter loading) — these modes load zero adapters by design. Token savings: ~2K per session.

If mode is unrecognised (not empty, not a known mode): treat as INTERACTIVE and note:
```
⚠️ Unknown mode "[arg]" — showing full menu. Valid: dev · review · research
```

---

## STEP 1 — Read Global Registry

```bash
cat "$CORTEX_ROOT/REGISTRY.json" 2>/dev/null
```

This tells CORTEX:
- All known projects and their paths
- Each project's CORTEX version, score, last session
- Which repos belong to which product

If registry missing → skip silently, continue with local detection only.

---

## STEP 2 — Detect Current Project

```bash
cat CLAUDE.md 2>/dev/null | head -5
cat package.json 2>/dev/null | grep '"name"' | head -1
```

Match CWD against registry paths to find the current project entry.
If matched → load its registry data (version, score history, repos).
If not matched → auto-detect from CLAUDE.md + add to registry at session end.

---

## STEP 3 — Start Orchestrator (silent)

```bash
curl -s http://localhost:7391/health --max-time 1
```

- Online → note "✅ online" and skip start
- Offline → start silently:
  ```bash
  node "$CORTEX_ROOT/scripts/cortex-server.js" start --bg
  # wait 1s then re-check
  sleep 1 && curl -s http://localhost:7391/health --max-time 1
  ```
- Still offline after start attempt → note "⚠️ offline — local only" (non-blocking, continue)

**Why cortex-server.js not npm run server:** cortex-server.js manages PID, handles already-running gracefully, writes to logs. `npm run server` blocks and has no PID management.

---

## STEP 3.5 — Load Last Session (continuity wire)

If orchestrator is online, load the previous session summary:

```bash
curl -sf http://localhost:7391/sessions/latest --max-time 2
```

Parse the response. If a session exists and has a `summary` field:
- Show it as one line in the STEP 5 output brief under `Last`
- If `tasksDone` > 0 → surface those tasks as completed context
- If `blockers` present → surface as warnings in STEP 5

If offline or no sessions → read `ai/TRACKER.md` last line (local fallback).

This is the continuity wire: every session knows what the last session did. No more starting cold.

---

## STEP 3.6 — Pattern Intelligence (v18.0: 3-Lane Learning Loop)

**Only runs when `ai/learning/pending-patterns.json` exists in the project.** Skip silently if file is absent.

**Step 3.6a — Run auto-learn silently (Lane 1 auto-promotes, no prompt):**
```bash
node scripts/auto-learn.js --promote 2>/dev/null
```
This runs silently. Lane 1 patterns are promoted to shared-instincts.json automatically.
No Y/N required. No output shown to user unless Lane 2 candidates exist.

**Step 3.6b — Get lane counts for the brief:**
```bash
LANE1=$(node -e "
  const f='ai/learning/auto-candidates.json';
  const fs=require('fs');
  if (!fs.existsSync(f)) { process.stdout.write('0'); process.exit(); }
  const d=JSON.parse(fs.readFileSync(f));
  process.stdout.write(String((d.candidates||[]).filter(c=>c.lane===1&&c.auto_promoted).length));
" 2>/dev/null || echo 0)

LANE2=$(node -e "
  const f='ai/learning/auto-candidates.json';
  const fs=require('fs');
  if (!fs.existsSync(f)) { process.stdout.write('0'); process.exit(); }
  const d=JSON.parse(fs.readFileSync(f));
  process.stdout.write(String((d.candidates||[]).filter(c=>c.lane===2&&!c.auto_promoted).length));
" 2>/dev/null || echo 0)

LANE3=$(node -e "
  const f='ai/learning/auto-candidates.json';
  const fs=require('fs');
  if (!fs.existsSync(f)) { process.stdout.write('0'); process.exit(); }
  const d=JSON.parse(fs.readFileSync(f));
  process.stdout.write(String((d.candidates||[]).filter(c=>c.lane===3&&!c.auto_promoted).length));
" 2>/dev/null || echo 0)

SHARED=$(node -e "
  const cortexHome=process.env.CORTEX_HOME||require('path').join(__dirname,'..');
  const f=require('path').join(cortexHome,'knowledge','shared-instincts.json');
  const fs=require('fs');
  if (!fs.existsSync(f)) { process.stdout.write('0'); process.exit(); }
  const d=JSON.parse(fs.readFileSync(f));
  process.stdout.write(String((d.instincts||[]).length));
" 2>/dev/null || echo 0)
```

**Step 3.6c — Include in STEP 5 brief** (after Last/Next lines, omit if all 0):

```
Patterns   Auto-promoted: [LANE1] · One-tap: [LANE2] · In queue: [LANE3] · Shared pool: [SHARED]
```

**If LANE2 > 0:** show one-tap prompt immediately after the brief — one line per candidate:
```
⚡ One-tap: [module] · [category] · [N] projects — Y to share / N to defer
```
Wait for Y or N. Y → run `node scripts/auto-learn.js --promote` targeting that candidate.
N → leave in Lane 2 queue, surfaces again next session.

**If LANE3 > 0:** show count only — no prompt, no friction:
```
  [N] pattern(s) in manual queue — /cert-promote when ready
```

**Lane rules (never deviate):**
- Lane 1 = always auto-promotes silently — never ask human
- Lane 2 = always one Y/N — never auto-promote without asking
- Lane 3 = always /cert-promote — never surface as one-tap

**Why this step exists:** The global brain grows automatically for safe patterns (Lane 1).
Human attention is reserved for cross-stack or low-confidence patterns (Lane 2).
Domain-specific patterns always stay gated (Lane 3). Right gate per pattern — no more, no less.

---

## STEP 4 — Load Project Context (lean)

**4A — Score + decision**
Read `ai/STATUS.md` → first 15 lines only.
Extract: score · decision · open blockers · next action.

**4B — Last session**
Read `ai/TRACKER.md` → last entry only. One line.

**4C — Active laws**
Scan `.claude/commands/` for adapter files.

**4D — Session state**
Read `ai/state/session-state.json` → active_role + pending_pa_reviews.

**4E — Staleness check**
```bash
git log -1 --format="%ar" -- ai/STATUS.md
```
- > 3 days → warn · > 7 days → halt until PROCEED

**4F — Pipeline state**
Read `ai/STATUS.md` services block (schema in `core/service-topology.md`).
If no services block: infer state from TRACKER + score (mark as approximate).
Capture: status + gate for each service.

---

## STEP 5 — Output Brief

The dominant signal is the score + decision on line 1. Blockers (if any) come
immediately after — they must be visible before the pipeline, not buried below it.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — [project name]                [YYYY-MM-DD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[X]/100  [ALLOW ✅ | WATCH ⚠️ | BLOCK 🚫]    [orchestrator: ✅ | ⚠️]
Last     [one-line from TRACKER — most recent entry]
Next     [next action from STATUS.md — one line]
Patterns Auto-promoted: [N] · One-tap: [N] · In queue: [N] · Shared: [N]  (omit if all 0)
─────────────────────────────────────────────────
[Only if blockers exist:]
⚠️  [blocker 1]
⚠️  [blocker 2]
─────────────────────────────────────────────────
  1  Discovery   ✅  [gate, one line]
  2  Design      ✅  [gate, one line]
  3  Dev         🔄  [gate, one line]
  4  QA          ⏳  [gate, one line]
  5  DevOps      ⏳  [gate, one line]
  ∞  Governance  🔄  always on
  ↕  Marketing   ⏳  [status, one line]  (parallel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Icons: ✅ complete · 🔄 active · ⏳ waiting · 🚫 blocked · ○ not started
Pipeline detail + context switch: /cortex-service

**BLOCK gate:** If score < 85, replace pipeline with:
```
🚫  SCORE GATE — {score}/100 · new features blocked
    Run /cert-score to diagnose before selecting context.
```

---

## STEP 6 — 2-Level Work Menu (NEW in v3.0)

### Level 1 — What mode?

If MODE is already set from STEP 0.5 (`dev` / `review` / `research`): **skip this menu entirely** and jump to the corresponding Level 2 section.

If MODE is INTERACTIVE (no arg):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What are we working on?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1  Development    write · build · fix · test
2  Design         plan · review · status board
3  Review         verify · analyse · audit code
4  Research       discover · learn · predict
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type 1–4  ·  or skip next time: /start dev · /start review · /start research
```

---

### Level 2A — Development selected

Detect repos from registry entry for this project.

**Single repo (backend or frontend only):**
```
Context → [BACKEND | FRONTEND] · [project-name]
Laws: [list]
Ready. What are we building?
```
Skip sub-menu — only one option.

**Multi-repo product (api + web):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Development — which layer?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1  Backend     [api-name]     [score]/100 · [decision]
2  Frontend    [web-name]     [score]/100 · [not scored]
3  Global      full app       end-to-end · both layers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type 1, 2, or 3:
```

**Backend selected:**
Load NestJS patterns, Prisma patterns, backend adapters.
Output: `Context → BACKEND · [name] · Laws: nestjs-patterns · prisma-patterns · [domain adapters]`

**Frontend selected:**
Load Next.js patterns, React Query patterns, design system.
Read frontend repo's `ai/STATUS.md` if exists.
Output: `Context → FRONTEND · [name] · Laws: nextjs-patterns · [design tokens loaded]`

**Global selected:**
Load both backend + frontend contexts simultaneously.
Active laws = union of both.
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Context → GLOBAL (end-to-end)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend    [name]   [score]/100 · [decision]
Frontend   [name]   [score]/100 · [decision]
Laws       [combined — both layers active]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use: /dev-e2e               Playwright full-flow tests
     /dev-fullstack-feature feature spanning both layers
     /cert-verify           verify both repos clean
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Level 2B — Design selected

Read `ai/design/STATUS.md` for design task board.
If file missing → show empty board with prompt to create it.

**Design status board:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Design — [project name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done
   Tailwind config · Button · Card · Input · Alert
   Modal · Sidebar · Navbar

⏳ In Progress
   Login page — 60% complete

📋 Pending
   Customer orders list
   Place order form
   OPS board
   Tailor board
   Admin dashboard

🚫 Blocked
   [none | reason if any]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Options:
1  Continue in-progress work  (Login page)
2  Start next pending item    (Customer orders list)
3  Pick specific item
4  Add new design task
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Design board reads from:** `ai/design/STATUS.md`
**Format of ai/design/STATUS.md:**
```markdown
# Design Status — [project name]
# Updated: [date]

## Done
- Tailwind config
- Button (4 variants)
- Card

## In Progress
- Login page | 60%

## Pending
- Customer orders list
- Place order form
- OPS board

## Blocked
- (none)
```

If `ai/design/STATUS.md` missing:
```
No design board found.
Create one? → /cortex-intent "create design status board"
Or start designing: describe what screen you want to design.
```

---

### Level 2C — Review selected (option 3 or `/start review`)

**No adapter loading** — review reads code directly. Zero domain laws enforced.
This keeps token cost minimal: you're auditing, not building.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Context → REVIEW · [project-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Adapters    none (read-only — no enforcement)
Tools       /cert-review · /cert-verify · /cert-analyse · /cert-security
Saved       ~2K tokens vs Development mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready. What are we reviewing?
(paste code · name a file · describe the area)
```

Log lifecycle: `SESSION_START context=REVIEW`.

---

### Level 2D — Research selected (option 4 or `/start research`)

**No adapter loading** — research is read-only exploration. No enforcement, no laws.
Use this when learning the codebase, predicting issues, or running discovery.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Context → RESEARCH · [project-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Adapters    none (discovery mode — read only)
Tools       /cert-discover · /cert-analyse · /cert-learn · /cert-predict
Saved       ~2K tokens vs Development mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready. What are we researching?
```

Log lifecycle: `SESSION_START context=RESEARCH`.

---

## STEP 7 — Update Registry

After menu selection, update the project's registry entry:
```bash
# Read REGISTRY.json
# Update: last_session = today, score = current score
# Write back
```

This keeps the registry current without any manual work.

---

## STEP 8 — Start Lifecycle Trace

```bash
node scripts/lifecycle.js trace start
node scripts/lifecycle.js log --action=SESSION_START --module=cortex \
  --detail="project=[name] context=[BACKEND|FRONTEND|GLOBAL|DESIGN] score=[X/100]"
```

If not found → skip silently.

---

## Score Gate

| Score | Behaviour |
|-------|-----------|
| ≥ 95 ALLOW | ✅ all work permitted |
| 85–94 WATCH | ⚠️ bug fixes + tests only |
| < 85 BLOCK | 🚫 fix score first |

---

## Example — tailorgrid full flow

```
You open Claude Code at C:\luv\tailorgrid\
Type: /start

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — tailorgrid              2026-03-18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score       95/100 · ALLOW ✅  (tailorgrid-api)
Last        Phase 5 complete — E2E tests + deploy config
Blockers    None
Laws        nestjs-patterns · prisma-patterns
Next        Build tailorgrid-web frontend
Orchestrator ✅ online (v11.2.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we working on?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1  Development    write · build · fix · test
2  Design         plan · review · status board
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You: 1

Development — which layer?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1  Backend     tailorgrid-api    95/100 · ALLOW ✅
2  Frontend    tailorgrid-web    not scored yet
3  Global      full app          end-to-end
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You: 2

Context → FRONTEND · tailorgrid-web
Laws: nextjs-patterns · design system loaded
Ready. What are we building?
```

---

## What Gets Deprecated

`/cert-session` and `/cortex-session` deprecated since v11.2. `/start` is the replacement.

---

## Context confirmation (inline — no separate block)

After the human selects context, confirm with one line — do not repeat the brief:

```
Context → BACKEND · [project-api]  · [X]/100 · ALLOW ✅
Ready. What are we building?
```

Paired with /end — run at session close.

---

## MUST-VERIFY (before declaring /start complete)

Every step below must have a visible, checkable output. If an output is missing, the step did not run.

```
☐ STEP 0   — Token line output: "✅ CORTEX HEALTH: [HEALTHY|DEGRADED|ALARM] · v14.0 · [date] · 18/18"
             OR skipped with reason: "Not a Cortex framework session — STEP 0 skipped"
☐ STEP 0.5 — Mode detected: "Mode: [INTERACTIVE|DEVELOPMENT|REVIEW|RESEARCH]"
             If unknown arg: "⚠️ Unknown mode..." warning shown
☐ STEP 1   — Registry loaded: "[N] projects found" OR "registry missing — local detection only"
☐ STEP 2   — Project identified: "Detected: [project-name]" OR "Unknown project — CLAUDE.md not found"
☐ STEP 3   — Orchestrator status: "✅ online" OR "⚠️ offline — local only"
☐ STEP 3.5 — Last session shown in brief under "Last:" OR "No previous session found"
☐ STEP 3.6 — Patterns line in brief (or skipped: "pending-patterns.json absent")
☐ STEP 5   — Brief output rendered (score · ALLOW/WATCH/BLOCK · pipeline table)
☐ STEP 6   — Context selected: "Context → [BACKEND|FRONTEND|GLOBAL|DESIGN|REVIEW|RESEARCH] · [project] · [X]/100"
```

If any box cannot be checked → the step failed silently. Diagnose before proceeding.

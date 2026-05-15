Run the CORTEX learning intelligence cycle. This directly grows the pattern library.

TWO TYPES OF LEARNING — know the difference:

  PROJECT-LEVEL (this skill handles):
    Bug patterns from real fixes → diagnose.js → KNOWN next time
    Instincts → instincts.json → graduated after 3 observations + confidence ≥ 0.8
    Cross-project sharing via orchestrator

  FRAMEWORK-LEVEL (goes to MASTER + LEARNING-PATH, not diagnose.js):
    Learnings about HOW Cortex itself works — design principles, governance rules,
    patterns discovered by running Cortex (not by fixing project bugs).
    Examples: Route Echo pattern · No Loose Ends rule · mark() alignment rule
    These go to: core/MASTER-vX.Y.md (changelog) + LEARNING-PATH.md (Level 7)
    NOT to diagnose.js — they are framework knowledge, not bug classifiers.

---

**STEP 1 — Maturity baseline**
Run: `node scripts/learn.js maturity`
Note the 4 maturity metrics. Record the baseline before any changes.

---

**STEP 2 — Analyze for new patterns**
Run: `node scripts/learn.js analyze`
This scans diagnoses with no matching pattern and generates proposals in `ai/learning/pattern-proposals.md`.

Check `ai/learning/pending-patterns.json`:
- If the file does NOT exist → create it now: `{ "pending": [] }` — output: `Initialized pending-patterns.json (first cycle)`
- If it exists → read it and find all entries where `"promoted": false`

These are reactive captures from `/cert-bug` and `/dev-debugger` that need review. Include them in the proposals list for Step 3.

---

**STEP 2.5 — Refusal Gate Analysis**

Read REFUSAL_GATE entries from the execution log:
```bash
grep "REFUSAL_GATE" ai/logs/cortex-execution.jsonl 2>/dev/null | tail -100
```

If NO entries → output: `Refusal Gate: no refusals logged this cycle` and skip.

If entries exist, extract and output:
```
REFUSAL GATE ANALYSIS
─────────────────────────────────────────────────────
  /do  refusals: [N]  top reason: [ambiguous_intent | unbounded_scope]
  /fix refusals: [N]  top reason: [no_error_signal | no_location]

  Quality signal: [N of N] refusals followed by successful retry
                  → high-quality gate (users re-submitted with better input)

  Rate verdict:
    HIGH  (refusals > 30% of total /do+/fix invocations)
      → Flag: "STOP messages may be confusing — review gate language quality"
    BALANCED  (5–30%)
      → No action needed. Gate is working correctly.
    LOW   (< 5%)
      → Flag: "Gate may be too permissive — re-check Minimum Input Contracts"
─────────────────────────────────────────────────────
```

**Why this matters:** High-quality refusal = users retry with better input and succeed.
High-frequency refusal = users bypass Cortex. You cannot distinguish these without this log.

---

**STEP 3 — Review proposals**
Read: `ai/learning/pattern-proposals.md`
Plus all unpromoted entries from `pending-patterns.json` (from Step 2).

For each proposal, present:
```
Proposal [ID]: [description]
  Module:      [module name]
  Occurrences: [count]
  Error class: [error type / symptom]
  Recommend:   [Promote / Watch / Skip]
```
- occurrences >= 2 → recommend Promote
- occurrences == 1 → recommend Watch
- clearly environment-specific → recommend Skip

Ask the user which proposals to promote before running Step 4.

---

**STEP 3.5 — Quality gate before promotion**

For each user-approved proposal, self-evaluate before writing to the pattern library.
Score each dimension 1–5. If any score is 1–2, improve the draft and re-score until all ≥ 3.

| Dimension | 1 | 3 | 5 |
|-----------|---|---|---|
| Specificity | Abstract only, no code examples | Representative example present | Rich examples covering all usage patterns |
| Actionability | Unclear what to do | Main steps understandable | Immediately actionable, edge cases covered |
| Scope Fit | Too broad or narrow | Mostly appropriate | Name, trigger, and content perfectly aligned |
| Non-redundancy | Nearly identical to existing pattern | Some overlap but unique perspective | Completely unique value |
| Coverage | Covers only a fraction of target task | Main cases covered | Main cases, edge cases, and pitfalls covered |

Show the scores table before promoting:
```
Quality gate — Proposal [ID]:
  Specificity:    [N]/5  — [rationale]
  Actionability:  [N]/5  — [rationale]
  Scope Fit:      [N]/5  — [rationale]
  Non-redundancy: [N]/5  — [rationale]
  Coverage:       [N]/5  — [rationale]
  Total:          [N]/25
  Decision:       [PROMOTE | IMPROVE FIRST | SKIP]
```

**Save location decision:**
- "Would this pattern be useful in a different project?" → Yes → Global pattern library
- Project-specific only → local `ai/learning/` only
- When in doubt → Global (easier to restrict later than to recover lost knowledge)

---

**STEP 4 — Promote approved patterns**
For each user-approved proposal:
Run: `node scripts/learn.js promote <id>`
This writes the pattern into `scripts/diagnose.js` — future bugs of this type become KNOWN (30-second resolution).

---

**STEP 4.5 — Share promoted patterns to orchestrator (cross-project learning)**

For each pattern promoted in Step 4, POST it to the orchestrator's shared pattern library:

```
POST http://localhost:7391/patterns
{
  "id": "[pattern-id]",
  "project": "[read from package.json name]",
  "description": "[pattern description]",
  "module": "[module name]",
  "errorClass": "[error type / symptom]",
  "fixApproach": "[what worked]",
  "occurrences": [count],
  "promotedAt": "[ISO timestamp]",
  "confidence": [0.0 - 1.0],
  "tags": ["[language]", "[framework]", "[domain]"]
}
```

The orchestrator stores these in its shared library — any project running `/cortex-patterns query`
can retrieve patterns promoted by any other project.

This is the cross-project learning engine: a bug fixed in Exena becomes a known pattern for TailorGrid.

If orchestrator is NOT running: skip silently. Patterns stay local in `scripts/diagnose.js`.
Output one line: `⚠️  Orchestrator offline — patterns saved locally only.`

If orchestrator IS running and POST succeeds:
```
✅ [N] patterns shared to cross-project library
   Projects can now benefit from: [list of pattern descriptions]
```

---

**STEP 5 — Prune stale patterns**
Run: `node scripts/learn.js prune`
Marks patterns not matched in 30+ days. They stay in the file but are flagged as stale.

---

**STEP 6 — Module health heatmap**
Run: `node scripts/learn.js health`
Output: improving / stable / degrading per module with trend arrows.

---

**STEP 7 — Log insight to System 2**
Always log the full cycle result (not just when patterns are promoted):
Run: `node scripts/lifecycle.js log --action=INSIGHT --module=cortex --detail="LEARN_CYCLE: proposals_reviewed=[count] promoted=[count/0] pruned=[count/0] coverage=[X%] pattern_library=[X active]"`

---

**STEP 8 — Final maturity score**
Run: `node scripts/learn.js maturity` again.
Show delta vs Step 1 baseline.

---

**STEP 9 — Update Observability Metrics**

After every cert-learn cycle, update `ai/metrics/cortex-metrics.json`:

```json
{
  "updated": "[ISO timestamp]",
  "patterns": {
    "local_total": "[new count]",
    "graduated": "[graduated count]",
    "pending_review": "[unpromoted count]",
    "shared_to_orchestrator": "[POSTed count]",
    "coverage_pct": "[recalculated]"
  },
  "score": {
    "current": "[from last cert-verify]",
    "trend": "improving | stable | degrading"
  },
  "bugs": {
    "known_pattern_match_rate": "[pct of bugs resolved by known patterns]"
  }
}
```

If file doesn't exist: create it with current values.
If file exists: update only the fields changed this cycle.

This feeds `/cortex-observe metrics` and the session brief anomaly detection.

---

**STEP 9.5 — Outcome Pattern Analysis (if iteration data exists)**

Check: does `ai/learning/outcome-log.json` exist?
If NO → skip this step silently.

If YES → read it and analyze:

```
OUTCOME PATTERNS FOUND
─────────────────────────────────────────────────────
Iterations analyzed: [N]

Highest-feedback domains (most post-launch changes):
  1. [domain] — [N] feedback items across [N] iterations
  2. [domain] — [N] feedback items
  3. [domain] — ...

Most common change type:
  MINOR [N]% · FEATURE [N]% · STRATEGIC [N]%

Pattern signals:
  [If one domain dominates feedback → flag: "This domain is consistently under-specified at blueprint time"]
  [If STRATEGIC changes are frequent → flag: "Founder thinking layer may need more validation upfront"]
  [If MINOR changes dominate → flag: "Implementation is solid, UX needs polish"]
─────────────────────────────────────────────────────
```

If a domain appears in 3+ iteration reports as the top feedback source:
  → Add an instinct to `ai/learning/instincts.json`:
  ```json
  {
    "id": "over-iterated-domain-[name]",
    "trigger": "when blueprinting a [product-type] product",
    "action": "spend extra design time on [domain] — historically generates most post-launch feedback",
    "confidence": 0.6,
    "evidence_count": [N],
    "last_triggered": "[today]"
  }
  ```

This closes the outcome loop:
  Build → Ship → Iterate → Learn → better Blueprint → Build...

---

**STEP 9.7 — Instinct Export/Import (cross-project sharing without orchestrator)**

Use when: sharing patterns between projects where the orchestrator is offline, or bootstrapping a new project with an existing project's instincts.

**Export (from source project):**
```bash
node -e "
const fs=require('fs');
const inst=require('./knowledge/instincts.json');
const exported={
  exported_at: new Date().toISOString(),
  source_project: require('./package.json').name,
  instincts: inst.instincts.filter(i=>i.graduated&&i.confidence>=0.8)
};
fs.writeFileSync('ai/learning/instincts-export.json',JSON.stringify(exported,null,2));
console.log('Exported',exported.instincts.length,'graduated instincts → ai/learning/instincts-export.json');
"
```

**Import (into target project):**
```bash
node -e "
const fs=require('fs');
const target=require('./knowledge/instincts.json');
const source=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const existing=new Set(target.instincts.map(i=>i.id));
const toAdd=source.instincts.filter(i=>!existing.has(i.id));
target.instincts.push(...toAdd.map(i=>({...i,imported_from:source.source_project,imported_at:new Date().toISOString()})));
fs.writeFileSync('./knowledge/instincts.json',JSON.stringify(target,null,2));
console.log('Imported',toAdd.length,'instincts from',source.source_project);
" -- /path/to/instincts-export.json
```

**Rules:**
- Only import graduated instincts (confidence >= 0.8, evidence_count >= 3)
- Imported instincts are tagged with `imported_from` — traceable to source
- Duplicates (same id) are skipped — no overwrite
- After import: run `node scripts/diagnose.js --patterns` to verify

---

**STEP 10 — Prompt for architectural decisions**

If this cert-learn cycle was triggered after a major build session, prompt:
```
Were any architectural decisions made this session?
(e.g. chose Redis over Memcached, chose modular monolith over microservices)

If yes → /cortex-decision log  (records reasoning for future projects)
```

Do not block on this — it's a reminder, not required.

---

**STEP [LOG] — Update skill-usage.json + mark pending-patterns promoted**

Update `ai/learning/skill-usage.json`:
- Increment `invocations.cortex-learn.count` by 1
- Set `invocations.cortex-learn.last` to today's date
- Add the count of promoted patterns to `invocations.cortex-learn.patterns_promoted`
- Recalculate `diagnosis_coverage.coverage_pct` if known/unknown totals changed
- Set `last_updated` to today's date

For each `pending-patterns.json` entry that was reviewed (promoted or skipped):
- Set `"promoted": true` on that entry (regardless of whether it was promoted to Tier 1 or just reviewed)
- This prevents re-reviewing the same entry next cycle

> The `patterns_promoted` running total is the single best measure of CORTEX intelligence growth.
> Every promoted pattern = one bug class that will never take 30 minutes to diagnose again.

---

## INSTINCT CONFIDENCE SYSTEM (Advanced)

For patterns observed passively across sessions (not from explicit bugs):

Track instincts in `ai/learning/instincts.json`:
```json
{
  "id": "always-use-transaction-on-order-create",
  "trigger": "when creating an order",
  "action": "wrap Payment.create + Order.update in $transaction",
  "confidence": 0.85,
  "evidence_count": 6,
  "last_triggered": "2026-03-08"
}
```

**Confidence rules:**
- Initial: **0.3** (first observation)
- Increment: **+0.1** per repeated successful application
- Decay: **-0.1** when contradicted by a bug caused by violating it
- Threshold: **0.8** → graduates to permanent pattern in `scripts/diagnose.js`
- Minimum evidence: **3 observations** before graduation regardless of confidence

**Graduation:** When `confidence >= 0.8` AND `evidence_count >= 3`:
- Promote to `scripts/diagnose.js` as a KNOWN pattern
- Archive instinct with `graduated: true`
- Run `cortex-learn` promote cycle to validate

This is more precise than binary promote/skip — patterns earn their place through repeated evidence.

---

## Hook Setup — 4 hooks for continuous quality + learning (optional but recommended)

These hooks fire automatically — no manual invocation. Add to `~/.claude/settings.json`.

**Quick benefits:**
- `post-edit-typecheck` — catches TypeScript errors immediately after each edit (before cert-verify)
- `suggest-compact` — suggests `/compact` at 50 tool calls, then every 25, to prevent stale context
- `Stop` — reminds you of pending patterns at session end
- `PreCompact` — saves state before context compaction

**post-edit-typecheck hook** (PostToolUse — catch TS errors after every edit):
```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "node -e \"const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');try{const i=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const f=i.tool_input&&i.tool_input.file_path;if(f&&/\\.(ts|tsx)$/.test(f)&&fs.existsSync(f)){let d=path.dirname(path.resolve(f)),depth=0;while(d!==path.parse(d).root&&depth<10&&!fs.existsSync(path.join(d,'tsconfig.json'))){d=path.dirname(d);depth++;}if(fs.existsSync(path.join(d,'tsconfig.json'))){try{execFileSync('npx',['tsc','--noEmit','--pretty','false'],{cwd:d,stdio:'pipe',timeout:20000});}catch(e){const out=(e.stdout||'')+(e.stderr||'');const rel=path.relative(d,path.resolve(f));out.split('\\n').filter(l=>l.includes(rel)||l.includes(f)).slice(0,5).forEach(l=>console.error(l));}}}}catch(e){}\" 2>/dev/null || true"
    }]
  }]
}
```

**suggest-compact hook** (PreToolUse — strategic compaction suggestions):
```json
{
  "PreToolUse": [{
    "matcher": "*",
    "hooks": [{
      "type": "command",
      "command": "node -e \"const fs=require('fs'),os=require('os'),path=require('path');const f=path.join(os.tmpdir(),'cortex-tool-count');let n=1;try{n=parseInt(fs.readFileSync(f,'utf8').trim())||1;n++;}catch(e){}fs.writeFileSync(f,String(n));if(n===50)console.log('[CORTEX] 50 tool calls — consider /compact if transitioning phases');else if(n>50&&(n-50)%25===0)console.log('[CORTEX] '+n+' tool calls — good checkpoint for /compact');\" 2>/dev/null || true"
    }]
  }]
}
```

---

## Hook Setup — Stop + PreCompact (protect learning across context events)

**Stop Hook** — runs at session end, checks for pending patterns:
**PreCompact Hook** — runs BEFORE context compaction, saves work state so nothing is lost when context resets mid-session.

Add both to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node -e \"const fs=require('fs'),p='ai/learning/pending-patterns.json';if(fs.existsSync(p)){const d=JSON.parse(fs.readFileSync(p));const u=d.filter(x=>!x.promoted);if(u.length>0)console.log('[CORTEX] '+u.length+' pending patterns — run /cortex-learn');}\" 2>/dev/null || true"
      }]
    }],
    "PreCompact": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node -e \"const fs=require('fs');const ts=new Date().toISOString();const p='ai/state/precompact-state.json';const s={timestamp:ts,note:'Context compacted — check ai/state/session-state.json for last handoff'};fs.writeFileSync(p,JSON.stringify(s,null,2));console.log('[CORTEX] PreCompact: state saved to '+p);\" 2>/dev/null || true"
      }]
    }]
  }
}
```

**Stop Hook** — checks for pending patterns at session end, reminds you to run `/cortex-learn`.
**PreCompact Hook** — fires before Claude compacts context. Saves a timestamp + note to
`ai/state/precompact-state.json` so you know when compaction happened and can resume from
`session-state.json` handoff. Prevents silent loss of in-progress work state.

**What to capture in pending-patterns.json during a session:**
When `/cortex-bug` or `/dev-debugger` resolves a bug, also append:
```json
{
  "id": "auto-<timestamp>",
  "description": "one-line: what the bug was and how it was fixed",
  "module": "<module-name>",
  "error_class": "<error type>",
  "fix_approach": "<what worked>",
  "occurrences": 1,
  "promoted": false,
  "date": "<today>"
}
```
Next `/cortex-learn` run will pick it up in Step 2.

---

## Token + Cost Optimization (optional but recommended)

Three env vars that reduce token spend by 60–70% with zero quality loss on governed workflows:

```bash
# Cap extended thinking tokens (default is unlimited — this prevents runaway costs)
export MAX_THINKING_TOKENS=10000

# Compact context at 50% full instead of 85% (prevents stale context, reduces errors)
export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50

# Route all subagent tasks (parallel searches, background reads) to Haiku
export CLAUDE_CODE_SUBAGENT_MODEL="claude-haiku-4-5-20251001"
```

Add to shell profile (`~/.bashrc` or `~/.zshrc`) to apply globally.

**Impact by operation type:**
- `CLAUDE_CODE_SUBAGENT_MODEL=haiku` — saves most on parallel file reads, test runs, lint checks
- `MAX_THINKING_TOKENS=10000` — prevents reasoning loops on structured governance tasks
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` — prevents degraded decisions late in long sessions

**When NOT to apply:**
- Remove `MAX_THINKING_TOKENS` override for complex architectural decisions (`/cortex-plan`, `/cortex-blueprint`)
- Remove `CLAUDE_CODE_SUBAGENT_MODEL` override when subagent quality matters (code generation, not just searches)

---

## Auto-approve safe operations (optional Claude Code settings.json)

Add to `~/.claude/settings.json` to skip permission prompts on read-only operations.
These are safe to auto-approve — they make no changes and cannot cause damage:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(npm run lint:*)",
      "Bash(npx tsc --noEmit:*)",
      "Bash(npx jest --no-coverage:*)",
      "Bash(cat:*)",
      "Bash(grep:*)"
    ]
  }
}
```

**Rule:** Auto-approve only operations that: (1) make no file changes, (2) make no network calls, (3) cannot delete or overwrite anything. Reads, formatters, test runners, git status — all safe. Migrations, pushes, installs — never auto-approve.

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-learn                   COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Promoted   {n patterns} (or 0 — all reviewed)
Shared     {n patterns} → orchestrator cross-project library
           [OR: offline — local only]
Pruned     {n stale patterns} (or 0)
Coverage   {before}% → {after}%
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       /cortex-commit to save pattern library changes
           /cortex-patterns query — see shared library
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

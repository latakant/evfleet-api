╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-server  |  v1.1  |  TIER: 1  |  BUDGET: LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L9 (Operations)                                      ║
║ AUTHORITY     ║ OPERATOR                                             ║
║ CAN           ║ - Start / stop / restart the orchestrator           ║
║               ║ - Check orchestrator health + connected projects    ║
║               ║ - Show active features + shared pattern count       ║
║ CANNOT        ║ - Modify orchestrator source code                   ║
║ WHEN TO RUN   ║ - cert-session detects orchestrator is offline      ║
║               ║ - Before any FULL feature build (task graph sync)   ║
║               ║ - To check cross-project pattern library status     ║
║ OUTPUTS       ║ - Server status · Feature list · Pattern count      ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-server — start, stop, and monitor the Cortex orchestrator.

**CORTEX_ROOT resolution** (resolve before running any command):
```bash
CORTEX_ROOT="${CORTEX_ROOT:-$(d=$(pwd); while [ "$d" != "/" ]; do [ -f "$d/REGISTRY.json" ] && echo "$d" && break; d=$(dirname "$d"); done)}"
CORTEX_ROOT="${CORTEX_ROOT:-$HOME/.cortex}"
```
All paths below use `$CORTEX_ROOT`.

The orchestrator (localhost:7391) enables:
  - Task graph sync across sessions
  - Shared pattern library (cross-project learning)
  - Feature progress tracking
  - Session history

Without it: skills work locally but don't share knowledge across projects or sessions.
With it: every fix, pattern, and decision is shared across all Cortex projects.

$ARGUMENTS

Parse from $ARGUMENTS:
- `start`   — start the orchestrator server
- `stop`    — stop the orchestrator server
- `restart` — restart (applies config changes)
- `status`  — check if running + show connected projects + counts
- (no args) — same as `status`, then offer to start if offline

---

## Execution — follows OUTPUT-PROTOCOL v1.0

### status / no args

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Server Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/2] Check orchestrator health
→ GET http://localhost:7391/health
✓ Responding — ONLINE

[2/2] Fetch runtime stats
→ Reading features, patterns, sessions
✓ Stats loaded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS   : ONLINE
Port     : 7391
Version  : [from /health]
Features : [N] active · [N] completed
Patterns : [N] total · [N] cross-project
Sessions : [N] recorded

Active features:
  [feature name]  ([project])  [N/total nodes done]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If OFFLINE at step 1:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Server Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/2] Check orchestrator health
→ GET http://localhost:7391/health
✗ No response — OFFLINE

[2/2] Fetch runtime stats
• Skipped — orchestrator not running

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : OFFLINE
Impact : Task graph sync · Pattern library · Feature tracking unavailable
Fix    : Run /cortex-server start
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### start

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Start Orchestrator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Check if already running
→ GET http://localhost:7391/health
✓ Port 7391 is free

[2/3] Launch orchestrator process
→ node $CORTEX_ROOT/server/index.js
✓ Process started

[3/3] Verify health
→ GET http://localhost:7391/health
✓ Responding — ONLINE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Next   : Orchestrator ready — task graph sync and pattern library active
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If step 3 health check fails:

```
[3/3] Verify health
→ GET http://localhost:7391/health
✗ No response after 3s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : FAILED at step 3/3
Reason : Server process started but not responding
Fix    :
  1. Check port free   → netstat -ano | findstr 7391
  2. Check deps        → cd $CORTEX_ROOT && npm install
  3. Check logs        → node $CORTEX_ROOT/server/index.js (foreground)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### stop

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Stop Orchestrator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/2] Detect running process
→ Scanning port 7391
✓ PID [N] found

[2/2] Terminate process
→ Sending kill signal to PID [N]
✓ Process terminated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS : COMPLETE
Next   : Orchestrator offline — skills continue locally without sync
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### restart

Runs stop → start in sequence. Uses the same output blocks for each phase.

---

## Integration with cert-session

cert-session Step 1E checks orchestrator as part of self-inventory.
If offline → outputs one line: `⚠ Orchestrator offline — run /cortex-server start`
This is a soft warning, not a blocker.

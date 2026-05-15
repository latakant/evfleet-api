╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-upgrade  |  v2.0  |  TIER: 1  |  BUDGET: LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ AUTHORITY     ║ GOVERNOR                                             ║
║ CAN           ║ - Detect installed CORTEX version                   ║
║               ║ - Remove deprecated skills                          ║
║               ║ - Install new skills from Cortex source             ║
║               ║ - Update versioned skills (version-aware)           ║
║               ║ - Suggest upgrade OR downgrade with pros/cons       ║
║               ║ - Write .claude/CORTEX-VERSION marker               ║
║ CANNOT        ║ - Touch project source code                         ║
║               ║ - Modify non-.claude/ files                         ║
║               ║ - Upgrade dependencies (use cert-upgrade for that)  ║
║ WHEN TO RUN   ║ - After pulling new Cortex version                  ║
║               ║ - When /start is missing or outdated                ║
║               ║ - When deprecated skills exist                      ║
║               ║ - When you want to pin to a specific version        ║
║ PAIRED WITH   ║ /start — run after upgrade to verify                ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-upgrade — Version-aware CORTEX skill manager.

**CORTEX_ROOT resolution** (resolve before any path operation):
```bash
CORTEX_ROOT="${CORTEX_ROOT:-$(d=$(pwd); while [ "$d" != "/" ]; do [ -f "$d/REGISTRY.json" ] && echo "$d" && break; d=$(dirname "$d"); done)}"
CORTEX_ROOT="${CORTEX_ROOT:-$HOME/.cortex}"
```
All `$CORTEX_ROOT` paths below resolve against this. Never hardcode `C:/luv/Cortex`.

Knows every version, every change, every tradeoff.
Suggests upgrade or downgrade. You decide. It executes.

Usage:
  /cortex-upgrade                     upgrade current project to latest
  /cortex-upgrade --to v11.2          upgrade/downgrade to specific version
  /cortex-upgrade C:/path/to/project  target a specific project
  /cortex-upgrade --check             show what would change, no action

---

## THE FULL VERSION CHANGELOG
> This is the single source of truth. Updated with every CORTEX release.
> Every skill change, every deprecation, every new capability — recorded here.

---

### v11.2.0 — Governance Hardening (current stable)
**Released:** 2026-03-16

**Skills added:**
| Skill | What it does |
|-------|-------------|
| `start.md` v1.0 | Unified session start — replaces cert-session + cortex-session |
| `end.md` v1.0 | Unified session close — replaces cert-end + cortex-end |
| `cortex-upgrade.md` v1.0 | CORTEX skill manager (this skill) |

**Skills deprecated:**
| Skill | Replaced by |
|-------|------------|
| `cert-start.md` | `start.md` |
| `cert-end.md` | `end.md` |
| `cert-session.md` | `start.md` |
| `cortex-session.md` | `start.md` |
| `cortex-end.md` | `end.md` |

**What improved:** Score gate enforced at commit. Token budget protocol (lean loading). Why-log for architectural decisions. Checker whitelist for false positives.

**Upgrade pros:** Unified session commands. Score gate prevents bad commits. Memory of decisions across sessions.
**Upgrade cons:** Stricter — score < 85 blocks commits. Breaking change for cert-session users.
**Downgrade from here:** Lose score gate, lose unified /start, lose decision memory.

---

### /start v2.0 — Project Navigator
**Released:** 2026-03-18

**Changed skills:**
| Skill | Old | New | What changed |
|-------|-----|-----|-------------|
| `start.md` | v1.0 | v2.0 | Project navigator — scans parent folder, shows backend/frontend/e2e/framework options |

**Upgrade pros:** `/start` now shows all sibling repos with scores. Pick context (backend/frontend/e2e) without switching terminals. E2E mode loads both contexts simultaneously.
**Upgrade cons:** None — fully backwards compatible. Single-repo projects skip navigator automatically.
**Downgrade to v1.0:** Lose project navigator, still get brief + orchestrator.

---

### /cortex-upgrade v2.0 — Version-Aware Skill Manager
**Released:** 2026-03-18

**Changed skills:**
| Skill | Old | New | What changed |
|-------|-----|-----|-------------|
| `cortex-upgrade.md` | v1.0 | v2.0 | Full changelog, upgrade/downgrade suggestions, pros/cons |

**Upgrade pros:** Always knows what changed in every version. Suggests whether to upgrade or downgrade with clear tradeoffs. One command keeps all projects in sync.
**Upgrade cons:** None.

---

### v11.1.0 — Autonomous Pipeline
**Released:** 2026-03-08

**What it introduced:** cert-orchestrate for parallel task execution. Task graph survives session resets. Pattern library with confidence scoring.

**Upgrade pros:** Features build themselves — one command runs the entire pipeline. Cross-session task tracking.
**Upgrade cons:** Heavier setup. Requires orchestrator running.
**Downgrade from here:** Lose autonomous pipeline, lose task graph persistence.

---

### v9.x–v11.0 — Legacy
**Skills from this era:** `cert-start.md`, `cert-end.md`, `cert-session.md`
**Status:** All deprecated. Replaced by `start.md` + `end.md` in v11.2.
**Downgrade to this era:** Not recommended. Lose all v11.x governance features.

---

## SKILL VERSION REGISTRY
> Single source of truth for all versioned skills.
> Read version from header: `║  CORTEX  /skill  |  vX.Y  |`

| Skill file | Latest version | Last changed in |
|------------|---------------|-----------------|
| `start.md` | v2.0 | /start v2.0 (2026-03-18) |
| `end.md` | v1.0 | v11.2.0 (2026-03-16) |
| `cortex-upgrade.md` | v2.0 | /cortex-upgrade v2.0 (2026-03-18) |

**How to read installed version:**
```bash
head -2 "$TARGET/.claude/commands/start.md" | grep -o 'v[0-9]*\.[0-9]*'
```

---

## STEP 1 — Detect target project

```bash
TARGET=${1:-$(pwd)}
ls "$TARGET/.claude/commands/" 2>/dev/null | wc -l
```

If `.claude/commands/` not found:
```
✗ No CORTEX install found at [path]
  Run: node "$CORTEX_ROOT/setup.js" [path]
  Then re-run /cortex-upgrade
```
Stop.

---

## STEP 2 — Detect installed version

```bash
cat "$TARGET/.claude/CORTEX-VERSION" 2>/dev/null || echo "UNKNOWN"
```

If UNKNOWN → scan skill headers to estimate:
```bash
head -2 "$TARGET/.claude/commands/cert-start.md" 2>/dev/null && echo "→ likely v9.x-v11.1"
head -2 "$TARGET/.claude/commands/start.md" 2>/dev/null | grep -o 'v[0-9]*\.[0-9]*' && echo "→ v11.2+"
```

---

## STEP 3 — Show upgrade/downgrade options

Read installed version. Compare against FULL VERSION CHANGELOG above.

**Output the options with pros/cons:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX UPGRADE — [project]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Installed   v11.2.0 (start.md v1.0)
Latest      v11.2.0 (start.md v2.0 available)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTIONS
──────────────────────────────────────────────────────────
[1] ▲ UPDATE start.md v1.0 → v2.0          ← RECOMMENDED
    + Project navigator (backend/frontend/e2e)
    + Auto-detects sibling repos with scores
    - None (fully backwards compatible)

[2] ▲ UPDATE cortex-upgrade.md v1.0 → v2.0
    + Full changelog awareness
    + Upgrade/downgrade suggestions with pros/cons
    - None

[3] ▲ UPDATE ALL outdated skills            ← applies 1+2
    Recommended if you want everything current

[4] ▼ DOWNGRADE start.md v1.0 → (not available)
    No older version available for this skill

[5] → STAY on current version
    No changes made
──────────────────────────────────────────────────────────
Deprecated skills found: [list or "none"]
──────────────────────────────────────────────────────────
Type a number (or "all" to apply all upgrades + remove deprecated):
```

**Downgrade rules:**
- Only offer downgrade if a previous version exists in `$CORTEX_ROOT/skills/archive/`
- If no archive exists → show: `▼ DOWNGRADE — not available (no archived version)`
- Always show what is lost when downgrading — never hide the cons

---

## STEP 4 — Execute selected action

**If upgrade selected:**
```bash
cp "$CORTEX_ROOT/skills/[skill].md" "$TARGET/.claude/commands/[skill].md"
echo "✓ Updated: [skill] [old] → [new]"
```

**If remove deprecated selected:**
```bash
rm "$TARGET/.claude/commands/[deprecated-skill].md"
echo "✓ Removed: [skill] (deprecated)"
```

**If downgrade selected:**
```bash
cp "$CORTEX_ROOT/skills/archive/[skill]-v[X.Y].md" "$TARGET/.claude/commands/[skill].md"
echo "✓ Downgraded: [skill] [current] → [old]"
```

---

## STEP 5 — Write version marker

```bash
echo "[new-version]" > "$TARGET/.claude/CORTEX-VERSION"
echo "✓ Version marker: .claude/CORTEX-VERSION → [version]"
```

---

## STEP 6 — Output final report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX UPGRADE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project     [target path]
Version     [old] → [new]
──────────────────────────────────────────────────
Removed     [deprecated skills removed — or "none"]
Added       [new skills installed — or "none"]
Updated     [versioned skills updated e.g. start.md v1.0→v2.0]
Unchanged   [N] skills
──────────────────────────────────────────────────
Next        /start — verify upgrade worked
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## HOW TO MAINTAIN THIS FILE
> For CORTEX developers — how to keep this skill accurate.

Every time a skill changes, do 3 things:

1. **Add a changelog entry** — new section at top of FULL VERSION CHANGELOG
2. **Update SKILL VERSION REGISTRY** — bump the version + date
3. **Update DEPRECATION MAP** — if anything was deprecated

That's it. `/cortex-upgrade` reads this file — so keeping it current means every project always gets accurate advice.

---

## Completion block

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX — Upgraded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version : [old] → [new]
Removed : [N] deprecated
Updated : [N] versioned skills
Added   : [N] new skills
Next    : /start → verify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

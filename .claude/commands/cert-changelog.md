```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-changelog  |  v8.0  |  TIER: 7  |  BUDGET: LEAN     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L9                                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read git log                                       ║
║               ║ - Read ai/TRACKER.md · ai/app.prd.md               ║
║               ║ - Write CHANGELOG.md (append)                       ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (CHANGELOG)       ║
║ CANNOT        ║ - Modify src/ files                                 ║
║               ║ - Push tags to remote without explicit approval      ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║               ║ - Git log access                                     ║
║ OUTPUTS       ║ - CHANGELOG.md entry (Keep-a-Changelog format)      ║
║               ║ - Completion block: COMPLETE                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Generate release notes from git log. Keep-a-Changelog format. Stakeholder-readable.

$ARGUMENTS

Parse: `version` (required) — e.g. `1.0.0` · `from` (optional) — git tag or commit hash to diff from · `audience` — `dev` | `stakeholder` | blank = both

---

## STEP 1 — Collect commits

```bash
# All commits since last release tag (or last N commits)
git log [from-tag]..HEAD --oneline --no-merges

# Or since a specific date
git log --since="2026-01-01" --oneline --no-merges --format="%h %s"
```

---

## STEP 2 — Categorize commits

Map conventional commit prefixes to changelog sections:

| Prefix | Changelog section |
|--------|------------------|
| `feat:` / `feat(module):` | **Added** |
| `fix:` / `fix(module):` | **Fixed** |
| `perf:` | **Changed** (performance) |
| `refactor:` | **Changed** (internal) |
| `docs:` | **Changed** (documentation) |
| `chore:` | **Changed** (maintenance) |
| `db:` / `migration:` | **Changed** (database) |
| `BREAKING CHANGE` or `!` | **Changed** — breaking (prepend ⚠️) |
| `security:` | **Security** |
| `revert:` | **Fixed** (reversion) |

Discard: `test:`, `ci:`, merge commits — internal only.

---

## STEP 3 — Write CHANGELOG entry

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standard.

```markdown
## [version] — YYYY-MM-DD

### Added
- [module] [HTTP method] /api/[path] — [one-line description]
- [another feature]

### Fixed
- [module] [bug description] — was [wrong behavior], now [correct]

### Changed
- [module] [what changed and why]
- ⚠️ BREAKING: [what changed and migration path]

### Security
- [security improvement]

### Database
- [migration description] — [table affected]
```

**Stakeholder version** (simpler language, no technical jargon):
```markdown
## What's new in v[version] — YYYY-MM-DD

**New features:**
- [User-facing description without endpoint details]

**Bug fixes:**
- [User-facing impact: "Cart totals now calculate correctly"]

**Improvements:**
- [Performance, reliability, UX improvements]
```

---

## STEP 4 — Append to CHANGELOG.md

If `CHANGELOG.md` does not exist → create it with header:
```markdown
# Changelog

All notable changes to Exena are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---
```

Prepend new entry below the header (newest first).

---

## STEP 5 — Suggest version bump

Based on changes found:

```
SEMVER RECOMMENDATION:
  MAJOR (x.0.0) — Breaking API change detected
  MINOR (0.x.0) — New features added (feat:)
  PATCH (0.0.x) — Bug fixes only (fix:)

Recommended: [version]
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-changelog               COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version    [N] — [date]
Commits    [N] total | [N] included | [N] skipped (internal)
Sections   Added:[N] Fixed:[N] Changed:[N] Security:[N]
Logged     LAYER_LOG (CHANGELOG) · {date}
Next       git tag v[version] && /cortex-commit "chore: release v[version]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

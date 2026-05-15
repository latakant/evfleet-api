Execute the upgrade protocol — dependencies, Prisma, NestJS versions, or infrastructure patterns.

**TOKEN BUDGET (lean mode — always active for self-upgrades):**
Read: ai/VERSION.md (4 lines) to detect current version. That's it for orientation.
Grep for package usage instead of reading full files upfront.
When upgrading CORTEX itself (ai/ files): write-forward pattern — write new files from memory templates,
do NOT re-read files you just wrote. Verify with `head -3` not full reads.
Full budget protocol: ai/core/MASTER.md (TOKEN_BUDGET merged)

$ARGUMENTS

Parse from $ARGUMENTS: what is being upgraded, from version, to version (e.g., "prisma 6.19 → 6.20" or "nestjs 10.4 → 11.0").

**If upgrading CORTEX (ai/ files or .claude/commands/):**
Use lean install rules from ai/core/MASTER.md (TOKEN_BUDGET merged):
- Stage 1: identify what needs changing (read VERSION.md + list directory)
- Stage 2: write new/updated files one at a time from in-memory template
- Stage 3: verify each file (head -3 only)
- Stage 4: append to logs (read last 5 lines → append → done)
- Stage 5: final ls verification (no full file reads)
Never load the full CORTEX file tree before upgrading — it costs more than the upgrade.

---

**STEP 1 — Classify upgrade risk**

| Upgrade type | Risk | Path |
|-------------|------|------|
| Patch (x.x.PATCH) | Low | Proceed after changelog check |
| Minor (x.MINOR.x) | Medium | Changelog check + read breaking changes |
| Major (MAJOR.x.x) | High | ARCH path — explicit human approval required |
| Prisma schema migration | High | ARCH path — human approval + `prisma migrate dev` |
| NestJS major version | High | ARCH path — human approval |
| Node.js version | High | ARCH path — human approval |

If **ARCH path**: present the changelog impact and the list of likely affected files. Stop. Wait for "approved" before continuing.

---

**STEP 2 — Read the changelog**
For the specific package being upgraded, check what changed between the current and target version.
Note any breaking changes that affect:
- Import paths changed
- API signature changed
- Removed methods
- Behaviour changes relevant to this codebase

---

**STEP 3 — Read current usage in the codebase**
Search for all usages of the package being upgraded:
```bash
grep -r "<package-name>" src/ --include="*.ts" -l
```
Read the key files. Identify any patterns that will break under the new version.

---

**STEP 4 — Pre-upgrade baseline**
Run: `node scripts/enterprise-checker.js --check`
Note the current score — you will compare against this after the upgrade.
Run: `npx jest` — note the current test count (must match after upgrade).

---

**STEP 5 — Apply the upgrade**
- Update `package.json` version
- Run: `npm install`
- If Prisma: run `npx prisma generate` — do NOT run `prisma migrate dev` without human approval
- If NestJS: update `@nestjs/*` packages together (they must stay version-aligned)

---

**STEP 6 — Fix any breakage**
- Run: `npx tsc --noEmit` — fix all type errors from the upgrade before continuing
- Each error: read the new API, apply the minimal fix
- Do not change business logic while fixing upgrade errors

---

**STEP 7 — Verify everything**
- Run: `npx tsc --noEmit` — 0 errors required
- Run: `npx jest` — same test count, all passing
- Run: `node scripts/enterprise-checker.js --check` — score must not drop below pre-upgrade baseline

If score dropped: investigate which rules now fail and fix before committing the upgrade.

---

**STEP 8 — Update state**
If enterprise score changed from pre-upgrade baseline:
- Update `ai/state/current-score.json`
- Update `ai/STATUS.md` score line

---

**STEP 9 — Update TRACKER**
Append to `ai/TRACKER.md`:
```
[YYYY-MM-DD] UPGRADE — [package] [old-version] → [new-version] — score: [before] → [after]
```

---

**STEP 10 — Log lifecycle event**
Run: `node scripts/lifecycle.js log --action=DEPENDENCY_ADDED --module=<scope> --detail="Upgraded <package> from <old> to <new>. Score: <before>→<after>. Breaking changes handled: <list or none>"`

---

**STEP 11 — Cortex config verification (ALWAYS LAST)**
Run: `node /c/luv/Cortex/scripts/verify.js`
Must exit with `CORTEX-HEALTHY-vX.Y.Z` token.
If any check fails → fix before committing. Do not skip.

---

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-upgrade                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Package    {name} {old} → {new} ({patch|minor|major})
Breaking   {n changes handled | NONE}
Score      {before} → {after}/100
Logged     LAYER_LOG (TYPE: DEPENDENCY_ADDED) · {date}
Next       npx tsc --noEmit → /cortex-commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If breaking changes block upgrade:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-upgrade                 PARTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done       Upgrade staged — breaking changes identified
Skipped    TypeScript errors not yet resolved ({n errors})
Issues     {list breaking changes}
Logged     LAYER_LOG · {date}
Next       Fix tsc errors above → /cortex-commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

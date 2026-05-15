# /cortex-domains — Domain Manager
# skill: cortex-domains | domain: governance | version: 1.0 | added: 2026-03-21
# Human-controlled domain configuration for the current project.
# You decide which services run. You set how they relate. Cortex enforces it.

---

## LOAD

Before executing: `REGISTRY.json` (current project entry)

---

## TRIGGER

Use when:
- Starting a new project — assign initial domains
- Adding a new service (e.g. "we're now doing marketing")
- Changing how services relate (dev + design in parallel vs design-first)
- Removing a domain that's no longer needed
- Auditing what skills are installed and why

Usage:
```
/cortex-domains              → show current domain config for this project
/cortex-domains add design   → add design domain + choose its relationship
/cortex-domains remove marketing  → remove a domain
/cortex-domains set dev+design parallel    → set relationship type
/cortex-domains set dev→qa sequential      → set relationship type
/cortex-domains apply        → write changes to REGISTRY.json + re-propagate skills
```

---

## EXECUTION

### STEP 1 — Show Current Config

Read REGISTRY.json, find the current project entry, output its domains block:

```
DOMAINS — [project name]
══════════════════════════════════════════════════════════════════

  CORE (always installed — cannot remove):
    common · governance · discovery

  ACTIVE:
    dev         → [skill count] skills
    design      → [skill count] skills
    qa          → [skill count] skills
    devops      → [skill count] skills
    marketing   → [skill count] skills

  RELATIONSHIPS:
    dev + design   → parallel    (same sprint, both services active simultaneously)
    dev → qa       → sequential  (qa cannot start until dev gate passes)
    qa → devops    → sequential  (devops cannot start until qa gate passes)
    dev | marketing → independent (marketing runs its own timeline)

  TOTAL INSTALLED: [N] skills ([N] core + [N] declared + [N] auto-dep)

══════════════════════════════════════════════════════════════════
```

For each auto-dep domain (pulled in by rule, not explicitly declared), mark it:
```
    dev    → [N] skills  (auto-dep: pulled in by qa + devops)
```

---

### STEP 2 — Handle Commands

#### ADD DOMAIN: `/cortex-domains add [domain]`

1. Show what the domain contains:
   ```
   Adding [domain] installs [N] new skills:
     [list 3–5 most important skill names]

   Auto-dep check: [domain] requires → [dep domain] (already active / will be added)
   ```

2. If domain has dependencies not yet active, confirm adding them too.

3. Ask for relationship type if the domain touches another active domain:
   ```
   How does [new domain] relate to [existing domain]?

     1. parallel      — both run at the same time
     2. sequential    — [new] waits for [existing] gate to pass
     3. independent   — separate timeline, different owner

   Choice (1/2/3):
   ```

4. Wait for human choice. Record it.

#### REMOVE DOMAIN: `/cortex-domains remove [domain]`

1. Check if any other active domain depends on it:
   ```
   ⚠️ DEPENDENCY CONFLICT:
   qa depends on dev. Removing dev would leave qa without a source.

   Options:
     a. Remove dev + qa + devops together
     b. Keep dev, cancel remove

   Choice (a/b):
   ```

2. If no conflict: confirm removal and skill delta:
   ```
   Removing [domain] will uninstall [N] skills.
   All of these skills will be removed from .claude/commands/.

   Confirm? (yes/no):
   ```

#### SET RELATIONSHIP: `/cortex-domains set [A][op][B] [type]`

Supported operators:
- `A+B`  → parallel (same sprint)
- `A→B`  → sequential (A must complete before B starts)
- `A|B`  → independent (separate timelines)

```
Updating relationship: dev + design → parallel

Before: dev→design (sequential)
After:  dev+design (parallel)

This means: both services are active at the same time.
/cortex-service will show them as co-active, not gated.

Confirm? (yes/no):
```

---

### STEP 3 — Apply Changes: `/cortex-domains apply`

When changes are confirmed:

1. **Update REGISTRY.json** — write new `domains.active[]` and `domains.relationships{}`:
   ```json
   "domains": {
     "active": ["dev", "design", "qa", "devops"],
     "relationships": {
       "dev+design": "parallel",
       "dev→qa":     "sequential",
       "qa→devops":  "sequential"
     }
   }
   ```

2. **Re-propagate skills** — run the install:
   ```
   node scripts/propagate-skills.js [project-name]
   ```

3. **Report result**:
   ```
   ✅ [project-name] updated
      Active domains: dev · design · qa · devops
      Installed: 115 skills → .claude/commands/
      Relationships written to REGISTRY.json
   ```

---

### STEP 4 — Show Available Domains

If run with no args and user asks "what else can I add":

```
AVAILABLE DOMAINS (not yet active):

  marketing    5 skills — copy · landing · email · funnel · channel strategy
               Recommended when: product needs acquisition (launch ≥ 4 weeks out)

  ai-systems   0 skills (adapter only) — pattern library, no installable commands
               Add to REGISTRY domains[] for context awareness during Dev sessions

CORE (always installed — these cannot be added or removed):
  common · governance · discovery
```

---

## RELATIONSHIP SEMANTICS

These are the 3 valid relationship types. Be precise — Cortex uses them to detect out-of-sequence work.

```
parallel     A + B    Both services run at the same time.
                      Example: dev + design. Backend and UI can advance together.
                      /cortex-service shows both as "active" simultaneously.
                      No gate between them — they coordinate, not gate each other.

sequential   A → B    B cannot start until A's gate is complete.
                      Example: dev → qa. Nothing to test without working code.
                      /cortex-service shows B as "waiting" until A's gate passes.
                      /cortex-service warns if B is started out of sequence.

independent  A | B    No connection. Different timelines, possibly different people.
                      Example: dev | marketing. Marketing writes copy on its own clock.
                      /cortex-service renders them in separate lanes.
                      No gate, no wait — just parallel independent ownership.
```

---

## RULE: HUMAN CONTROLS DOMAINS

Cortex never adds or removes domains automatically. The propagate script
resolves technical dependencies (qa→dev, devops→dev) but the _declared_
domain list in REGISTRY.json is always human-set via this skill.

If Cortex suggests adding a domain (e.g. via /start gap detection),
it must route through /cortex-domains and wait for confirmation.

The relationship type is always human-chosen. Cortex proposes a default
(based on service-topology.md conventions) but you confirm or override.

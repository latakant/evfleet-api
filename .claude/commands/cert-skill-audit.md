# /cert-skill-audit — External Skill System Audit & Absorption Protocol
# skill: cert-skill-audit | domain: governance | version: 1.0 | added: 2026-04-30
# Audit external AI skill/workflow systems → classify layer → extract patterns → convert to Cortex-certified skills.
# Study aggressively. Copy selectively. Govern ruthlessly.

---

## TRIGGER

Use when:
- Encountering a public AI workflow system, skill repo, or prompt library worth evaluating
- Deciding whether to absorb patterns from an external system into Cortex
- A new "AI productivity" tool or framework gains traction (market signal)
- Post-discovery of a competitor or complementary system

Do NOT use to wholesale clone external systems. This skill is a filter, not an importer.

---

## THE CORE PRINCIPLE

```
Most external AI skill systems are one of two things:
  "Disciplined cookbook"     → curated markdown playbooks, optional flows, no enforcement
  "Controlled execution"     → gates, state, governance, runtime authority

Cortex is the second. Most others are the first.

The gap isn't the skills — it's governance, hard gates, and compositional depth.

Extract the pattern. Never import the absence of governance.
```

---

## EXECUTION

### STEP 0 — Intake

```
System name:        [name / author / URL]
Description:        [what it claims to solve in one sentence]
Skill count:        [how many skills/commands/playbooks]
Format:             [markdown · JSON · YAML · code · mixed]
Distribution:       [GitHub clone · npm · manual · API]
Social signal:      [stars · forks · mentions — indicator of market validation]
```

---

### STEP 1 — Layer Classification

Classify which layer of the AI stack this system operates at:

```
LAYER 1 — Skill Library / Playbook Layer
  Definition: Curated markdown skills, "when X → do Y" playbooks, personal workflows
  Characteristics: Simple, portable, no enforcement, immediate utility
  Examples: Matt Pocock's .claude skills, personal prompt collections
  Cortex relationship: Pattern mine — these are raw ingredients, not architecture

LAYER 2 — Role Orchestration Layer
  Definition: Multi-agent systems, persona-based orchestration, crew/team coordination
  Characteristics: Agent roles, task delegation, parallel execution
  Examples: CrewAI, GStack, AutoGen
  Cortex relationship: Adjacent layer — different problem, some overlap

LAYER 3 — Distribution Layer
  Definition: Skill packaging, versioning, installation, propagation systems
  Characteristics: Registry, install scripts, sync mechanisms
  Examples: autoskills, plugin systems
  Cortex relationship: Cortex has this via propagate-skills.js — compare patterns

LAYER 4 — Governance Layer
  Definition: Enforcement + state + gates + decision engine + compliance
  Characteristics: Hard gates, FAIL = blocks execution, audit trail, invariants
  Examples: Cortex (this system)
  Cortex relationship: Direct domain — competitive intelligence, architecture patterns
```

**Classification output:**
```
This system operates at: Layer [N] — [name]
Strategic position relative to Cortex: [below / adjacent / same layer / above]
Competitive threat: YES / NO
Pattern mining value: HIGH / MEDIUM / LOW
```

---

### STEP 2 — Strength & Weakness Audit

```
STRENGTHS — what it does genuinely well
  □ Simplicity: (low friction, easy to adopt, readable)
  □ Portability: (GitHub-native, clone-and-use, no lock-in)
  □ Domain depth: (specific expertise encoded in prompts)
  □ Practical patterns: (real workflow codification, not theoretical)
  □ Distribution: (social proof, adoption, discoverability)

WEAKNESSES — what it lacks
  □ Governance: can steps be skipped? are gates hard or soft?
  □ Runtime authority: is markdown enforced at execution, or advisory only?
  □ Mode system: does it select the right approach for context, or one-size-fits-all?
  □ State management: does it track session state across steps?
  □ Compositional depth: Skills only (width) vs Skills+Gates+State+Decision (depth)?

BRUTAL VERDICT:
  "Disciplined cookbook" (Skills only) → pattern mine, don't replicate architecture
  "Controlled execution" (Skills + Governance) → competitive study required
```

---

### STEP 3 — Pattern Extraction

For each skill/component in the external system, evaluate against this filter:

```
FILTER: Is this worth converting?

  Already covered in Cortex?        → SKIP (don't duplicate)
  Solves a real gap Cortex has?     → FLAG FOR CONVERSION (high value)
  Better prompt structure or flow?  → FLAG FOR IMPROVEMENT (upgrade existing skill)
  Domain Cortex doesn't cover yet?  → FLAG AS FUTURE DOMAIN (roadmap signal)
  Marketing/hype, no substance?     → DISCARD

EXTRACTION TABLE
──────────────────────────────────────────────────────────────────────
Pattern name        │ Cortex equivalent         │ Gap?  │ Priority
────────────────────┼───────────────────────────┼───────┼──────────
[external skill 1]  │ [/cert-X or "none"]       │ Y/N   │ H/M/L
[external skill 2]  │ [/cert-X or "none"]       │ Y/N   │ H/M/L
──────────────────────────────────────────────────────────────────────
```

---

### STEP 4 — Conversion Protocol

For each HIGH/MEDIUM priority pattern flagged in Step 3:

```
CONVERSION RULES

External system            →  Cortex-certified equivalent
─────────────────────────────────────────────────────────
Raw markdown playbook      →  Skill with TRIGGER + EXECUTION steps + completion block
"When X do Y" instruction  →  STEP 0 intake guard + STEP N verified output
Optional flow              →  Gates (QA FAIL = blocks hand-off)
No governance              →  HARD INVARIANTS section added
Single flat prompt         →  Multi-step skill with classified stages

Every converted skill MUST have:
  □ Cortex skill header: name · domain · version · added date
  □ TRIGGER section: when to use + when NOT to use
  □ EXECUTION steps: numbered, each with defined inputs and outputs
  □ Hard invariants: at least 3 NEVER rules
  □ OUTPUT FORMAT with completion block
  □ Domain placement: skills/<domain>/<cert-name>.md
```

**Conversion is complete only when the skill is indistinguishable in format from a native Cortex skill.**

---

### STEP 5 — Register & Propagate

```
□ Place converted skill in: skills/<domain>/<cert-skill-name>.md
□ If new domain required:
    - Add to INSTALLABLE_DOMAINS in scripts/propagate-skills.js
    - Add domain to relevant projects in REGISTRY.json
□ Run: npm run propagate  (Tier 2 change)
□ Add skill to core/DOMAIN-INDEX.md under correct domain
□ Update VERSION.md (Tier 2 bump)
□ Note any architectural insights in strategic notes
```

---

### OUTPUT FORMAT

Deliver an **Absorption Report**:

```
ABSORPTION REPORT — [System Name]
──────────────────────────────────────────────────
System audited:       [name · author · layer]
Layer classification: [Layer N — name]
Skills reviewed:      [N total]

Extraction summary:
  Worth converting:   [N skills — list names]
  Already covered:    [N — skipped]
  Improvement flags:  [N existing skills to upgrade]
  Future domain:      [domain name if new territory identified]

Converted:            [list of new /cert-skill-name entries]

Strategic verdict:
  □ STUDY     — architectural patterns worth ongoing attention
  □ ABSORB    — specific skills extracted and converted
  □ IGNORE    — no substance beyond surface novelty
  □ COMPETE   — same layer, monitor closely

Key insight:          [one sentence — what this system proves about the market]
Cortex advantage:     [one sentence — what Cortex has that this system doesn't]
──────────────────────────────────────────────────
```

---

## HARD INVARIANTS

```
NEVER import governance absence.
  The most dangerous thing to absorb from an external system is its lack of gates.
  Extract the pattern. Add the governance. Never import the gap.

NEVER classify two systems at the same layer without verifying.
  "It does skills too" ≠ "it operates at the same layer."
  Classify before judging. Different layers solve different problems.

NEVER convert a skill that Cortex already covers.
  Duplication is worse than a gap. Two skills for the same job → confusion at runtime.
  Check the domain index before converting.

NEVER skip the Brutal Verdict in Step 2.
  If you cannot write one sentence distinguishing "cookbook" from "controlled execution,"
  you do not understand the system well enough to absorb from it.
```

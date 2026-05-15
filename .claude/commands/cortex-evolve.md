╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-evolve  |  v1.0  |  TIER: 6  |  BUDGET: MODERATE    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L7 · L9                                              ║
║ AUTHORITY     ║ ANALYST + WRITER (with PA approval)                 ║
║ CAN           ║ - Read instincts.json, decisions.json               ║
║               ║ - Read all skill files in skills/                   ║
║               ║ - Propose new skills, adapters, or agents           ║
║               ║ - Write proposals to ai/learning/evolve-proposals.md ║
║ CANNOT        ║ - Auto-create skills without human approval         ║
║               ║ - Modify existing skills                            ║
║               ║ - Delete instincts                                  ║
║ WHEN TO RUN   ║ - Monthly · After 5+ new graduated instincts        ║
║               ║ - When /cert-learn reports high pattern_library count ║
║ OUTPUTS       ║ - Cluster report · evolution proposals · PA prompts ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Cluster graduated instincts by domain and confidence, then propose whether each
cluster should evolve into a permanent skill, adapter rule, or agent behaviour.

This is the long-term intelligence compaction engine:
  instincts (observed patterns) → skills (codified workflows)
  instincts (domain rules) → adapter laws (enforced standards)
  instincts (reasoning patterns) → agent behaviours (automated judgment)

---

## MODEL HINT

Use **Sonnet** — requires semantic clustering and cross-domain reasoning.

---

## STEP 1 — Load Intelligence State

```bash
node -e "
const inst=require('./knowledge/instincts.json').instincts||[];
const grad=inst.filter(i=>i.graduated);
const byDomain={};
grad.forEach(i=>{
  const d=i.trigger||'unknown';
  if(!byDomain[d]) byDomain[d]=[];
  byDomain[d].push({id:i.id,action:i.action,confidence:i.confidence,evidence:i.evidence_count});
});
console.log(JSON.stringify(byDomain,null,2));
"
```

Read `knowledge/decisions.json` — note which architectural patterns appear repeatedly.

Read `skills/README.md` — map of what skills already exist (do not propose duplicates).

---

## STEP 2 — Cluster Analysis

Group graduated instincts by semantic similarity (not just domain field):

```
CLUSTER METHOD:
1. Read trigger + action for each instinct
2. Group instincts that address the same workflow or concern
3. Name each cluster: [domain]-[concern] (e.g. "payments-idempotency", "auth-timing-safety")
4. Count instincts per cluster · average confidence per cluster
```

Output cluster table:
```
INSTINCT CLUSTERS
─────────────────────────────────────────────────────
Cluster                    Count  Avg Conf  Top Pattern
─────────────────────────────────────────────────────
payments-idempotency         3     0.88     webhook dedup via ProcessedWebhookEvent
auth-timing-safety           2     0.85     timingSafeEqual on OTP comparison
nestjs-type-safety           4     0.87     no `any` in service layer
prisma-transactions          5     0.90     $transaction for multi-table writes
─────────────────────────────────────────────────────
```

---

## STEP 3 — Evolution Proposals

For each cluster, evaluate the right evolution target:

**→ Permanent Skill** when:
- Cluster represents a repeatable workflow (3+ steps, not just a rule)
- Human runs this sequence manually more than twice per project
- Example: "auth-otp-flow" cluster → `/cert-auth-flow` skill

**→ Adapter Law** when:
- Cluster represents a constraint that must always be enforced
- It's a rule, not a workflow — binary pass/fail
- Example: "prisma-transactions" cluster → law in `adapters/dev/rules.md`

**→ Agent Behaviour** when:
- Cluster represents reasoning/judgment, not just execution
- An agent should apply this proactively without being asked
- Example: "payment-risk-detection" cluster → rule in `agents/security-reviewer.md`

**→ Keep as Instinct** when:
- Cluster has < 2 instincts (insufficient evidence)
- Highly project-specific (not generalizable)
- Already covered by existing skill/rule

Output proposals:
```
EVOLUTION PROPOSALS
─────────────────────────────────────────────────────
Cluster: payments-idempotency
  Instincts: 3 · Avg confidence: 0.88
  Proposed evolution: ADAPTER LAW
  Target: adapters/dev/rules.md → "All webhook handlers must check ProcessedWebhookEvent before processing"
  Confidence: HIGH — appears in 3 projects, 0 contradictions
  Action: Add to adapter · propagate · mark instincts as "evolved"

Cluster: nestjs-type-safety
  Instincts: 4 · Avg confidence: 0.87
  Proposed evolution: KEEP AS INSTINCT
  Reason: Already covered by cert-review CODE QUALITY RULES section
─────────────────────────────────────────────────────
```

---

## STEP 4 — PA Review Gate

Present all proposals. For each, ask:
```
Proposal: [cluster name] → [evolution target]
Reason: [why this cluster warrants evolution]

Approve?
  A  Approve — create it
  S  Skip — keep as instinct
  M  Modify — change the target (skill vs adapter vs agent)
```

**Do not proceed until all proposals are reviewed.** This is not automated.

---

## STEP 5 — Execute Approved Evolutions

For each approved proposal:

**If Adapter Law:**
- Read target adapter file
- Add new law entry: `LAW [N+1]: [rule statement] · Source: evolved from instinct cluster [name]`
- Propagate adapter to all active projects

**If Permanent Skill:**
- Run `/cortex-skill-create name=[cluster-name] domain=[domain]`
- This generates the full skill file from the cluster's patterns

**If Agent Behaviour:**
- Read target agent file
- Add behaviour to the agent's reasoning section
- Note: `# EVOLVED from instinct cluster [name] · [date]`

---

## STEP 6 — Mark Evolved Instincts

For each instinct that was promoted into a skill/adapter/agent:
```bash
node -e "
const fs=require('fs');
const d=JSON.parse(fs.readFileSync('./knowledge/instincts.json','utf8'));
const evolved=['inst-id-1','inst-id-2']; // replace with actual IDs
d.instincts.forEach(i=>{
  if(evolved.includes(i.id)){
    i.evolved=true;
    i.evolved_to='adapter|skill|agent';
    i.evolved_at=new Date().toISOString();
  }
});
fs.writeFileSync('./knowledge/instincts.json',JSON.stringify(d,null,2));
console.log('Marked',evolved.length,'instincts as evolved');
"
```

Evolved instincts are preserved (never deleted) but flagged so they don't re-surface in future evolve cycles.

---

## STEP 7 — Write Proposals Log

Append to `ai/learning/evolve-proposals.md`:
```markdown
## Evolution Cycle — [date]

**Clusters analysed:** [N]
**Proposed:** [N]
**Approved:** [N]
**Skipped:** [N]

### Approved Evolutions
- [cluster] → [adapter/skill/agent] · [file changed]

### Skipped
- [cluster] → reason
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-evolve                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clusters    [N] analysed · [N] proposed · [N] approved
Evolved     [N] instincts → [skills/adapters/agents]
Logged      ai/learning/evolve-proposals.md
Next        /cert-commit "feat(intelligence): evolve [N] instinct clusters"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

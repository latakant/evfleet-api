Quick CORTEX status check — read only, no code changes.

## SCHEMA

```yaml
skill: cert-status
version: "1.0"
input:
  $ARGUMENTS:
    type: string
    required: false
    description: "None expected — status is always a full system view"
    default: null
output:
  type: report
  format: "structured status block: score + domain breakdown + issues + blockers + next action"
  feeds_into: []
runtime:
  tier: 1
  budget: LEAN
  temperature: 0
  token_class: LOW
  read_only: true
```

**1.** Read `ai/state/current-score.json`
**2.** Read `ai/state/open-issues.json`
**3.** Read `ai/STATUS.md` — Open Blockers + Next Action sections only
**4.** Run: `node scripts/enterprise-checker.js --check`

Output this exact format:

```
CORTEX STATUS — [today's date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall:        [X/100]   Decision: [ALLOW/BLOCK]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Domain           Score     Delta vs stored
Financial        XX/100    [+X / -X / =]
Security         XX/100    [+X / -X / =]
Concurrency      XX/100    [+X / -X / =]
Queue            XX/100    [+X / -X / =]
Error Handling   XX/100    [+X / -X / =]
Type Safety      XX/100    [+X / -X / =]
DB Health        XX/100    [+X / -X / =]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open Issues:     [X high / X medium / X low]
Blockers:        [None — or list them]
Next action:     [from STATUS.md]
```

If score differs from `current-score.json`, note the delta and ask the user if they want to persist the new score.

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-status                  COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score      {X}/100  |  Decision: {ALLOW/BLOCK}
Issues     {n high · n medium · n low}
Drift      {+X / -X / none vs stored baseline}
Next       {from STATUS.md next action}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

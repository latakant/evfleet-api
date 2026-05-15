Update the CORTEX living blueprint after a code change.

$ARGUMENTS

---

**STEP 1 — Identify what changed**
From $ARGUMENTS, determine which domains were affected:

| Changed | Update which diagram |
|---------|---------------------|
| New service, new module, new external | Diagram 1 — `01-system-architecture.md` |
| Order state transitions, order flow | Diagram 2 — `02-order-lifecycle.md` |
| Payment flow, Razorpay, COD | Diagram 3 — `03-payment-flow.md` |
| Webhook (Razorpay or Shiprocket) | Diagram 7 — `07-webhook-flow.md` |
| BullMQ, queue, async jobs | Diagram 4 — `04-queue-job-flow.md` |
| Prisma schema, DB constraints | Diagram 5 — `09-db-constraints.md` |
| Module score, hardening, gaps | Diagram 6 — Module Health Scorecard in `00-PROJECT-MASTER.md` |
| Auth, JWT, OTP, RBAC | Diagram 8 — `08-auth-flow.md` |
| Module imports, forbidden deps | Diagram 10 — `10-module-dependencies.md` |
| requestId tracing, logging | Diagram 5 — `05-log-trace-map.md` |
| Race conditions fixed | Diagram 6 — `06-concurrency-races.md` |

---

**STEP 2 — Read current state**
Always read: `ai/mermaid/00-PROJECT-MASTER.md` (master — must always stay in sync)
Read the specific domain file for each affected diagram.

---

**STEP 3 — Update**
- Update ONLY the relevant section in `00-PROJECT-MASTER.md` — do not rewrite unchanged diagrams
- Update the specific domain file to match the master
- Ensure valid Mermaid syntax: no unclosed blocks, correct node types (`[rect]`, `((circle))`, `{diamond}`)
- Both files must show the exact same change — no divergence between master and domain file

---

**STEP 4 — Verify consistency**
Read both the updated `00-PROJECT-MASTER.md` section and the domain file side by side.
Confirm: same change, same Mermaid nodes, no typos in node IDs.

---

**STEP [LOG] — Record blueprint update to System 2**

Run: `node scripts/lifecycle.js log --action=INSIGHT --module=cortex --detail="DIAGRAM_UPDATE: files=[list of updated .md files] domain=[affected domain e.g. orders/payments/auth] change=[one-line description of what changed in diagram terms]"`

Update `ai/learning/skill-usage.json`:
- Increment `invocations.cortex-diagram.count` by 1
- Set `invocations.cortex-diagram.last` to today's date
- Set `last_updated` to today's date

---

## Completion block (MASTER.md)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-diagram                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Updated    {list of diagram files changed}
Sync       master + domain files match ✅
Logged     LAYER_LOG (TYPE: INSIGHT) · {date}
Next       /cortex-commit to include diagram in commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-handoff  |  v8.0  |  TIER: 8  |  BUDGET: ARCH       ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L2 · L3 · L9                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Read all project files (full audit)               ║
║               ║ - Write HANDOFF.md to project root                  ║
║               ║ - Write ai/lifecycle/LAYER_LOG.md (HANDOFF)         ║
║ CANNOT        ║ - Modify src/ files                                 ║
║               ║ - Share live .env values                            ║
║ REQUIRES      ║ - MASTER.md loaded                            ║
║               ║ - PA approval (read-full justification)             ║
║ OUTPUTS       ║ - HANDOFF.md — complete project handoff package     ║
║               ║ - Completion block: COMPLETE                        ║
╚═══════════════╩══════════════════════════════════════════════════════╝
```

Generate a complete project handoff document for new developers, contractors, or team transitions.

$ARGUMENTS

Parse: `recipient` (optional) — `dev` | `contractor` | `team` | blank = general

---

## HANDOFF.md TEMPLATE

```markdown
# [Project Name] — Developer Handoff
Generated: {date} | CORTEX v8.0

## 1. WHAT THIS IS
[2-3 sentences describing what the app does, who uses it, current status]

## 2. TECH STACK
[List from CLAUDE.md — versions, key libraries]

## 3. HOW TO RUN LOCALLY
\`\`\`bash
# Prerequisites: Node 20+, PostgreSQL 16, Redis 7
cp .env.example .env
# Fill in .env values (see ENVIRONMENT section below)
npm install
npx prisma migrate dev
npm run start:dev
\`\`\`

## 4. ARCHITECTURE
[Copy the topology diagram from CLAUDE.md]

Modules: [list from CLAUDE.md]

## 5. ENVIRONMENT VARIABLES
[List all 34 vars from .env.example — group by service]
Critical (app crashes without these): [list 11 critical]
See: ai/pre-delivery-checklist.md for full setup guide.

## 6. KEY BUSINESS RULES
[Copy from CLAUDE.md Section 2 — order lifecycle, payment rules, GST, etc.]

## 7. CODING STANDARDS
[Copy from CLAUDE.md Section 3 — TypeScript rules, NestJS patterns]

## 8. CURRENT STATUS
Score:    [from ai/STATE/current-score.json]
Gaps:     [from CLAUDE.md Section 5]
Open issues: [count from ai/state/open-issues.json]

## 9. WHERE THINGS ARE
| Task | File |
|------|------|
[Key file map from CLAUDE.md]

## 10. DEPLOYMENT
Current: Railway PaaS (see railway.toml)
Infra docs: infra/README.md + infra/SCALING-PLAN.md

## 11. EXTERNAL SERVICES
| Service | Purpose | Docs |
|---------|---------|------|
| Razorpay | Payments + webhooks | [link] |
| Shiprocket | Delivery + tracking | [link] |
| Cloudinary | Image upload | [link] |
| MSG91 | OTP / SMS | [link] |
| Resend | Transactional email | [link] |
| Sentry | Error monitoring | [link] |

## 12. DO NOT
- Hardcode secrets
- Call DB from controller (service only)
- Deploy without /cortex-security + /cortex-health passing
- Skip /cortex-commit for any code change
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-handoff                 COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output     HANDOFF.md — [N] sections
Recipient  [dev | contractor | team | general]
Logged     LAYER_LOG (HANDOFF) · {date}
Next       review HANDOFF.md · share with recipient · delete after use
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-prelaunch  |  v8.1  |  TIER: 6  |  BUDGET: LEAN    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ AUTHORITY     ║ ROUTER — directs to the correct readiness skill     ║
║ OUTPUTS       ║ Routes to /cortex-staging or /cortex-production     ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Pre-launch router. Asks what environment you are targeting, then
hands off to the correct skill. Do not run checks here directly.

---

Output this immediately:

```
─────────────────────────────────────────────
CORTEX  /cortex-prelaunch — Environment Router
─────────────────────────────────────────────
Two readiness checks are available:

  1  /cortex-staging
     Run before every feature push or testing session.
     Checks: TypeScript · score · secrets · invariants ·
             migrations · tests · 5 core env vars · health endpoint
     Fast. Lean. No third-party checks.

  2  /cortex-production
     Run once before go-live. Full check.
     Checks: everything in staging + all 11 env vars ·
             Razorpay webhook · Shiprocket webhook ·
             MSG91 OTP · pre-delivery checklist · Sentry
     Assumes /cortex-staging already passed.

Which are you running?

  1  Staging — testing / feature push
  2  Production — going live

Type 1 or 2:
```

Branch:
- **1** → output: "Starting /cortex-staging..." then execute the full `/cortex-staging` skill
- **2** → output: "Starting /cortex-production..." then execute the full `/cortex-production` skill

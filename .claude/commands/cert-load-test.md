╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-load-test  |  v1.0  |  TIER: 2  |  BUDGET: STANDARD ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ qa                                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Design load test scenarios (baseline·peak·spike·   ║
║               ║   soak) for an API or service                        ║
║               ║ - Define pass/fail criteria and thresholds           ║
║               ║ - Generate k6 or Artillery test scripts              ║
║               ║ - Identify N+1, connection pool, and timeout risks   ║
║               ║ - Produce a structured load test report template     ║
║ CANNOT        ║ - Run tests or observe live traffic                  ║
║               ║ - Determine actual infrastructure capacity           ║
║               ║ - Replace real profiling tools                       ║
║ REQUIRES      ║ - adapters/qa/vocabulary.md loaded                   ║
║               ║ - adapters/qa/patterns.md loaded                     ║
║               ║ - Target endpoint(s) or service description          ║
║               ║ - Expected RPS (or user context to infer from)       ║
║ PAIRED WITH   ║ /cert-perf · /cert-security · /cortex-qa-report      ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-load-test v1.0 — Load and stress test protocol. Design scenarios before any test runs.

---

## INPUT PARSING

Parse from user message:
- `<target>` — endpoint(s), service, or feature to load test
- `<rps>` — optional: expected requests per second at peak
- `<users>` — optional: expected concurrent users
- `--script` — if provided, generate a k6 or Artillery script skeleton
- `--report` — if provided, output a report template pre-filled with target thresholds

If no RPS or user count provided → infer from app_type:
```
Consumer e-commerce (launch)   → 50–200 RPS peak
SaaS internal tool             → 10–50 RPS peak
High-traffic marketplace       → 500–2000 RPS peak
API for mobile app             → use DAU × session rate ÷ session length
```

---

## STEP 1 — Define the Test Context

```
LOAD TEST CONTEXT
─────────────────────────────────────────
Target:          [endpoint or service]
App type:        [consumer · saas · marketplace · mobile-backend]
Expected peak:   [N] RPS
Baseline:        [N] RPS (20–30% of peak)
Spike ceiling:   [N] RPS (3–5× peak, 60 seconds)
Soak duration:   [N] minutes at peak (target: 30 min minimum)

SLA targets:
  p95 response time ≤ [X]ms   (target: 200ms for read, 500ms for write)
  p99 response time ≤ [X]ms   (target: 1000ms, never exceed 2000ms)
  Error rate < [X]%            (target: < 0.1% under normal load)
  Throughput ≥ [N] RPS sustained

Dependencies:
  Database:     [PostgreSQL pool size N — default: 10]
  Cache:        [Redis — TTL strategy]
  External APIs:[Razorpay / Shiprocket / MSG91 — has rate limits?]
  Queue:        [BullMQ — worker concurrency N]
```

---

## STEP 2 — Four Scenario Definitions

### SCENARIO 1 — Baseline

```
BASELINE TEST
─────────────────────────────────────────
Purpose:   Establish healthy response time at low load.
           This is the reference for all other scenarios.
Load:      [20% of expected peak] RPS
Duration:  10 minutes (steady)
Pass criteria:
  p95 < 200ms (reads) or p95 < 400ms (writes)
  Error rate = 0%
  No memory growth over 10 min window
```

### SCENARIO 2 — Peak Load

```
PEAK LOAD TEST
─────────────────────────────────────────
Purpose:   Verify the system sustains expected production peak.
Load:      [peak] RPS — ramped over 5 minutes, held for 20 minutes
Pass criteria:
  p95 < 200ms (reads) or p95 < 500ms (writes)
  p99 < 1000ms
  Error rate < 0.1%
  No connection pool exhaustion
  No memory leak (RSS stays flat after ramp)
Watch for:
  Connection pool saturation (Prisma pool size)
  Redis keyspace eviction during sustained load
  BullMQ job queue depth growing unbounded
```

### SCENARIO 3 — Spike Test

```
SPIKE TEST
─────────────────────────────────────────
Purpose:   Verify recovery after sudden traffic burst.
Load:      Baseline → 5× peak in 30 seconds → baseline in 30 seconds
Duration:  5 minutes total
Pass criteria:
  Error rate < 1% during spike
  p95 returns to baseline within 60 seconds of spike ending
  No process restart or OOM during spike
Watch for:
  DB connection pool exhaustion under spike
  Request queue backing up after spike ends
  Thundering herd on cache miss during spike recovery
```

### SCENARIO 4 — Soak Test

```
SOAK TEST
─────────────────────────────────────────
Purpose:   Detect memory leaks, connection leaks, and slow degradation.
Load:      70% of peak — steady
Duration:  30 minutes minimum (60+ preferred for production readiness)
Pass criteria:
  p95 stays within 10% of baseline throughout
  Memory (RSS) growth < 10% over full duration
  No connection count growth (DB + Redis)
  Error rate = 0% for entire duration
Watch for:
  Gradual p95 increase (connection leak)
  RSS growth without plateau (memory leak)
  Log file size growing unboundedly (logging leak)
  BullMQ jobs accumulating faster than consumed
```

---

## STEP 3 — Risk Identification

```
LOAD RISK ANALYSIS
─────────────────────────────────────────
N+1 QUERY RISK
  Endpoints that return lists of related objects without explicit include/select:
  [identify from target endpoint — if unknown, flag: "audit with query logging before running soak"]

CONNECTION POOL RISK
  Prisma default pool = min(cpus × 2 + 1, 10)
  At [peak] RPS: estimated [N] concurrent queries → [OK / WARN / RISK]
  Recommendation: pool_size = [N] for this load profile

EXTERNAL API RATE LIMIT RISK
  [List any external API calls in the path and their rate limits]
  Razorpay: no per-minute rate limit documented, but mock in load tests
  Shiprocket: 1000 req/min — [SAFE / WARN] at peak

CACHE MISS STAMPEDE RISK
  Cold start: if Redis is empty at test start → [identify cache-first paths]
  Recommendation: pre-warm cache before peak scenario

TIMEOUT RISK
  External HTTP calls without timeout will block threads under load
  Check: every axios/fetch in the path has explicit timeout set
  Check: Prisma query timeout is configured in datasource block
```

---

## STEP 4 — Script Skeleton (if --script)

Generate a k6 script targeting the identified endpoint:

```javascript
// load-test-[target].js — generated by /cert-load-test
// Target: [target endpoint]
// Generated: [date]
// Run: k6 run --vus 50 --duration 10m load-test-[target].js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time', true);

// Scenario: [which scenario this script runs]
export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-arrival-rate',
      rate: [N],           // RPS — replace with actual baseline value
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 20,
    },
    // Uncomment for peak load:
    // peak: {
    //   executor: 'ramping-arrival-rate',
    //   startRate: [baseline_rps],
    //   timeUnit: '1s',
    //   stages: [
    //     { duration: '5m', target: [peak_rps] },
    //     { duration: '20m', target: [peak_rps] },
    //     { duration: '2m', target: 0 },
    //   ],
    //   preAllocatedVUs: 100,
    // },
  },
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<1000'],
    errors: ['rate<0.001'],
  },
};

// Setup: get auth token once
export function setup() {
  const loginRes = http.post(
    '[BASE_URL]/api/auth/login',
    JSON.stringify({ phone: '[TEST_PHONE]', password: '[TEST_PASSWORD]' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: loginRes.json('data.accessToken') };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Replace with actual endpoint under test
  const res = http.get('[BASE_URL]/[TARGET_PATH]', { headers });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response has expected shape': (r) => r.json('data') !== null,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(0.1); // 10 RPS per VU — adjust to match target RPS
}
```

---

## STEP 5 — Report Template (if --report)

```
LOAD TEST REPORT — [target]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date:          [YYYY-MM-DD]
Environment:   [staging | production]
Tool:          [k6 | Artillery | other]

BASELINE (10 min · [N] RPS)
  p50:     [X]ms   target: < 150ms    PASS / FAIL
  p95:     [X]ms   target: < 200ms    PASS / FAIL
  p99:     [X]ms   target: < 500ms    PASS / FAIL
  errors:  [X]%    target: 0%         PASS / FAIL

PEAK LOAD (20 min · [N] RPS)
  p50:     [X]ms   target: < 200ms    PASS / FAIL
  p95:     [X]ms   target: < 500ms    PASS / FAIL
  p99:     [X]ms   target: < 1000ms   PASS / FAIL
  errors:  [X]%    target: < 0.1%     PASS / FAIL

SPIKE (5 min · [N]→[5N]→[N] RPS)
  max p95: [X]ms   target: < 1000ms   PASS / FAIL
  recovery:[X]s    target: < 60s      PASS / FAIL
  errors:  [X]%    target: < 1%       PASS / FAIL

SOAK (30 min · [N] RPS)
  p95 drift:   [X]ms  target: < 10% above baseline  PASS / FAIL
  memory growth:[X]%  target: < 10%                 PASS / FAIL
  error rate:  [X]%   target: 0%                    PASS / FAIL

OVERALL:  [ PASS ✅ | WATCH ⚠️ | BLOCK 🚫 ]
Notes:    [any observed anomalies]
Action:   [next step: SHIP / FIX [what] / INVESTIGATE [what]]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cert-load-test
TARGET:     [name]
STATUS:     COMPLETE
SCENARIOS:  baseline · peak · spike · soak
SLA:        p95 < [X]ms · p99 < [Y]ms · errors < [Z]%
RISKS:      [N identified]
SCRIPT:     [generated | not requested]
NEXT:       run scenarios → cert-perf → cortex-qa-report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

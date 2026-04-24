# evfleet-api — AI Status
# Last scored: 2026-04-24

## Score: null (not yet scored — first governance session)
## Decision: ALLOW
## Phase: phase-2-backend
## Tests: 58 unit (5 suites — notifications, escalations, payouts, rto, rent-cron)

## Modules Complete (11 original + 3 new = 14 total)

| Module | Status | Notes |
|--------|--------|-------|
| auth | ✅ | MSG91 OTP · JWT · Redis refresh |
| users | ✅ | CRUD |
| geography | ✅ | City + Hub |
| pilots | ✅ | Profile + admin list |
| kyc | ✅ | Aadhaar/PAN/DL upload · approve/reject · Cloudinary |
| onboarding | ✅ | Step tracker · personal info · bank · team lead |
| vehicles | ✅ | Fleet management |
| tokens | ✅ | Book · cancel · confirm · assign vehicle |
| wallet | ✅ | Balance · transactions · credit |
| rent | ✅ | Weekly cycles · mark paid · waive · OVERDUE cron |
| admin | ✅ | Dashboard KPIs · team leads · hub managers · clients |
| notifications | ✅ NEW | DB + FCM (best-effort) · pilot inbox · mark read |
| escalations | ✅ NEW | Create · assign · resolve · close · SLA deadlines |
| payouts | ✅ NEW | Generate weekly · mark paid/failed · wallet debit |
| rto | ✅ NEW | RTO contract · instalment generation · default/complete |

## Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| markOverdueCycles | Daily 02:00 IST | PENDING → OVERDUE if >7 days, pilot → INACTIVE |
| expireUnconfirmedTokens | Daily 03:00 IST | TOKEN PENDING → EXPIRED if past expiresAt |

## Open Gaps

None critical. Potential next:
- Razorpay webhook for rent cycle payment (currently admin-manual)
- FCM device token registration (currently topic-based)

## Next Action

Run: `npx prisma migrate dev` with DATABASE_URL set.
Then: `npm run start:dev` to validate all endpoints.

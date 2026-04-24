# EVFleet — Principal Architect Context Brief
# Token-lean. Core context only. Full detail → ai/STATUS.md
# CORTEX v21.1 | Last verified: 2026-04-24

---

## 0. SNAPSHOT

EV fleet-as-a-service platform — pilots rent 2W/3W EVs for last-mile delivery.
Models: 23 | Enums: 21 | Stack: NestJS 10 · Prisma 7 · PostgreSQL 16 · TypeScript
Repos: evfleet-api (NestJS :3000) · evfleet-pilot (Next.js pilot app)
Status: Phase 2 — backend modules building · Schema complete

---

## 1. TOPOLOGY

```
evfleet-pilot (Next.js)  ──→  evfleet-api (:3000)  ──→  PostgreSQL 16
                                     │
                                     ├── Razorpay (rent cycles + RTO instalments)
                                     ├── MSG91 (OTP auth)
                                     └── Cloudinary (KYC doc uploads)
```

11 modules: `auth` · `users` · `geography`(City+Hub) · `pilots` · `kyc` · `onboarding`
            `vehicles` · `tokens`(reservation) · `rent`(cycles+RTO) · `wallet` · `admin`

---

## 2. CRITICAL BUSINESS RULES

**Pilot lifecycle:** ONBOARDING → KYC_PENDING → KYC_VERIFIED → TOKEN_BOOKED → ACTIVE → INACTIVE/SUSPENDED/TERMINATED

**Token flow (vehicle reservation):**
- Pilot books slot → VehicleToken(PENDING) → Hub confirms → VehicleToken(CONFIRMED)
- Hub hands over physical vehicle → VehicleToken(ASSIGNED) + VehicleAssignment created
- Auto-expires after 24h if not confirmed (tokenDate + 24h)

**Rent cycles:** Weekly. RentCycle auto-created per assigned pilot per week.
- B2B_POSTPAID: weeklyRentB2B rate · B2C_PREPAID: weeklyRentB2C rate
- OVERDUE at >7 days unpaid → pilot status → INACTIVE

**RTO (Rent-to-Own):** 52 weeks · down payment required · 3+ missed instalments → DEFAULTED
- RTOStatus: PENDING_PAYMENT → ACTIVE → COMPLETED (ownership transferred) / DEFAULTED / CANCELLED

**Wallet:** All pilot earnings credited, rent debited via WalletTransaction.
- TransactionTypes: EARNINGS_CREDIT · RENT_DEBIT · INCENTIVE_CREDIT · PAYOUT_DEBIT · REFUND_CREDIT

**Razorpay:** HMAC-SHA256 webhook → $transaction(RentCycle=PAID + WalletTransaction)
- Idempotency via ProcessedWebhookEvent (eventId @unique)
- All amounts: Decimal(10,2) INR in DB · paise only at Razorpay API call site

**KYC:** Aadhaar number stored AES-256 encrypted. 3 docs required: Aadhaar + PAN + DL.
- overallStatus = VERIFIED only when all 3 doc statuses = VERIFIED

**Offering types:** RENT_2_WHEELER · RENT_3_WHEELER · RENT_TO_OWN · BYOB
**Plan types:** B2B_POSTPAID (enterprise client like Zomato) · B2C_PREPAID (independent)

---

## 3. CODING STANDARDS

**TypeScript:** no `any` · explicit return types · `interface` for shapes · `type` for unions

**NestJS:** Controller (HTTP only) → Service (business logic) → Prisma (DB)
- DTOs: class-validator on ALL inputs · whitelist:true strips unknown fields
- Guards: JwtAuthGuard → RolesGuard (order matters)
- Multi-table: always Prisma `$transaction` · P2002→409 · P2025→404

**Naming:** files=`kebab-case` · classes=`PascalCase` · DB=`snake_case` via @@map() · envVars=`SCREAMING_SNAKE`

---

## 4. CRITICAL ENV VARS

```
DATABASE_URL · JWT_SECRET · JWT_REFRESH_SECRET
RAZORPAY_KEY_ID · RAZORPAY_KEY_SECRET · RAZORPAY_WEBHOOK_SECRET
MSG91_AUTH_KEY · MSG91_TEMPLATE_ID · MSG91_SENDER_ID
CLOUDINARY_CLOUD_NAME · CLOUDINARY_API_KEY · CLOUDINARY_API_SECRET
AADHAAR_ENCRYPTION_KEY · NODE_ENV · CORS_ORIGINS
```

---

## 5. ROLES

| Role | Access |
|------|--------|
| PILOT | Own data only |
| TEAM_LEAD | Pilots under their hub |
| HUB_MANAGER | All pilots + vehicles at hub |
| CLIENT_MANAGER | Clients + their linked pilots |
| OPS_ADMIN | All data, all hubs, escalations |
| SUPER_ADMIN | Full system access |

---

## 6. GOVERNANCE

CORTEX v21.1 governs all AI work on this project.
- Every session: `/start` · Every commit: `/cert-commit`
- ai/ directory: BRAIN.md · STATE.json · PATTERNS.json
- Phase: phase-2-backend (schema done, modules building)

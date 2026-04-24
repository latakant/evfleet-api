# EVFleet API — Principal Architect Context Brief
# CORTEX v21.1 | Last verified: 2026-04-24

**READ `ai/BRAIN.md` NOW — full project context.**

---

## 0. SNAPSHOT

EV fleet-as-a-service · pilots rent 2W/3W EVs for last-mile delivery (Zypp-style).
Stack: NestJS 10 · Prisma 7 · PostgreSQL 16 · TypeScript
Models: 23 · Enums: 21 · Phase: backend building (schema complete)

---

## 1. TOPOLOGY

```
evfleet-pilot (Next.js)  ──→  evfleet-api (:3000)  ──→  PostgreSQL 16
                                     │
                                     ├── Razorpay · MSG91 · Cloudinary
```

11 modules: `auth` · `users` · `geography` · `pilots` · `kyc` · `onboarding`
            `vehicles` · `tokens` · `rent` · `wallet` · `admin`

---

## 2. CRITICAL BUSINESS RULES

**Pilot lifecycle:** ONBOARDING → KYC_PENDING → KYC_VERIFIED → TOKEN_BOOKED → ACTIVE
**Token flow:** pilot books slot → hub confirms → physical handover → VehicleAssignment created
**Rent cycles:** weekly, auto-created per pilot. OVERDUE >7 days → pilot → INACTIVE
**RTO:** 52-week lease-to-own. 3+ missed → DEFAULTED
**Razorpay:** paise only at API call site · HMAC-SHA256 webhook · ProcessedWebhookEvent idempotency
**KYC:** Aadhaar AES-256 encrypted · 3 docs required (Aadhaar + PAN + DL)

---

## 3. CODING STANDARDS

- Controller (HTTP only) → Service (logic) → Prisma (DB)
- DTOs: class-validator · whitelist:true · forbidNonWhitelisted:true
- Multi-table: always `$transaction` · P2002→409 · P2025→404
- No `any` · explicit return types · CUID PKs · snake_case @@map()

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

## 6. GOVERNANCE

CORTEX v21.1 governs all AI work on this project.
Every session: `/start` · Every commit: `/cert-commit`
ai/: BRAIN.md · STATE.json · PATTERNS.json
Phase: phase-2-backend

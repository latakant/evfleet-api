-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PILOT', 'TEAM_LEAD', 'HUB_MANAGER', 'CLIENT_MANAGER', 'OPS_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'HINDI', 'KANNADA', 'MARATHI');

-- CreateEnum
CREATE TYPE "PilotStatus" AS ENUM ('ONBOARDING', 'KYC_PENDING', 'KYC_VERIFIED', 'TOKEN_BOOKED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('RENT_2_WHEELER', 'RENT_3_WHEELER', 'RENT_TO_OWN', 'BYOB');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('B2B_POSTPAID', 'B2C_PREPAID');

-- CreateEnum
CREATE TYPE "BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'BLACK_PLATINUM');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TWO_WHEELER', 'THREE_WHEELER');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('SCOOTER', 'L3', 'L5');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEW', 'PRE_OWNED');

-- CreateEnum
CREATE TYPE "BatteryType" AS ENUM ('SWAP', 'CHARGING', 'SWAP_AND_CHARGING');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'TOKEN_HELD', 'RENTED', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ASSIGNED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNINGS_CREDIT', 'RENT_DEBIT', 'INCENTIVE_CREDIT', 'CASHBACK_CREDIT', 'PAYOUT_DEBIT', 'REFUND_CREDIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RentCycleStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RTOStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'DEFAULTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscalationCategory" AS ENUM ('VEHICLE_BREAKDOWN', 'PAYMENT_ISSUE', 'KYC_ISSUE', 'CLIENT_DISPUTE', 'RENTAL_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "EscalationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PILOT',
    "language" "Language" NOT NULL DEFAULT 'ENGLISH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_leads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hub_managers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hub_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pilotCode" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "cityId" TEXT,
    "hubId" TEXT,
    "teamLeadId" TEXT,
    "offeringType" "OfferingType",
    "planType" "PlanType",
    "status" "PilotStatus" NOT NULL DEFAULT 'ONBOARDING',
    "badgeLevel" "BadgeLevel",
    "referralClientCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_progress" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "personalInfo" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "aadhaar" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "pan" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "drivingLicence" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "bankDetails" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "teamLeadSelection" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "clientSelection" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "cashbackClientId" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "tokenBooking" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "loaderTokenBooking" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "paymentVerification" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "byobVehicleDetails" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "aadhaarNumber" TEXT,
    "aadhaarFrontUrl" TEXT,
    "aadhaarBackUrl" TEXT,
    "aadhaarStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "aadhaarRejectionReason" TEXT,
    "panNumber" TEXT,
    "panUrl" TEXT,
    "panStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "panRejectionReason" TEXT,
    "dlNumber" TEXT,
    "dlFrontUrl" TEXT,
    "dlBackUrl" TEXT,
    "dlExpiryDate" TIMESTAMP(3),
    "dlStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "dlRejectionReason" TEXT,
    "selfieUrl" TEXT,
    "overallStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_details" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'SAVINGS',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'NEW',
    "batteryType" "BatteryType" NOT NULL,
    "speedKmph" INTEGER NOT NULL,
    "rangeKm" INTEGER NOT NULL,
    "weeklyRentB2B" DECIMAL(10,2) NOT NULL,
    "weeklyRentB2C" DECIMAL(10,2) NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_tokens" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "tokenDate" TIMESTAMP(3) NOT NULL,
    "slotTime" TEXT,
    "status" "TokenStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_pilots" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_pilots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_cycles" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "status" "RentCycleStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayPayoutId" TEXT,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_to_own_contracts" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "downPayment" DECIMAL(10,2) NOT NULL,
    "processingFee" DECIMAL(10,2) NOT NULL,
    "weeklyInstalment" DECIMAL(10,2) NOT NULL,
    "totalTenureWeeks" INTEGER NOT NULL DEFAULT 52,
    "weeksCompleted" INTEGER NOT NULL DEFAULT 0,
    "missedInstalments" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3) NOT NULL,
    "status" "RTOStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "completedAt" TIMESTAMP(3),
    "downPaymentOrderId" TEXT,
    "downPaymentPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_to_own_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rto_instalments" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "RentCycleStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rto_instalments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "raisedByPilotId" TEXT,
    "raisedByTLUserId" TEXT,
    "category" "EscalationCategory" NOT NULL,
    "priority" "EscalationPriority" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" "EscalationStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToUserId" TEXT,
    "slaDeadlineAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'razorpay',
    "payload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_code_key" ON "cities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "team_leads_userId_key" ON "team_leads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hub_managers_userId_key" ON "hub_managers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pilots_userId_key" ON "pilots"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pilots_pilotCode_key" ON "pilots"("pilotCode");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_progress_pilotId_key" ON "onboarding_progress"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_pilotId_key" ON "kyc"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_pilotId_key" ON "bank_details"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registrationNo_key" ON "vehicles"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_assignments_pilotId_key" ON "vehicle_assignments"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_assignments_vehicleId_key" ON "vehicle_assignments"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientCode_key" ON "clients"("clientCode");

-- CreateIndex
CREATE UNIQUE INDEX "client_pilots_clientId_pilotId_key" ON "client_pilots"("clientId", "pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_pilotId_key" ON "wallets"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "rent_to_own_contracts_pilotId_key" ON "rent_to_own_contracts"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "rto_instalments_contractId_weekNumber_key" ON "rto_instalments"("contractId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhook_events_eventId_key" ON "processed_webhook_events"("eventId");

-- AddForeignKey
ALTER TABLE "hubs" ADD CONSTRAINT "hubs_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_leads" ADD CONSTRAINT "team_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_leads" ADD CONSTRAINT "team_leads_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_managers" ADD CONSTRAINT "hub_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_managers" ADD CONSTRAINT "hub_managers_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "team_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_tokens" ADD CONSTRAINT "vehicle_tokens_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_tokens" ADD CONSTRAINT "vehicle_tokens_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_tokens" ADD CONSTRAINT "vehicle_tokens_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_pilots" ADD CONSTRAINT "client_pilots_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_pilots" ADD CONSTRAINT "client_pilots_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_cycles" ADD CONSTRAINT "rent_cycles_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_cycles" ADD CONSTRAINT "rent_cycles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_to_own_contracts" ADD CONSTRAINT "rent_to_own_contracts_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_instalments" ADD CONSTRAINT "rto_instalments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rent_to_own_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_raisedByPilotId_fkey" FOREIGN KEY ("raisedByPilotId") REFERENCES "pilots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

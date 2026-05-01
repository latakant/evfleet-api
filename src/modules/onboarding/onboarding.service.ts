import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { StepStatus, OfferingType, PlanType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({
      where: { userId },
      include: {
        onboardingProgress: true,
        kyc: { select: { overallStatus: true, aadhaarStatus: true, panStatus: true, dlStatus: true } },
        bankDetails: { select: { isVerified: true } },
        user: { select: { name: true, phone: true } },
      },
    });
    if (!pilot) throw new NotFoundException('Pilot not found');

    const op = pilot.onboardingProgress;
    if (!op) return { pilotStatus: pilot.status, steps: null, completionPercent: 0 };

    // Core steps everyone must complete
    const coreSteps = [
      { name: 'Personal Info', field: 'personalInfo', status: op.personalInfo },
      { name: 'Aadhaar', field: 'aadhaar', status: op.aadhaar },
      { name: 'PAN Card', field: 'pan', status: op.pan },
      { name: 'Driving Licence', field: 'drivingLicence', status: op.drivingLicence },
      { name: 'Bank Details', field: 'bankDetails', status: op.bankDetails },
      { name: 'Team Lead Selection', field: 'teamLeadSelection', status: op.teamLeadSelection },
      { name: 'Token Booking', field: 'tokenBooking', status: op.tokenBooking },
    ];

    // Conditional steps
    const conditionalSteps: { name: string; field: string; status: StepStatus }[] = [];
    if (pilot.planType === 'B2B_POSTPAID') {
      conditionalSteps.push({ name: 'Client Selection', field: 'clientSelection', status: op.clientSelection });
    }
    if (pilot.offeringType === OfferingType.RENT_TO_OWN) {
      conditionalSteps.push({ name: 'Payment Verification (RTO)', field: 'paymentVerification', status: op.paymentVerification });
    }
    if (pilot.offeringType === OfferingType.BYOB) {
      conditionalSteps.push({ name: 'BYOB Vehicle Details', field: 'byobVehicleDetails', status: op.byobVehicleDetails });
    }
    if (pilot.offeringType === OfferingType.RENT_3_WHEELER) {
      conditionalSteps.push({ name: 'Loader Token Booking', field: 'loaderTokenBooking', status: op.loaderTokenBooking });
    }

    const allSteps = [...coreSteps, ...conditionalSteps];
    const verified = allSteps.filter((s) => s.status === StepStatus.VERIFIED).length;
    const completionPercent = Math.round((verified / allSteps.length) * 100);

    const nextPending = allSteps.find(
      (s) => s.status === StepStatus.PENDING || s.status === StepStatus.FAILED,
    );

    return {
      pilotCode: pilot.pilotCode,
      pilotStatus: pilot.status,
      offeringType: pilot.offeringType,
      planType: pilot.planType,
      completionPercent,
      completedAt: op.completedAt,
      nextStep: nextPending ? { name: nextPending.name, field: nextPending.field, status: nextPending.status } : null,
      steps: allSteps,
      kyc: pilot.kyc,
      bankDetails: pilot.bankDetails,
    };
  }

  async updatePersonalInfo(userId: string, data: { name?: string; dateOfBirth?: string; address?: string; cityId?: string }) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    await this.prisma.client.$transaction(async (tx) => {
      if (data.name) {
        await tx.user.update({ where: { id: userId }, data: { name: data.name } });
      }
      await tx.pilot.update({
        where: { userId },
        data: {
          ...(data.dateOfBirth ? { dateOfBirth: new Date(data.dateOfBirth) } : {}),
          ...(data.address ? { address: data.address } : {}),
          ...(data.cityId ? { cityId: data.cityId } : {}),
        },
      });
      await tx.onboardingProgress.update({
        where: { pilotId: pilot.id },
        data: { personalInfo: StepStatus.SUBMITTED },
      });
    });

    return this.getSummary(userId);
  }

  async saveBankDetails(userId: string, data: {
    accountHolder: string; accountNumber: string; ifscCode: string; bankName: string; accountType?: string;
  }) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.bankDetails.upsert({
        where: { pilotId: pilot.id },
        update: { ...data },
        create: { pilotId: pilot.id, ...data },
      });
      await tx.onboardingProgress.update({
        where: { pilotId: pilot.id },
        data: { bankDetails: StepStatus.SUBMITTED },
      });
    });

    return { message: 'Bank details saved' };
  }

  async selectOffering(userId: string, offeringType: OfferingType, planType: PlanType) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    if (pilot.status !== 'ONBOARDING') {
      throw new BadRequestException('Offering can only be selected during onboarding');
    }

    await this.prisma.client.pilot.update({
      where: { userId },
      data: { offeringType, planType },
    });

    return { offeringType, planType };
  }

  async selectTeamLead(userId: string, teamLeadId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    const tl = await this.prisma.client.teamLead.findUnique({ where: { id: teamLeadId } });
    if (!tl) throw new NotFoundException('Team lead not found');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.pilot.update({ where: { userId }, data: { teamLeadId, hubId: tl.hubId } });
      await tx.onboardingProgress.update({
        where: { pilotId: pilot.id },
        data: { teamLeadSelection: StepStatus.VERIFIED },
      });
    });

    return { message: 'Team lead selected', teamLeadId, hubId: tl.hubId };
  }
}

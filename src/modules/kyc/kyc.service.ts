import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { KYCStatus, PilotStatus, StepStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { SubmitAadhaarDto } from './dto/submit-aadhaar.dto';
import { SubmitPanDto } from './dto/submit-pan.dto';
import { SubmitDlDto } from './dto/submit-dl.dto';
import { DocType } from './dto/review-doc.dto';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Pilot: get my KYC status ────────────────────────────────

  async getMyKyc(userId: string) {
    const pilot = await this._requirePilot(userId);
    const kyc = await this.prisma.client.kYC.findUnique({
      where: { pilotId: pilot.id },
    });
    if (!kyc) return { message: 'KYC not started', data: null };
    return kyc;
  }

  // ── Pilot: submit aadhaar ───────────────────────────────────

  async submitAadhaar(
    userId: string,
    dto: SubmitAadhaarDto,
    frontFile: Express.Multer.File,
    backFile: Express.Multer.File,
  ) {
    const pilot = await this._requirePilot(userId);

    const [frontUrl, backUrl] = await Promise.all([
      this.cloudinary.uploadBuffer(frontFile.buffer, frontFile.originalname, 'kyc/aadhaar'),
      this.cloudinary.uploadBuffer(backFile.buffer, backFile.originalname, 'kyc/aadhaar'),
    ]);

    const kyc = await this.prisma.client.kYC.upsert({
      where: { pilotId: pilot.id },
      update: {
        aadhaarNumber: dto.aadhaarNumber.replace(/\s/g, ''),
        aadhaarFrontUrl: frontUrl,
        aadhaarBackUrl: backUrl,
        aadhaarStatus: KYCStatus.UPLOADED,
        aadhaarRejectionReason: null,
        overallStatus: KYCStatus.UNDER_REVIEW,
      },
      create: {
        pilotId: pilot.id,
        aadhaarNumber: dto.aadhaarNumber.replace(/\s/g, ''),
        aadhaarFrontUrl: frontUrl,
        aadhaarBackUrl: backUrl,
        aadhaarStatus: KYCStatus.UPLOADED,
        overallStatus: KYCStatus.UNDER_REVIEW,
      },
    });

    await this._updateOnboardingStep(pilot.id, 'aadhaar', StepStatus.SUBMITTED);
    return kyc;
  }

  // ── Pilot: submit PAN ───────────────────────────────────────

  async submitPan(userId: string, dto: SubmitPanDto, panFile: Express.Multer.File) {
    const pilot = await this._requirePilot(userId);

    const panUrl = await this.cloudinary.uploadBuffer(
      panFile.buffer,
      panFile.originalname,
      'kyc/pan',
    );

    const kyc = await this.prisma.client.kYC.upsert({
      where: { pilotId: pilot.id },
      update: {
        panNumber: dto.panNumber,
        panUrl,
        panStatus: KYCStatus.UPLOADED,
        panRejectionReason: null,
        overallStatus: KYCStatus.UNDER_REVIEW,
      },
      create: {
        pilotId: pilot.id,
        panNumber: dto.panNumber,
        panUrl,
        panStatus: KYCStatus.UPLOADED,
        overallStatus: KYCStatus.UNDER_REVIEW,
      },
    });

    await this._updateOnboardingStep(pilot.id, 'pan', StepStatus.SUBMITTED);
    return kyc;
  }

  // ── Pilot: submit DL ────────────────────────────────────────

  async submitDl(
    userId: string,
    dto: SubmitDlDto,
    frontFile: Express.Multer.File,
    backFile: Express.Multer.File,
  ) {
    const pilot = await this._requirePilot(userId);

    const [frontUrl, backUrl] = await Promise.all([
      this.cloudinary.uploadBuffer(frontFile.buffer, frontFile.originalname, 'kyc/dl'),
      this.cloudinary.uploadBuffer(backFile.buffer, backFile.originalname, 'kyc/dl'),
    ]);

    const kyc = await this.prisma.client.kYC.upsert({
      where: { pilotId: pilot.id },
      update: {
        dlNumber: dto.dlNumber,
        dlFrontUrl: frontUrl,
        dlBackUrl: backUrl,
        dlExpiryDate: new Date(dto.dlExpiryDate),
        dlStatus: KYCStatus.UPLOADED,
        dlRejectionReason: null,
        overallStatus: KYCStatus.UNDER_REVIEW,
      },
      create: {
        pilotId: pilot.id,
        dlNumber: dto.dlNumber,
        dlFrontUrl: frontUrl,
        dlBackUrl: backUrl,
        dlExpiryDate: new Date(dto.dlExpiryDate),
        dlStatus: KYCStatus.UPLOADED,
        overallStatus: KYCStatus.UNDER_REVIEW,
      },
    });

    await this._updateOnboardingStep(pilot.id, 'drivingLicence', StepStatus.SUBMITTED);
    return kyc;
  }

  // ── Pilot: submit selfie ────────────────────────────────────

  async submitSelfie(userId: string, selfieFile: Express.Multer.File) {
    const pilot = await this._requirePilot(userId);

    const selfieUrl = await this.cloudinary.uploadBuffer(
      selfieFile.buffer,
      selfieFile.originalname,
      'kyc/selfie',
    );

    return this.prisma.client.kYC.upsert({
      where: { pilotId: pilot.id },
      update: { selfieUrl, overallStatus: KYCStatus.UNDER_REVIEW },
      create: { pilotId: pilot.id, selfieUrl, overallStatus: KYCStatus.UNDER_REVIEW },
    });
  }

  // ── Admin: list KYC ────────────────────────────────────────

  async findAll(params: { status?: KYCStatus; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = status ? { overallStatus: status } : {};

    const [items, total] = await Promise.all([
      this.prisma.client.kYC.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          pilot: {
            select: {
              id: true,
              pilotCode: true,
              status: true,
              user: { select: { phone: true, name: true } },
            },
          },
        },
      }),
      this.prisma.client.kYC.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const kyc = await this.prisma.client.kYC.findUnique({
      where: { id },
      include: {
        pilot: {
          select: {
            id: true,
            pilotCode: true,
            user: { select: { phone: true, name: true } },
          },
        },
      },
    });
    if (!kyc) throw new NotFoundException('KYC record not found');
    return kyc;
  }

  // ── Admin: approve a doc ────────────────────────────────────

  async approveDoc(id: string, docType: DocType, adminUserId: string) {
    const kyc = await this._requireKyc(id);

    const update = this._docStatusField(docType, KYCStatus.VERIFIED);
    const updated = await this.prisma.client.kYC.update({
      where: { id },
      data: update,
    });

    // Check if all 3 docs are now verified → set overallStatus = VERIFIED
    const allVerified =
      (docType === 'aadhaar' ? true : updated.aadhaarStatus === KYCStatus.VERIFIED) &&
      (docType === 'pan' ? true : updated.panStatus === KYCStatus.VERIFIED) &&
      (docType === 'dl' ? true : updated.dlStatus === KYCStatus.VERIFIED);

    if (allVerified) {
      await this.prisma.client.$transaction(async (tx) => {
        await tx.kYC.update({
          where: { id },
          data: {
            overallStatus: KYCStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedByUserId: adminUserId,
          },
        });
        await tx.pilot.update({
          where: { id: kyc.pilotId },
          data: { status: PilotStatus.KYC_VERIFIED },
        });
        await tx.onboardingProgress.update({
          where: { pilotId: kyc.pilotId },
          data: {
            aadhaar: StepStatus.VERIFIED,
            pan: StepStatus.VERIFIED,
            drivingLicence: StepStatus.VERIFIED,
          },
        });
      });
    } else {
      const stepField = this._docToOnboardingStep(docType);
      await this._updateOnboardingStep(kyc.pilotId, stepField, StepStatus.VERIFIED);
    }

    return this.prisma.client.kYC.findUnique({ where: { id } });
  }

  // ── Admin: reject a doc ─────────────────────────────────────

  async rejectDoc(id: string, docType: DocType, reason: string | undefined, adminUserId: string) {
    const kyc = await this._requireKyc(id);
    const rejectionField = this._docRejectionField(docType);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.kYC.update({
        where: { id },
        data: {
          ...this._docStatusField(docType, KYCStatus.REJECTED),
          [rejectionField]: reason || 'Document rejected by admin',
          overallStatus: KYCStatus.REJECTED,
          verifiedByUserId: adminUserId,
        },
      });
      const stepField = this._docToOnboardingStep(docType);
      await tx.onboardingProgress.update({
        where: { pilotId: kyc.pilotId },
        data: { [stepField]: StepStatus.FAILED },
      });
    });

    return this.prisma.client.kYC.findUnique({ where: { id } });
  }

  // ── Private helpers ─────────────────────────────────────────

  private async _requirePilot(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');
    if (pilot.status === PilotStatus.SUSPENDED || pilot.status === PilotStatus.TERMINATED) {
      throw new ForbiddenException('Account is suspended or terminated');
    }
    return pilot;
  }

  private async _requireKyc(id: string) {
    const kyc = await this.prisma.client.kYC.findUnique({ where: { id } });
    if (!kyc) throw new NotFoundException('KYC record not found');
    return kyc;
  }

  private _docStatusField(docType: DocType, status: KYCStatus) {
    const map: Record<DocType, string> = {
      aadhaar: 'aadhaarStatus',
      pan: 'panStatus',
      dl: 'dlStatus',
    };
    return { [map[docType]]: status };
  }

  private _docRejectionField(docType: DocType): string {
    const map: Record<DocType, string> = {
      aadhaar: 'aadhaarRejectionReason',
      pan: 'panRejectionReason',
      dl: 'dlRejectionReason',
    };
    return map[docType];
  }

  private _docToOnboardingStep(docType: DocType): string {
    const map: Record<DocType, string> = {
      aadhaar: 'aadhaar',
      pan: 'pan',
      dl: 'drivingLicence',
    };
    return map[docType];
  }

  private async _updateOnboardingStep(
    pilotId: string,
    field: string,
    status: StepStatus,
  ) {
    await this.prisma.client.onboardingProgress.update({
      where: { pilotId },
      data: { [field]: status },
    });
  }
}

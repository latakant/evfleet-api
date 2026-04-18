import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { KYCStatus, UserRole } from '@prisma/client';
import { KycService } from './kyc.service';
import { SubmitAadhaarDto } from './dto/submit-aadhaar.dto';
import { SubmitPanDto } from './dto/submit-pan.dto';
import { SubmitDlDto } from './dto/submit-dl.dto';
import { ApproveDocDto, RejectDocDto } from './dto/review-doc.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

const MB5 = 5 * 1024 * 1024;
const IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp)$/;

function validateImage(file: Express.Multer.File, fieldName: string) {
  if (!file) throw new BadRequestException(`${fieldName} file is required`);
  if (!IMAGE_TYPES.test(file.mimetype))
    throw new BadRequestException(`${fieldName} must be JPEG, PNG or WebP`);
  if (file.size > MB5)
    throw new BadRequestException(`${fieldName} must be under 5 MB`);
}

@ApiTags('KYC')
@ApiBearerAuth('JWT-auth')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  // ── Pilot endpoints ─────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get my KYC status' })
  getMyKyc(@CurrentUser('id') userId: string) {
    return this.kycService.getMyKyc(userId);
  }

  @Post('submit/aadhaar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit Aadhaar documents' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['aadhaarNumber', 'aadhaarFront', 'aadhaarBack'],
      properties: {
        aadhaarNumber: { type: 'string', example: '123456789012' },
        aadhaarFront: { type: 'string', format: 'binary' },
        aadhaarBack: { type: 'string', format: 'binary' },
      },
    },
  })
  submitAadhaar(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAadhaarDto,
    @UploadedFiles() files: { aadhaarFront?: Express.Multer.File[]; aadhaarBack?: Express.Multer.File[] },
  ) {
    validateImage(files?.aadhaarFront?.[0]!, 'aadhaarFront');
    validateImage(files?.aadhaarBack?.[0]!, 'aadhaarBack');
    return this.kycService.submitAadhaar(userId, dto, files.aadhaarFront![0], files.aadhaarBack![0]);
  }

  @Post('submit/pan')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('panFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit PAN card' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['panNumber', 'panFile'],
      properties: {
        panNumber: { type: 'string', example: 'ABCDE1234F' },
        panFile: { type: 'string', format: 'binary' },
      },
    },
  })
  submitPan(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitPanDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    validateImage(file, 'panFile');
    return this.kycService.submitPan(userId, dto, file);
  }

  @Post('submit/dl')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'dlFront', maxCount: 1 },
    { name: 'dlBack', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit Driving Licence' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['dlNumber', 'dlExpiryDate', 'dlFront', 'dlBack'],
      properties: {
        dlNumber: { type: 'string', example: 'KA0120230012345' },
        dlExpiryDate: { type: 'string', example: '2030-12-31' },
        dlFront: { type: 'string', format: 'binary' },
        dlBack: { type: 'string', format: 'binary' },
      },
    },
  })
  submitDl(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitDlDto,
    @UploadedFiles() files: { dlFront?: Express.Multer.File[]; dlBack?: Express.Multer.File[] },
  ) {
    validateImage(files?.dlFront?.[0]!, 'dlFront');
    validateImage(files?.dlBack?.[0]!, 'dlBack');
    return this.kycService.submitDl(userId, dto, files.dlFront![0], files.dlBack![0]);
  }

  @Post('submit/selfie')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('selfie'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit selfie' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['selfie'],
      properties: { selfie: { type: 'string', format: 'binary' } },
    },
  })
  submitSelfie(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    validateImage(file, 'selfie');
    return this.kycService.submitSelfie(userId, file);
  }

  // ── Admin endpoints ─────────────────────────────────────────

  @Get()
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_MANAGER)
  @ApiOperation({ summary: '[Admin] List KYC records' })
  @ApiQuery({ name: 'status', enum: KYCStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: KYCStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.kycService.findAll({ status, page: +page, limit: +limit });
  }

  @Get(':id')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_MANAGER)
  @ApiOperation({ summary: '[Admin] Get KYC by id' })
  findOne(@Param('id') id: string) {
    return this.kycService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Approve a KYC document' })
  approveDoc(
    @Param('id') id: string,
    @Body() dto: ApproveDocDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.kycService.approveDoc(id, dto.docType, adminUserId);
  }

  @Patch(':id/reject')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Reject a KYC document' })
  rejectDoc(
    @Param('id') id: string,
    @Body() dto: RejectDocDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.kycService.rejectDoc(id, dto.docType, dto.reason, adminUserId);
  }
}

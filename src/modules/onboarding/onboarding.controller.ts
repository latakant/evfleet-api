import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

class PersonalInfoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cityId?: string;
}

class BankDetailsDto {
  @ApiProperty() @IsString() accountHolder: string;
  @ApiProperty() @IsString() accountNumber: string;
  @ApiProperty() @IsString() ifscCode: string;
  @ApiProperty() @IsString() bankName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountType?: string;
}

class SelectTeamLeadDto {
  @ApiProperty() @IsString() teamLeadId: string;
}

@ApiTags('Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get onboarding summary — steps, completion %, next step' })
  getSummary(@CurrentUser('id') userId: string) {
    return this.onboardingService.getSummary(userId);
  }

  @Post('personal-info')
  @ApiOperation({ summary: 'Save personal info (step 1)' })
  updatePersonalInfo(@CurrentUser('id') userId: string, @Body() dto: PersonalInfoDto) {
    return this.onboardingService.updatePersonalInfo(userId, dto);
  }

  @Post('bank-details')
  @ApiOperation({ summary: 'Save bank details (step 5)' })
  saveBankDetails(@CurrentUser('id') userId: string, @Body() dto: BankDetailsDto) {
    return this.onboardingService.saveBankDetails(userId, dto);
  }

  @Post('select-team-lead')
  @ApiOperation({ summary: 'Select team lead (step 6) — also sets hub' })
  selectTeamLead(@CurrentUser('id') userId: string, @Body() dto: SelectTeamLeadDto) {
    return this.onboardingService.selectTeamLead(userId, dto.teamLeadId);
  }
}

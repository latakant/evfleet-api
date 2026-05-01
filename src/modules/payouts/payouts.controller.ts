import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutStatus, UserRole } from '@prisma/client';
import { PayoutsService } from './payouts.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

class GeneratePayoutsDto {
  @ApiProperty({ example: '2026-04-21' }) @IsDateString() weekStartDate: string;
  @ApiProperty({ example: '2026-04-27' }) @IsDateString() weekEndDate: string;
}
class MarkPayoutPaidDto {
  @ApiProperty() @IsString() razorpayPayoutId: string;
}
class MarkFailedDto {
  @ApiPropertyOptional() @IsOptional() @IsString() failureReason?: string;
}

@ApiTags('Payouts')
@ApiBearerAuth('JWT-auth')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('me')
  @ApiOperation({ summary: 'My payouts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyPayouts(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.payoutsService.getMyPayouts(userId, +page, +limit);
  }

  @Get()
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List all payouts' })
  @ApiQuery({ name: 'status', enum: PayoutStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: PayoutStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.payoutsService.findAll({ status, page: +page, limit: +limit });
  }

  @Post('generate')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Generate weekly payouts for all active pilots with positive balance' })
  generateWeeklyPayouts(@Body() dto: GeneratePayoutsDto) {
    return this.payoutsService.generateWeeklyPayouts(dto.weekStartDate, dto.weekEndDate);
  }

  @Patch(':id/paid')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Mark payout as paid with Razorpay payout ID' })
  markPaid(@Param('id') id: string, @Body() dto: MarkPayoutPaidDto) {
    return this.payoutsService.markPaid(id, dto.razorpayPayoutId);
  }

  @Patch(':id/failed')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Mark payout as failed' })
  markFailed(@Param('id') id: string, @Body() dto: MarkFailedDto) {
    return this.payoutsService.markFailed(id, dto.failureReason ?? 'Transfer failed');
  }
}

import {
  Controller, Get, Post, Patch, Param, Body, Query, Req, Headers,
  HttpCode, HttpStatus, RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { RentCycleStatus, UserRole } from '@prisma/client';
import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { RentService } from './rent.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

class GenerateCyclesDto {
  @ApiPropertyOptional({ example: '2026-04-21' }) @IsDateString() weekStartDate: string;
  @ApiPropertyOptional({ example: '2026-04-27' }) @IsDateString() weekEndDate: string;
}
class MarkPaidDto {
  @ApiPropertyOptional() @IsOptional() @IsString() razorpayPaymentId?: string;
}

@ApiTags('Rent')
@ApiBearerAuth('JWT-auth')
@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post('webhook/razorpay')
  @Public()
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.rentService.handleRazorpayWebhook(req.rawBody!, signature);
  }

  @Get('me')
  @ApiOperation({ summary: 'My rent cycles (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyRentCycles(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.rentService.getMyRentCycles(userId, +page, +limit);
  }

  @Get()
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List all rent cycles' })
  @ApiQuery({ name: 'status', enum: RentCycleStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: RentCycleStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.rentService.findAll({ status, page: +page, limit: +limit });
  }

  @Post('generate')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Generate weekly rent cycles for all active pilots' })
  generateWeeklyCycles(@Body() dto: GenerateCyclesDto) {
    return this.rentService.generateWeeklyCycles(dto.weekStartDate, dto.weekEndDate);
  }

  @Patch(':id/pay')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Mark rent cycle paid → debit pilot wallet' })
  markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.rentService.markPaid(id, dto.razorpayPaymentId);
  }

  @Patch(':id/waive')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Waive a rent cycle' })
  waiveCycle(@Param('id') id: string) {
    return this.rentService.waiveCycle(id);
  }
}

import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RTOStatus, UserRole } from '@prisma/client';
import { RtoService } from './rto.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

class CreateRtoContractDto {
  @ApiProperty() @IsString() pilotId: string;
  @ApiProperty() @IsString() vehicleId: string;
  @ApiProperty() @IsNumber() downPayment: number;
  @ApiProperty() @IsNumber() processingFee: number;
  @ApiProperty() @IsNumber() weeklyInstalment: number;
  @ApiPropertyOptional({ default: 52 }) @IsOptional() @IsNumber() totalTenureWeeks?: number;
  @ApiProperty({ example: '2026-05-01' }) @IsDateString() startDate: string;
}

class GenerateInstalmentsDto {
  @ApiProperty() @IsNumber() @Min(1) weekNumber: number;
  @ApiProperty({ example: '2026-05-07' }) @IsDateString() dueDate: string;
}

class MarkInstalmentPaidDto {
  @ApiPropertyOptional() @IsOptional() @IsString() razorpayOrderId?: string;
}

@ApiTags('RTO')
@ApiBearerAuth('JWT-auth')
@Controller('rto')
export class RtoController {
  constructor(private readonly rtoService: RtoService) {}

  @Get('me')
  @ApiOperation({ summary: 'My RTO contract' })
  getMyContract(@CurrentUser('id') userId: string) {
    return this.rtoService.getMyContract(userId);
  }

  @Get()
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List all RTO contracts' })
  @ApiQuery({ name: 'status', enum: RTOStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: RTOStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.rtoService.findAll({ status, page: +page, limit: +limit });
  }

  @Post()
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Create RTO contract after down payment confirmed' })
  createContract(@Body() dto: CreateRtoContractDto) {
    return this.rtoService.createContract(dto);
  }

  @Post('generate-instalments')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Generate weekly instalments for all active RTO contracts' })
  generateWeeklyInstalments(@Body() dto: GenerateInstalmentsDto) {
    return this.rtoService.generateWeeklyInstalments(dto.weekNumber, dto.dueDate);
  }

  @Patch('instalments/:id/paid')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Mark RTO instalment paid' })
  markInstalmentPaid(@Param('id') id: string, @Body() dto: MarkInstalmentPaidDto) {
    return this.rtoService.markInstalmentPaid(id, dto.razorpayOrderId);
  }

  @Patch(':id/default')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Mark RTO contract defaulted → pilot set to INACTIVE' })
  markDefaulted(@Param('id') id: string) {
    return this.rtoService.markDefaulted(id);
  }
}

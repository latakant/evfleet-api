import { IsString, IsOptional, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OfferingType, PlanType } from '@prisma/client';

export class UpdatePilotDto {
  @ApiPropertyOptional({ example: '1998-06-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '12, MG Road, Bengaluru - 560001' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ enum: OfferingType })
  @IsOptional()
  @IsEnum(OfferingType)
  offeringType?: OfferingType;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;
}

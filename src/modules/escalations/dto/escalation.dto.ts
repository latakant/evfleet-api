import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { EscalationCategory, EscalationPriority } from '@prisma/client';

export class CreateEscalationDto {
  @ApiProperty({ enum: EscalationCategory })
  @IsEnum(EscalationCategory)
  category: EscalationCategory;

  @ApiPropertyOptional({ enum: EscalationPriority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(EscalationPriority)
  priority?: EscalationPriority;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}

export class AssignEscalationDto {
  @ApiProperty({ description: 'User ID of the admin/TL to assign this escalation to' })
  @IsString()
  assignedToUserId: string;
}

export class ResolveEscalationDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  resolution: string;
}

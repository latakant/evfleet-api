import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  DL = 'dl',
}

export class ApproveDocDto {
  @ApiProperty({ enum: DocType })
  @IsEnum(DocType)
  docType: DocType;
}

export class RejectDocDto {
  @ApiProperty({ enum: DocType })
  @IsEnum(DocType)
  docType: DocType;

  @ApiPropertyOptional({ example: 'Document is blurry or unreadable' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHubDto {
  @ApiProperty({ example: 'Koramangala Hub' })
  @IsString() @MaxLength(200) name: string;

  @ApiProperty({ example: 'cmo3...' })
  @IsString() cityId: string;

  @ApiProperty({ example: '47, 5th Block, Koramangala, Bengaluru' })
  @IsString() @MaxLength(500) address: string;

  @ApiPropertyOptional({ example: 12.9352 })
  @IsOptional() @IsNumber() @Type(() => Number) latitude?: number;

  @ApiPropertyOptional({ example: 77.6245 })
  @IsOptional() @IsNumber() @Type(() => Number) longitude?: number;
}

export class UpdateHubDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) longitude?: number;
  @ApiPropertyOptional() @IsOptional() isActive?: boolean;
}

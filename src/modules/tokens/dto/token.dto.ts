import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookTokenDto {
  @ApiProperty({ example: 'cmo3...' }) @IsString() hubId: string;
  @ApiProperty({ example: '2026-04-20', description: 'Preferred date (YYYY-MM-DD)' })
  @IsDateString() tokenDate: string;
  @ApiPropertyOptional({ example: '09:00-11:00' }) @IsOptional() @IsString() slotTime?: string;
}

export class AssignVehicleDto {
  @ApiProperty({ example: 'cmo3...', description: 'Vehicle id to assign' })
  @IsString() vehicleId: string;
}

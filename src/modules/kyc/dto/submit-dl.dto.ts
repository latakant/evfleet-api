import { IsString, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitDlDto {
  @ApiProperty({ example: 'KA01 20230012345', description: 'Driving licence number' })
  @IsString()
  @Matches(/^[A-Z]{2}\d{2}\s?\d{4}\d{7}$/, { message: 'dlNumber must be a valid Indian DL number' })
  dlNumber: string;

  @ApiProperty({ example: '2030-12-31', description: 'DL expiry date (YYYY-MM-DD)' })
  @IsDateString()
  dlExpiryDate: string;
}

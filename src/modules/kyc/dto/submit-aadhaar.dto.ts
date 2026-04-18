import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAadhaarDto {
  @ApiProperty({ example: '1234 5678 9012', description: '12-digit Aadhaar number' })
  @IsString()
  @Matches(/^\d{4}\s?\d{4}\s?\d{4}$/, { message: 'aadhaarNumber must be a 12-digit number' })
  aadhaarNumber: string;
}

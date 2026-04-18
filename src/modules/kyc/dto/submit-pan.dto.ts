import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPanDto {
  @ApiProperty({ example: 'ABCDE1234F', description: '10-character PAN number' })
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'panNumber must be a valid PAN (e.g. ABCDE1234F)' })
  panNumber: string;
}

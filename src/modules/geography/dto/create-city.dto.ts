import { IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty({ example: 'Bengaluru' })
  @IsString() @MaxLength(100) name: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString() @MaxLength(100) state: string;

  @ApiProperty({ example: 'BLR' })
  @IsString() @Length(2, 6) code: string;
}

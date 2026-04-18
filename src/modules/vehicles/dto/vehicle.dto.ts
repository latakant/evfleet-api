import { IsString, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VehicleType, VehicleCategory, VehicleCondition, BatteryType, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty() @IsString() hubId: string;
  @ApiProperty() @IsString() registrationNo: string;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty({ enum: VehicleCategory }) @IsEnum(VehicleCategory) vehicleCategory: VehicleCategory;
  @ApiProperty() @IsString() brand: string;
  @ApiProperty() @IsString() model: string;
  @ApiProperty() @IsInt() @Type(() => Number) year: number;
  @ApiPropertyOptional({ enum: VehicleCondition }) @IsOptional() @IsEnum(VehicleCondition) condition?: VehicleCondition;
  @ApiProperty({ enum: BatteryType }) @IsEnum(BatteryType) batteryType: BatteryType;
  @ApiProperty() @IsInt() @Type(() => Number) speedKmph: number;
  @ApiProperty() @IsInt() @Type(() => Number) rangeKm: number;
  @ApiProperty() @IsNumber() @Type(() => Number) @Min(0) weeklyRentB2B: number;
  @ApiProperty() @IsNumber() @Type(() => Number) @Min(0) weeklyRentB2C: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}

export class UpdateVehicleStatusDto {
  @ApiProperty({ enum: VehicleStatus }) @IsEnum(VehicleStatus) status: VehicleStatus;
}

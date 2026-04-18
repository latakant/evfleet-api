import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleStatus, VehicleType, UserRole } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleStatusDto } from './dto/vehicle.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List vehicles (filter: hubId, type, status)' })
  @ApiQuery({ name: 'hubId', required: false })
  @ApiQuery({ name: 'type', enum: VehicleType, required: false })
  @ApiQuery({ name: 'status', enum: VehicleStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('hubId') hubId?: string,
    @Query('type') type?: VehicleType,
    @Query('status') status?: VehicleStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.vehiclesService.findAll({ hubId, type, status, page: +page, limit: +limit });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get vehicle detail' })
  findOne(@Param('id') id: string) { return this.vehiclesService.findOne(id); }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN)
  @ApiOperation({ summary: '[Admin] Create vehicle' })
  create(@Body() dto: CreateVehicleDto) { return this.vehiclesService.create(dto); }

  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN, UserRole.HUB_MANAGER)
  @ApiOperation({ summary: '[Admin] Update vehicle status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVehicleStatusDto) {
    return this.vehiclesService.updateStatus(id, dto);
  }
}

import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PilotStatus, UserRole } from '@prisma/client';
import { PilotsService } from './pilots.service';
import { UpdatePilotDto } from './dto/update-pilot.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Pilots')
@ApiBearerAuth('JWT-auth')
@Controller('pilots')
export class PilotsController {
  constructor(private readonly pilotsService: PilotsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my pilot profile' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.pilotsService.getMyProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my pilot profile (DOB, address, offering/plan type)' })
  updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdatePilotDto) {
    return this.pilotsService.updateMyProfile(userId, dto);
  }

  @Get()
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_MANAGER)
  @ApiOperation({ summary: '[Admin] List pilots with optional status filter' })
  @ApiQuery({ name: 'status', enum: PilotStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: PilotStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.pilotsService.findAll({ status, page: +page, limit: +limit });
  }

  @Get(':id')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_MANAGER, UserRole.TEAM_LEAD)
  @ApiOperation({ summary: '[Admin] Get pilot by id' })
  findOne(@Param('id') id: string) {
    return this.pilotsService.findOne(id);
  }
}

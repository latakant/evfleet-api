import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EscalationCategory, EscalationPriority, EscalationStatus, UserRole } from '@prisma/client';
import { EscalationsService } from './escalations.service';
import { CreateEscalationDto, AssignEscalationDto, ResolveEscalationDto } from './dto/escalation.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Escalations')
@ApiBearerAuth('JWT-auth')
@Controller('escalations')
export class EscalationsController {
  constructor(private readonly escalationsService: EscalationsService) {}

  @Post()
  @ApiOperation({ summary: 'Raise an escalation (pilot)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateEscalationDto) {
    return this.escalationsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'My escalations (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyEscalations(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.escalationsService.getMyEscalations(userId, +page, +limit);
  }

  @Get()
  @Roles(UserRole.TEAM_LEAD, UserRole.HUB_MANAGER, UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List all escalations' })
  @ApiQuery({ name: 'status', enum: EscalationStatus, required: false })
  @ApiQuery({ name: 'priority', enum: EscalationPriority, required: false })
  @ApiQuery({ name: 'category', enum: EscalationCategory, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: EscalationStatus,
    @Query('priority') priority?: EscalationPriority,
    @Query('category') category?: EscalationCategory,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.escalationsService.findAll({ status, priority, category, page: +page, limit: +limit });
  }

  @Get(':id')
  @Roles(UserRole.TEAM_LEAD, UserRole.HUB_MANAGER, UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Get escalation by ID' })
  findOne(@Param('id') id: string) {
    return this.escalationsService.findOne(id);
  }

  @Patch(':id/assign')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Assign escalation to a user' })
  assign(@Param('id') id: string, @Body() dto: AssignEscalationDto) {
    return this.escalationsService.assign(id, dto.assignedToUserId);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.TEAM_LEAD, UserRole.HUB_MANAGER, UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Resolve an escalation' })
  resolve(@Param('id') id: string, @Body() dto: ResolveEscalationDto) {
    return this.escalationsService.resolve(id, dto.resolution);
  }

  @Patch(':id/close')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Close a resolved escalation' })
  close(@Param('id') id: string) {
    return this.escalationsService.close(id);
  }
}

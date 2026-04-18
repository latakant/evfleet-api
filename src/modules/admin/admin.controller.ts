import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../shared/decorators/roles.decorator';

class AssignRoleDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() hubId: string;
}

class CreateClientDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() clientCode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
}

class UpdateClientDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

class LinkPilotDto {
  @ApiProperty() @IsString() pilotId: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ────────────────────────────────────────────────

  @Get('dashboard')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Dashboard KPIs' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Team Leads ───────────────────────────────────────────────

  @Get('team-leads')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_MANAGER)
  @ApiOperation({ summary: '[Admin] List team leads' })
  @ApiQuery({ name: 'hubId', required: false })
  getTeamLeads(@Query('hubId') hubId?: string) {
    return this.adminService.getTeamLeads(hubId);
  }

  @Post('team-leads')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Assign user as team lead for a hub' })
  assignTeamLead(@Body() dto: AssignRoleDto) {
    return this.adminService.assignTeamLead(dto.userId, dto.hubId);
  }

  // ── Hub Managers ─────────────────────────────────────────────

  @Get('hub-managers')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List hub managers' })
  @ApiQuery({ name: 'hubId', required: false })
  getHubManagers(@Query('hubId') hubId?: string) {
    return this.adminService.getHubManagers(hubId);
  }

  @Post('hub-managers')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Assign user as hub manager' })
  assignHubManager(@Body() dto: AssignRoleDto) {
    return this.adminService.assignHubManager(dto.userId, dto.hubId);
  }

  // ── Clients ──────────────────────────────────────────────────

  @Get('clients')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT_MANAGER)
  @ApiOperation({ summary: '[Admin] List all clients' })
  getClients() {
    return this.adminService.getClients();
  }

  @Post('clients')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Create a client' })
  createClient(@Body() dto: CreateClientDto) {
    return this.adminService.createClient(dto);
  }

  @Patch('clients/:id')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Update client' })
  updateClient(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.adminService.updateClient(id, dto);
  }

  @Post('clients/:id/pilots')
  @Roles(UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT_MANAGER)
  @ApiOperation({ summary: '[Admin] Link pilot to client' })
  linkPilotToClient(@Param('id') clientId: string, @Body() dto: LinkPilotDto) {
    return this.adminService.linkPilotToClient(clientId, dto.pilotId, dto.isPrimary ?? false);
  }
}

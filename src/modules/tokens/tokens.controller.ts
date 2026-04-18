import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TokenStatus, UserRole } from '@prisma/client';
import { TokensService } from './tokens.service';
import { BookTokenDto, AssignVehicleDto } from './dto/token.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book a vehicle token (pilot — KYC must be verified)' })
  bookToken(@CurrentUser('id') userId: string, @Body() dto: BookTokenDto) {
    return this.tokensService.bookToken(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'My token history' })
  getMyTokens(@CurrentUser('id') userId: string) {
    return this.tokensService.getMyTokens(userId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel token (pilot, within 2h window)' })
  cancelToken(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tokensService.cancelToken(userId, id);
  }

  @Get()
  @Roles(UserRole.HUB_MANAGER, UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List tokens' })
  @ApiQuery({ name: 'status', enum: TokenStatus, required: false })
  @ApiQuery({ name: 'hubId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: TokenStatus,
    @Query('hubId') hubId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.tokensService.findAll({ status, hubId, page: +page, limit: +limit });
  }

  @Patch(':id/confirm')
  @Roles(UserRole.HUB_MANAGER, UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Confirm token slot' })
  confirmToken(@Param('id') id: string) {
    return this.tokensService.confirmToken(id);
  }

  @Patch(':id/assign')
  @Roles(UserRole.HUB_MANAGER, UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Assign vehicle to token → pilot goes ACTIVE' })
  assignVehicle(@Param('id') id: string, @Body() dto: AssignVehicleDto) {
    return this.tokensService.assignVehicle(id, dto);
  }
}

import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { GeographyService } from './geography.service';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateHubDto, UpdateHubDto } from './dto/create-hub.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Geography')
@Controller()
export class GeographyController {
  constructor(private readonly geo: GeographyService) {}

  @Get('cities')
  @Public()
  @ApiOperation({ summary: 'List active cities' })
  getCities() { return this.geo.getCities(); }

  @Post('cities')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Create city' })
  createCity(@Body() dto: CreateCityDto) { return this.geo.createCity(dto); }

  @Get('hubs')
  @Public()
  @ApiOperation({ summary: 'List hubs (optionally filter by cityId)' })
  @ApiQuery({ name: 'cityId', required: false })
  getHubs(@Query('cityId') cityId?: string) { return this.geo.getHubs(cityId); }

  @Get('hubs/:id')
  @Public()
  @ApiOperation({ summary: 'Get hub detail' })
  getHub(@Param('id') id: string) { return this.geo.getHub(id); }

  @Post('hubs')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN)
  @ApiOperation({ summary: '[Admin] Create hub' })
  createHub(@Body() dto: CreateHubDto) { return this.geo.createHub(dto); }

  @Patch('hubs/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN)
  @ApiOperation({ summary: '[Admin] Update hub' })
  updateHub(@Param('id') id: string, @Body() dto: UpdateHubDto) {
    return this.geo.updateHub(id, dto);
  }
}

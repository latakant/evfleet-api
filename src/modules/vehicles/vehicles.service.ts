import { Injectable, NotFoundException } from '@nestjs/common';
import { VehicleStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateVehicleDto, UpdateVehicleStatusDto } from './dto/vehicle.dto';

const VEHICLE_SELECT = {
  id: true, registrationNo: true, vehicleType: true, vehicleCategory: true,
  brand: true, model: true, year: true, condition: true, batteryType: true,
  speedKmph: true, rangeKm: true, weeklyRentB2B: true, weeklyRentB2C: true,
  status: true, imageUrl: true, isActive: true, createdAt: true,
  hub: { select: { id: true, name: true, city: { select: { id: true, name: true, code: true } } } },
};

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { hubId?: string; type?: VehicleType; status?: VehicleStatus; page: number; limit: number }) {
    const { hubId, type, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      ...(hubId ? { hubId } : {}),
      ...(type ? { vehicleType: type } : {}),
      ...(status ? { status } : {}),
    };
    const [vehicles, total] = await Promise.all([
      this.prisma.client.vehicle.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: VEHICLE_SELECT }),
      this.prisma.client.vehicle.count({ where }),
    ]);
    return { data: vehicles, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const v = await this.prisma.client.vehicle.findUnique({ where: { id }, select: VEHICLE_SELECT });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async create(dto: CreateVehicleDto) {
    const hub = await this.prisma.client.hub.findUnique({ where: { id: dto.hubId } });
    if (!hub) throw new NotFoundException('Hub not found');
    return this.prisma.client.vehicle.create({ data: { ...dto, weeklyRentB2B: dto.weeklyRentB2B, weeklyRentB2C: dto.weeklyRentB2C }, select: VEHICLE_SELECT });
  }

  async updateStatus(id: string, dto: UpdateVehicleStatusDto) {
    const v = await this.prisma.client.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return this.prisma.client.vehicle.update({ where: { id }, data: { status: dto.status }, select: VEHICLE_SELECT });
  }
}

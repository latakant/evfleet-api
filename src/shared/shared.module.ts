import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { RedisService } from './services/redis.service';
import { CloudinaryService } from './services/cloudinary.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, CloudinaryService],
  exports: [PrismaService, RedisService, CloudinaryService],
})
export class SharedModule {}

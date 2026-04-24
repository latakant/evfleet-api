import { Module } from '@nestjs/common';
import { RentController } from './rent.controller';
import { RentService } from './rent.service';
import { RtoController } from './rto.controller';
import { RtoService } from './rto.service';
import { RentCronService } from './rent-cron.service';

@Module({
  controllers: [RentController, RtoController],
  providers: [RentService, RtoService, RentCronService],
  exports: [RentService, RtoService],
})
export class RentModule {}

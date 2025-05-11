import { Module } from '@nestjs/common';
import { StrapiService } from '../../services/strapi.service';

@Module({
  providers: [StrapiService],
  exports: [StrapiService], // 👈 дає доступ іншим модулям
})
export class StrapiModule {}
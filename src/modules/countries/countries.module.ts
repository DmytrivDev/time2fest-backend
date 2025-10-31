import { Module } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { CountriesController } from "./countries.controller";
import { StrapiModule } from "../strapi/strapi.module"; // краще імпортувати StrapiModule, а не сам сервіс

@Module({
  imports: [StrapiModule],
  providers: [CountriesService],
  controllers: [CountriesController],
  exports: [CountriesService],
})
export class CountriesModule {}

import { Module } from "@nestjs/common";
import { CountriesLightController } from "./countries-light.controller";
import { CountriesLightService } from "./countries-light.service";
import { StrapiService } from "../../services/strapi.service";

@Module({
  controllers: [CountriesLightController],
  providers: [CountriesLightService, StrapiService],
  exports: [CountriesLightService],
})
export class CountriesLightModule {}

import { Module } from "@nestjs/common";
import { AmbassadorsListController } from "./ambassadors-list.controller";
import { AmbassadorsListService } from "./ambassadors-list.service";
import { StrapiService } from "../../services/strapi.service";

@Module({
  controllers: [AmbassadorsListController],
  providers: [AmbassadorsListService, StrapiService],
  exports: [AmbassadorsListService],
})
export class AmbassadorsListModule {}

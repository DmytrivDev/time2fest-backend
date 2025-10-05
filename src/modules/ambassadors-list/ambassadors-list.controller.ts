import { Controller, Get, Param, Query } from "@nestjs/common";
import { AmbassadorsListService } from "./ambassadors-list.service";

@Controller("ambassadors-list")
export class AmbassadorsListController {
  constructor(private readonly ambListService: AmbassadorsListService) {}

  // Усі амбасадори (з можливістю фільтрувати)
  @Get()
  async getAll(
    @Query("locale") locale = "uk",
    @Query("timeZone") timeZone?: string,
    @Query("countryCode") countryCode?: string
  ) {
    return this.ambListService.getAll(locale, timeZone, countryCode);
  }

  // Один амбасадор по ID
  @Get(":id")
  async getById(@Param("id") id: number, @Query("locale") locale = "uk") {
    return this.ambListService.getById(id, locale);
  }
}

import { Controller, Get, Param, Query } from "@nestjs/common";
import { AmbassadorsListService } from "./ambassadors-list.service";

@Controller("ambassadors-list")
export class AmbassadorsListController {
  constructor(private readonly ambListService: AmbassadorsListService) {}

  // ---- Усі амбасадори (з фільтрацією) ----
  @Get()
  async getAll(
    @Query("locale") locale = "uk",
    @Query("timeZone") timeZone?: string,
    @Query("countryCode") countryCode?: string,
    @Query("ids") ids?: string,
    @Query("full") full?: string
  ) {
    const idArray = ids
      ? ids
          .split(",")
          .map((id) => Number(id.trim()))
          .filter(Boolean)
      : undefined;

    // ---- Full вмикається лише якщо явно true ----
    const isFull = full === "true";

    return this.ambListService.getAll(
      locale,
      timeZone,
      countryCode,
      idArray,
      isFull
    );
  }

  // ---- Один амбасадор ----
  @Get(":id")
  async getById(@Param("id") id: number, @Query("locale") locale = "uk") {
    return this.ambListService.getById(id, locale);
  }
}

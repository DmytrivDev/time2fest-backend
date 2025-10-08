import { Controller, Get, Param, Query } from "@nestjs/common";
import { AmbassadorsListService } from "./ambassadors-list.service";

@Controller("ambassadors-list")
export class AmbassadorsListController {
  constructor(private readonly ambListService: AmbassadorsListService) {}

  // ---- Усі амбасадори (з фільтрацією + random + exclude) ----
  @Get()
  async getAll(
    @Query("locale") locale = "uk",
    @Query("timeZone") timeZone?: string,
    @Query("countryCode") countryCode?: string,
    @Query("ids") ids?: string,
    @Query("full") full?: string,
    @Query("rand") rand?: string,
    @Query("count") count?: string,
    @Query("exclude") exclude?: string
  ) {
    const idArray = ids
      ? ids
          .split(",")
          .map((id) => Number(id.trim()))
          .filter(Boolean)
      : undefined;

    const excludeArray = exclude
      ? exclude
          .split(",")
          .map((id) => Number(id.trim()))
          .filter(Boolean)
      : [];

    const isFull = full === "true";
    const isRandom = rand === "true";
    const randCount = count ? Number(count) || 1 : 1;

    return this.ambListService.getAll(
      locale,
      timeZone,
      countryCode,
      idArray,
      isFull,
      isRandom,
      randCount,
      excludeArray
    );
  }

  // ---- Один амбасадор ----
  @Get(":id")
  async getById(@Param("id") id: number, @Query("locale") locale = "uk") {
    return this.ambListService.getById(id, locale);
  }
}

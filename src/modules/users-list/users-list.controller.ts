import { Controller, Get, Query } from "@nestjs/common";
import { UsersListService } from "./users-list.service";

@Controller("users")
export class UsersListController {
  constructor(private readonly usersListService: UsersListService) {}

  /**
   * GET /users
   * GET /users?paid=true
   * GET /users?paid=false
   */
  @Get()
  async getUsers(@Query("paid") paid?: string) {
    return this.usersListService.getUsers(paid);
  }
}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/entities/user.entity";
import { UsersListController } from "./users-list.controller";
import { UsersListService } from "./users-list.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersListController],
  providers: [UsersListService],
})
export class UsersListModule {}

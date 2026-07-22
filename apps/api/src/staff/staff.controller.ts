import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { IsEmail, IsIn, IsString, MinLength } from "class-validator";
import { StaffService } from "./staff.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import type { Role } from "../db/schema";

class CreateStaffDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(8) password!: string;
  @IsIn(["ADMIN", "STORE_MANAGER", "CASHIER"]) role!: Role;
}
class UpdateRoleDto {
  @IsIn(["ADMIN", "STORE_MANAGER", "CASHIER"]) role!: Role;
}

// Staff account + role management (PRD Req. 40) — admin only.
@Roles("ADMIN")
@Controller("staff")
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list() {
    return this.staff.list();
  }

  @Post()
  create(@Body() dto: CreateStaffDto, @CurrentUser() user: AuthUser) {
    return this.staff.create(dto, user.id);
  }

  @Patch(":id/role")
  updateRole(@Param("id") id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: AuthUser) {
    return this.staff.updateRole(id, dto.role, user.id);
  }
}

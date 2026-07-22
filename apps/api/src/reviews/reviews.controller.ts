import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import { ReviewsService } from "./reviews.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";

class ResolveDto {
  @IsIn(["BACKORDER", "SUBSTITUTION", "REFUND"]) resolution!: "BACKORDER" | "SUBSTITUTION" | "REFUND";
  @IsOptional() @IsString() note?: string;
}

// Offline-oversell review queue (PRD Req. 37, 42).
@Roles("ADMIN", "STORE_MANAGER")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  pending() {
    return this.reviews.listPending();
  }

  @Post(":id/resolve")
  resolve(@Param("id") id: string, @Body() dto: ResolveDto, @CurrentUser() user: AuthUser) {
    return this.reviews.resolve(id, dto.resolution, user.id, dto.note);
  }
}

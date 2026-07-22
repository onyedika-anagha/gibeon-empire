import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsInt, IsISO8601, IsString, Min, ValidateNested } from "class-validator";
import { SyncService, type OutboxSale } from "./sync.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import type { PaymentMethod } from "../db/schema";

class OutboxItemDto {
  @IsString() variantId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsInt() @Min(0) unitPrice!: number;
}
class OutboxSaleDto {
  @IsString() clientId!: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OutboxItemDto)
  items!: OutboxItemDto[];
  @IsIn(["CARD", "CASH", "TRANSFER", "SPLIT"]) method!: PaymentMethod;
  @IsInt() @Min(0) discountTotal!: number;
  @IsISO8601() soldAt!: string;
}
class PushDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OutboxSaleDto)
  sales!: OutboxSaleDto[];
}

// Offline POS sync (PRD Req. 35). Staff-only.
@Roles("ADMIN", "STORE_MANAGER", "CASHIER")
@Controller("sync")
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @HttpCode(200)
  @Post("pull")
  pull() {
    return this.sync.pull();
  }

  @HttpCode(200)
  @Post("push")
  push(@Body() dto: PushDto, @CurrentUser() user: AuthUser) {
    return this.sync.push(dto.sales as OutboxSale[], user.id);
  }
}

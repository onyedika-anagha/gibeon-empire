import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import type { OrderState } from "../../db/schema";

export class OrderItemDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsIn(["ONLINE", "POS"])
  channel!: "ONLINE" | "POS";

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  discountTotal?: number;
}

export class AdvanceOrderDto {
  @IsIn(["PICKING", "PACKING", "DISPATCH", "DELIVERED", "COMPLETED"])
  to!: OrderState;
}

import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import type { CouponScope, CouponType } from "../../db/schema";

export class CreateCouponDto {
  // Optional: omit to auto-generate (slug-rule). If given, it's an admin-chosen code.
  @IsOptional() @IsString() code?: string;
  @IsIn(["PERCENTAGE", "FIXED"]) type!: CouponType;
  @IsInt() @Min(1) value!: number; // % → basis points; FIXED → minor units
  @IsOptional() @IsIn(["ORDER", "PRODUCT", "CATEGORY"]) scope?: CouponScope;
  @IsOptional() @IsArray() @IsString({ each: true }) scopeValues?: string[];
  @IsOptional() @IsInt() @Min(0) minSubtotal?: number;
  @IsOptional() @IsInt() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perCustomerLimit?: number;
  @IsOptional() @IsISO8601() startsAt?: string;
  @IsOptional() @IsISO8601() endsAt?: string;
}

export class UpdateCouponDto {
  @IsOptional() @IsIn(["PERCENTAGE", "FIXED"]) type?: CouponType;
  @IsOptional() @IsInt() @Min(1) value?: number;
  @IsOptional() @IsIn(["ORDER", "PRODUCT", "CATEGORY"]) scope?: CouponScope;
  @IsOptional() @IsArray() @IsString({ each: true }) scopeValues?: string[];
  @IsOptional() @IsInt() @Min(0) minSubtotal?: number;
  @IsOptional() @IsInt() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perCustomerLimit?: number;
  @IsOptional() @IsISO8601() startsAt?: string | null;
  @IsOptional() @IsISO8601() endsAt?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
}

class ValidateItemDto {
  @IsString() variantId!: string;
  @IsInt() @Min(1) quantity!: number;
}

export class ValidateCouponDto {
  @IsString() code!: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ValidateItemDto)
  items!: ValidateItemDto[];
}

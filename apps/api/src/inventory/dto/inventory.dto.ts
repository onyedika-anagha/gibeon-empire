import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class AdjustStockDto {
  @IsUUID()
  variantId!: string;

  @IsIn(["set", "delta"])
  mode!: "set" | "delta";

  @IsInt()
  value!: number;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;
}

export class DeductStockDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsUUID()
  locationId?: string;
}

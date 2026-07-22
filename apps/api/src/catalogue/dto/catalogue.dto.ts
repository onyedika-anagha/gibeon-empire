import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

// Note: no `slug` or `sku` fields — those are backend-generated (slug-rule).

export class CreateMediaDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsIn(["IMAGE", "VIDEO"])
  kind?: "IMAGE" | "VIDEO";

  @IsOptional()
  @IsString()
  alt?: string;
}

export class CreateVariantDto {
  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsInt()
  @Min(0)
  price!: number; // minor units

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialQuantity?: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category!: string;

  @IsString()
  brand!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media?: CreateMediaDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  minPrice?: number;

  @IsOptional()
  @IsInt()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  q?: string;
}

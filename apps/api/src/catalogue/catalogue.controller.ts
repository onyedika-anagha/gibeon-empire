import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import {
  CreateProductDto,
  CreateVariantDto,
  ProductQueryDto,
  UpdateProductDto,
  UpdateVariantDto,
} from "./dto/catalogue.dto";

@Controller("products")
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  // ── Public storefront reads ─────────────────────────────────────────
  @Public()
  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.catalogue.list(query);
  }

  @Public()
  @Get(":slug")
  getBySlug(@Param("slug") slug: string) {
    return this.catalogue.getBySlug(slug);
  }

  // ── Admin writes (only human write path — PRD Req. 25, 38) ──────────
  @Roles("ADMIN", "STORE_MANAGER")
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.catalogue.createProduct(dto, user.id);
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Post(":id/variants")
  addVariant(
    @Param("id") productId: string,
    @Body() dto: CreateVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogue.createVariant(productId, dto, user.id);
  }

  // Declared before PATCH :id so "variants" isn't captured as a product id.
  @Roles("ADMIN", "STORE_MANAGER")
  @Patch("variants/:variantId")
  updateVariant(
    @Param("variantId") variantId: string,
    @Body() dto: UpdateVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogue.updateVariant(variantId, dto, user.id);
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthUser) {
    return this.catalogue.updateProduct(id, dto, user.id);
  }
}

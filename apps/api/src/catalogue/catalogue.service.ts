import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gte, ilike, inArray, lte } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { inventory, productMedia, products, variants } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { generateSku, isUniqueViolation, shortSuffix, slugify } from "../common/slug";
import type {
  CreateProductDto,
  CreateVariantDto,
  ProductQueryDto,
  UpdateProductDto,
  UpdateVariantDto,
} from "./dto/catalogue.dto";

async function withUniqueRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (isUniqueViolation(err) && i < attempts - 1) continue; // regenerate slug/SKU, retry
      throw err;
    }
  }
  throw new Error("unreachable");
}

@Injectable()
export class CatalogueService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ── Admin writes (PRD Req. 25, 38) ──────────────────────────────────
  async createProduct(dto: CreateProductDto, actor: string) {
    const locationId = await this.inventoryService.getDefaultLocationId();

    const productId = await withUniqueRetry(() =>
      this.db.transaction(async (tx) => {
        const [product] = await tx
          .insert(products)
          .values({
            name: dto.name,
            slug: `${slugify(dto.name)}-${shortSuffix()}`, // regenerated on collision
            description: dto.description ?? "",
            category: dto.category,
            brand: dto.brand,
          })
          .returning({ id: products.id });

        if (dto.media?.length) {
          await tx.insert(productMedia).values(
            dto.media.map((m, i) => ({
              productId: product.id,
              url: m.url,
              kind: m.kind ?? "IMAGE",
              alt: m.alt,
              position: i,
            })),
          );
        }

        for (const v of dto.variants) {
          const [variant] = await tx
            .insert(variants)
            .values({
              productId: product.id,
              sku: generateSku(), // regenerated on collision
              size: v.size,
              color: v.color,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              barcode: v.barcode,
            })
            .returning({ id: variants.id });

          // Inventory is created here at the default location (PRD Req. 22).
          await tx.insert(inventory).values({
            variantId: variant.id,
            locationId,
            quantity: v.initialQuantity ?? 0,
          });
        }

        await this.audit.record(
          {
            actor,
            action: "product.create",
            entity: "product",
            entityId: product.id,
            data: { name: dto.name, variants: dto.variants.length },
          },
          tx as unknown as DrizzleDB,
        );

        return product.id;
      }),
    );

    return this.getById(productId);
  }

  async updateProduct(id: string, dto: UpdateProductDto, actor: string) {
    // slug is immutable (slug-rule) — deliberately not touched here.
    const [updated] = await this.db
      .update(products)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!updated) throw new NotFoundException("Product not found");

    await this.audit.record({
      actor,
      action: "product.update",
      entity: "product",
      entityId: id,
      data: dto,
    });
    return this.getById(id);
  }

  async createVariant(productId: string, dto: CreateVariantDto, actor: string) {
    const locationId = await this.inventoryService.getDefaultLocationId();
    const variantId = await withUniqueRetry(() =>
      this.db.transaction(async (tx) => {
        const [variant] = await tx
          .insert(variants)
          .values({
            productId,
            sku: generateSku(),
            size: dto.size,
            color: dto.color,
            price: dto.price,
            compareAtPrice: dto.compareAtPrice,
            barcode: dto.barcode,
          })
          .returning({ id: variants.id });
        await tx.insert(inventory).values({
          variantId: variant.id,
          locationId,
          quantity: dto.initialQuantity ?? 0,
        });
        await this.audit.record(
          { actor, action: "variant.create", entity: "variant", entityId: variant.id, data: { productId } },
          tx as unknown as DrizzleDB,
        );
        return variant.id;
      }),
    );
    return variantId;
  }

  async updateVariant(id: string, dto: UpdateVariantDto, actor: string) {
    const [before] = await this.db
      .select({ price: variants.price })
      .from(variants)
      .where(eq(variants.id, id));
    if (!before) throw new NotFoundException("Variant not found");

    await this.db.update(variants).set(dto).where(eq(variants.id, id));

    const priceChanged = dto.price != null && dto.price !== before.price;
    await this.audit.record({
      actor,
      action: priceChanged ? "price.update" : "variant.update",
      entity: "variant",
      entityId: id,
      data: priceChanged ? { from: before.price, to: dto.price } : dto,
    });
    return { id, ...dto };
  }

  // ── Storefront reads (PRD Req. 1, 2, 10) ────────────────────────────
  async list(query: ProductQueryDto) {
    const hasVariantFilter =
      query.size || query.color || query.minPrice != null || query.maxPrice != null;

    let candidateProductIds: string[] | undefined;
    if (hasVariantFilter) {
      const vConds = [
        query.size ? eq(variants.size, query.size) : undefined,
        query.color ? eq(variants.color, query.color) : undefined,
        query.minPrice != null ? gte(variants.price, query.minPrice) : undefined,
        query.maxPrice != null ? lte(variants.price, query.maxPrice) : undefined,
      ].filter(Boolean);
      const matched = await this.db
        .selectDistinct({ productId: variants.productId })
        .from(variants)
        .where(and(...vConds));
      candidateProductIds = matched.map((m) => m.productId);
      if (candidateProductIds.length === 0) return [];
    }

    const pConds = [
      query.category ? eq(products.category, query.category) : undefined,
      query.q ? ilike(products.name, `%${query.q}%`) : undefined,
      candidateProductIds ? inArray(products.id, candidateProductIds) : undefined,
    ].filter(Boolean);

    const rows = await this.db
      .select()
      .from(products)
      .where(pConds.length ? and(...pConds) : undefined);

    return this.hydrate(rows);
  }

  async getBySlug(slug: string) {
    const [product] = await this.db.select().from(products).where(eq(products.slug, slug));
    if (!product) throw new NotFoundException("Product not found");
    const [full] = await this.hydrate([product]);
    return full;
  }

  private async getById(id: string) {
    const [product] = await this.db.select().from(products).where(eq(products.id, id));
    if (!product) throw new NotFoundException("Product not found");
    const [full] = await this.hydrate([product]);
    return full;
  }

  /** Attach media + variants (with stock state) to a set of products. */
  private async hydrate(rows: (typeof products.$inferSelect)[]) {
    if (rows.length === 0) return [];
    const productIds = rows.map((p) => p.id);

    const [media, vars] = await Promise.all([
      this.db.select().from(productMedia).where(inArray(productMedia.productId, productIds)),
      this.db.select().from(variants).where(inArray(variants.productId, productIds)),
    ]);
    const stock = await this.inventoryService.getStockStates(vars.map((v) => v.id));
    const stockByVariant = new Map(stock.map((s) => [s.variantId, s]));

    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category: p.category,
      brand: p.brand,
      media: media
        .filter((m) => m.productId === p.id)
        .sort((a, b) => a.position - b.position)
        .map((m) => ({ id: m.id, url: m.url, kind: m.kind, alt: m.alt })),
      variants: vars
        .filter((v) => v.productId === p.id)
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          barcode: v.barcode,
          stock: stockByVariant.get(v.id) ?? { variantId: v.id, state: "sold_out" as const },
        })),
    }));
  }
}

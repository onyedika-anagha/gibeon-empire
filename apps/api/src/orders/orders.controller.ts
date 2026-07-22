import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { AdvanceOrderDto, CreateOrderDto } from "./dto/order.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Public so guests can check out (PRD Req. 5). A valid bearer attaches the customer.
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    const customerId = user?.type === "customer" ? user.id : undefined;
    return this.orders.create(dto, customerId, user?.id ?? "system");
  }

  // A logged-in customer's own order history (PRD Req. 7, 8).
  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.listForCustomer(user.id);
  }

  // Staff-wide order oversight (PRD Req. 41). Declared before :reference.
  @Roles("ADMIN", "STORE_MANAGER")
  @Get("admin/all")
  adminList(@Query("state") state?: string) {
    return this.orders.listAll(state);
  }

  // Authenticated order tracking (PRD Req. 8) — customer sees own, staff any.
  @Get(":reference")
  track(@Param("reference") reference: string, @CurrentUser() user: AuthUser) {
    return this.orders.getByReference(reference, user);
  }

  // Staff-driven fulfilment steps (PRD Req. 41).
  @Roles("ADMIN", "STORE_MANAGER")
  @Post(":id/advance")
  advance(@Param("id") id: string, @Body() dto: AdvanceOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.advance(id, dto.to, user.id);
  }
}

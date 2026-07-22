import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { InventoryModule } from "../inventory/inventory.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [InventoryModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

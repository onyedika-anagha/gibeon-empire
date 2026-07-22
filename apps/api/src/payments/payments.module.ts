import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PaystackAdapter } from "./paystack.adapter";
import { FlutterwaveAdapter } from "./flutterwave.adapter";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackAdapter, FlutterwaveAdapter],
  exports: [PaymentsService],
})
export class PaymentsModule {}

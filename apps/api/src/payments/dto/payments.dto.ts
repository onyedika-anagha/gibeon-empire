import { IsIn, IsUUID } from "class-validator";
import type { PaymentProvider } from "../../db/schema";

export class InitializePaymentDto {
  @IsUUID()
  orderId!: string;
}

export class SetProviderDto {
  @IsIn(["PAYSTACK", "FLUTTERWAVE"])
  provider!: PaymentProvider;
}

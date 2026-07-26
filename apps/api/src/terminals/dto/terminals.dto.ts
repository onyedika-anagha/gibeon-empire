import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import type { TerminalPaymentMethod } from "../terminal-provider.interface";

export class TerminalPushDto {
  @IsString() reference!: string;
  @IsInt() @Min(1) amount!: number; // minor units (kobo)
  @IsOptional() @IsString() terminalSerial?: string;
  @IsOptional() @IsIn(["CARD_PURCHASE", "POS_TRANSFER", "ANY"])
  paymentMethod?: TerminalPaymentMethod;
}

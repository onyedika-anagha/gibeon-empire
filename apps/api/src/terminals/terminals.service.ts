import { BadRequestException, Injectable } from "@nestjs/common";
import { MoniepointAdapter } from "./moniepoint.adapter";
import type {
  TerminalPaymentMethod,
  TerminalProviderAdapter,
} from "./terminal-provider.interface";

@Injectable()
export class TerminalsService {
  constructor(private readonly moniepoint: MoniepointAdapter) {}

  // Falls back to a single configured terminal so a one-till store needn't send a serial.
  private readonly defaultSerial = process.env.MONIEPOINT_TERMINAL_SERIAL ?? "";

  // ponytail: one provider today; select here (settings toggle) when a second vendor lands.
  private get provider(): TerminalProviderAdapter {
    return this.moniepoint;
  }

  async push(params: {
    reference: string;
    amount: number;
    terminalSerial?: string;
    paymentMethod?: TerminalPaymentMethod;
  }) {
    const terminalSerial = params.terminalSerial || this.defaultSerial;
    if (!terminalSerial) {
      throw new BadRequestException("No terminal serial provided and none configured");
    }
    return this.provider.push({
      reference: params.reference,
      amount: params.amount,
      terminalSerial,
      paymentMethod: params.paymentMethod,
    });
  }

  status(reference: string) {
    return this.provider.status(reference);
  }
}

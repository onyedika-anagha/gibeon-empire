import { Module } from "@nestjs/common";
import { TerminalsController } from "./terminals.controller";
import { TerminalsService } from "./terminals.service";
import { MoniepointAdapter } from "./moniepoint.adapter";

@Module({
  controllers: [TerminalsController],
  providers: [TerminalsService, MoniepointAdapter],
  exports: [TerminalsService],
})
export class TerminalsModule {}

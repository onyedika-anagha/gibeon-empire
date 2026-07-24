import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsService, NOTIFICATIONS_QUEUE } from "./notifications.service";
import { MailerService } from "./mailer.service";

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [NotificationsService, NotificationsProcessor, MailerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

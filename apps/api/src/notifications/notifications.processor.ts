import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { NOTIFICATIONS_QUEUE, type OrderConfirmationJob } from "./notifications.service";

/**
 * Background worker. ponytail: "sends" by logging — swap the send() body for a
 * real mailer (Resend/SES/etc.). The queue + retry semantics are already real.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<OrderConfirmationJob>): Promise<void> {
    if (job.name === "order-confirmation") {
      const { email, orderReference, total } = job.data;
      this.logger.log(`✉ order ${orderReference} confirmed → ${email} (total ${total})`);
    }
  }
}

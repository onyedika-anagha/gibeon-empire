import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { NOTIFICATIONS_QUEUE, type OrderConfirmationJob } from "./notifications.service";
import { orderConfirmationEmail } from "./order-confirmation.template";
import { MailerService } from "./mailer.service";

/** Background worker: renders the receipt and sends it. Failures retry (3×, backoff). */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<OrderConfirmationJob>): Promise<void> {
    if (job.name !== "order-confirmation") return;

    const { subject, html, text } = orderConfirmationEmail(job.data);
    await this.mailer.send({ to: job.data.email, subject, html, text });
    this.logger.log(`order ${job.data.orderReference} receipt dispatched`);
  }
}

import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const NOTIFICATIONS_QUEUE = "notifications";

export interface OrderConfirmationJob {
  orderReference: string;
  email: string;
  total: number;
}

/**
 * Enqueues side-effect work so checkout is never blocked by a third-party
 * service (PRD Req. 21). Phase 1 sends order emails; WhatsApp/SMS are Phase 2.
 */
@Injectable()
export class NotificationsService {
  constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue) {}

  async enqueueOrderConfirmation(job: OrderConfirmationJob): Promise<void> {
    await this.queue.add("order-confirmation", job, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
    });
  }
}

import { Injectable, Logger } from "@nestjs/common";

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * ponytail: Resend over plain fetch — no SDK, no SMTP dependency. Swap the body
 * of send() for SES/Postmark if you move provider; the queue retries either way.
 * With no RESEND_API_KEY (dev), it logs instead of sending.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly apiKey = process.env.RESEND_API_KEY ?? "";
  private readonly from = process.env.MAIL_FROM ?? "Gibeon Empire <orders@gibeonempire.com>";

  async send(email: Email): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`RESEND_API_KEY unset — not sending "${email.subject}" to ${email.to}`);
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    if (!res.ok) {
      // Throwing hands it back to BullMQ, which retries with backoff.
      const body = await res.text().catch(() => "");
      throw new Error(`Email send failed (${res.status}): ${body.slice(0, 200)}`);
    }
    this.logger.log(`✉ sent "${email.subject}" to ${email.to}`);
  }
}

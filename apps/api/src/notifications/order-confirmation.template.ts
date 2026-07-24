import type { OrderConfirmationJob } from "./notifications.service";

function money(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Plain-table receipt — email clients are not browsers; no flexbox, no external CSS. */
export function orderConfirmationEmail(job: OrderConfirmationJob): {
  subject: string;
  html: string;
  text: string;
} {
  const rate = (job.taxRate / 100).toFixed(job.taxRate % 100 === 0 ? 0 : 1);
  const lines = job.items.map(
    (i) => `${i.quantity} × ${i.nameSnapshot} — ${money(i.unitPrice * i.quantity)}`,
  );

  const rows = job.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;color:#3d3833;">${escapeHtml(i.nameSnapshot)} <span style="color:#9a9086;">×${i.quantity}</span></td>
        <td style="padding:8px 0;text-align:right;color:#1f1b17;">${money(i.unitPrice * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `<tr>
      <td style="padding:4px 0;color:${strong ? "#1f1b17" : "#6b635a"};${strong ? "font-weight:600;" : ""}">${label}</td>
      <td style="padding:4px 0;text-align:right;color:#1f1b17;${strong ? "font-weight:600;font-size:18px;" : ""}">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#f7f3ee;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdfa;border-radius:16px;padding:32px;">
        <tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a9086;">Gibeon Empire</td></tr>
        <tr><td style="padding-top:12px;font-size:26px;color:#1f1b17;">Thank you for your order.</td></tr>
        <tr><td style="padding-top:10px;font-size:15px;color:#6b635a;line-height:1.6;">
          Your payment is confirmed and order <strong style="color:#1f1b17;">${escapeHtml(job.orderReference)}</strong> is being prepared. We'll be in touch when it ships.
        </td></tr>
        <tr><td style="padding-top:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;font-family:Helvetica,Arial,sans-serif;">
            ${rows}
            <tr><td colspan="2" style="border-top:1px solid #e8e0d6;padding-top:12px;"></td></tr>
            ${totalRow("Subtotal", money(job.subtotal))}
            ${job.discountTotal > 0 ? totalRow("Discount", `−${money(job.discountTotal)}`) : ""}
            ${job.taxTotal > 0 ? totalRow(`VAT (${rate}%)`, money(job.taxTotal)) : ""}
            ${totalRow("Total paid", money(job.total), true)}
          </table>
        </td></tr>
        <tr><td style="padding-top:28px;font-size:12px;color:#9a9086;font-family:Helvetica,Arial,sans-serif;">
          Keep this receipt for your records. Questions? Reply to this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Thank you for your order.`,
    ``,
    `Order ${job.orderReference} — payment confirmed.`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${money(job.subtotal)}`,
    ...(job.discountTotal > 0 ? [`Discount: -${money(job.discountTotal)}`] : []),
    ...(job.taxTotal > 0 ? [`VAT (${rate}%): ${money(job.taxTotal)}`] : []),
    `Total paid: ${money(job.total)}`,
    ``,
    `Gibeon Empire`,
  ].join("\n");

  return { subject: `Your Gibeon Empire order ${job.orderReference}`, html, text };
}

import { orderConfirmationEmail } from "./order-confirmation.template";

const job = {
  orderReference: "GE-TEST-01",
  email: "buyer@example.com",
  items: [
    { nameSnapshot: "Solene Linen Dress — M/Sand", quantity: 2, unitPrice: 23_000 },
    { nameSnapshot: "Empress Wool Coat — L/Noir", quantity: 1, unitPrice: 48_000 },
  ],
  subtotal: 94_000,
  discountTotal: 0,
  taxTotal: 7_050,
  taxRate: 750,
  total: 101_050,
};

describe("order confirmation receipt", () => {
  it("shows every line, the VAT rate, and the total actually paid", () => {
    const { subject, html, text } = orderConfirmationEmail(job);

    expect(subject).toContain("GE-TEST-01");
    for (const body of [html, text]) {
      expect(body).toContain("Solene Linen Dress");
      expect(body).toContain("₦460.00"); // 2 × ₦230 line total
      expect(body).toContain("₦940.00"); // subtotal
      expect(body).toContain("VAT (7.5%)");
      expect(body).toContain("₦1,010.50"); // total paid
    }
  });

  it("omits the discount and VAT rows when they are zero", () => {
    const { html } = orderConfirmationEmail({ ...job, discountTotal: 0, taxTotal: 0, taxRate: 0 });
    expect(html).not.toContain("VAT (");
    expect(html).not.toContain("Discount");
  });

  it("escapes product names so a quote in the catalogue can't break the markup", () => {
    const { html } = orderConfirmationEmail({
      ...job,
      items: [{ nameSnapshot: `Slip <b>"Noir"</b>`, quantity: 1, unitPrice: 100 }],
    });
    expect(html).toContain("Slip &lt;b&gt;&quot;Noir&quot;&lt;/b&gt;");
  });
});

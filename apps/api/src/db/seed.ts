import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as bcrypt from "bcrypt";
import { schema, locations, settings, staff, type Role } from "./schema";

async function main() {
  const client = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const db = drizzle(client, { schema });

  // Default stock location.
  await db
    .insert(locations)
    .values({ name: "Flagship Atelier", isDefault: true })
    .onConflictDoNothing();

  // Active payment provider toggle (PRD Req. 29) — defaults to Paystack.
  await db
    .insert(settings)
    .values({ key: "activePaymentProvider", value: "PAYSTACK" })
    .onConflictDoNothing();

  // One staff account per role.
  const passwordHash = await bcrypt.hash("password123", 12);
  const seedStaff: Array<{ email: string; name: string; role: Role }> = [
    { email: "admin@gibeonempire.com", name: "Admin", role: "ADMIN" },
    { email: "manager@gibeonempire.com", name: "Store Manager", role: "STORE_MANAGER" },
    { email: "cashier@gibeonempire.com", name: "Cashier", role: "CASHIER" },
  ];
  for (const s of seedStaff) {
    await db.insert(staff).values({ ...s, passwordHash }).onConflictDoNothing();
  }

  // eslint-disable-next-line no-console
  console.log("Seeded: default location, payment setting, 3 staff accounts.");
  await client.end();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

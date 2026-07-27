import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { DbModule } from "./db/db.module";
import { AuditModule } from "./common/audit/audit.module";
import { SettingsModule } from "./settings/settings.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogueModule } from "./catalogue/catalogue.module";
import { MediaModule } from "./media/media.module";
import { InventoryModule } from "./inventory/inventory.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { StaffModule } from "./staff/staff.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { SyncModule } from "./sync/sync.module";
import { TerminalsModule } from "./terminals/terminals.module";
import { CouponsModule } from "./coupons/coupons.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";

// BullMQ's Redis connection. Prefer REDIS_URL (Railway/managed) — parsed so the
// password, rediss:// TLS, and Railway's IPv6 private network all work; falls
// back to host/port for local dev. maxRetriesPerRequest:null is BullMQ's
// requirement for blocking workers.
function redisConnection() {
  const url = process.env.REDIS_URL;
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 6379),
      username: u.username || undefined,
      password: u.password || undefined,
      family: 0, // allow IPv6 — Railway's *.railway.internal resolves over v6
      tls: u.protocol === "rediss:" ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  }
  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    maxRetriesPerRequest: null,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Baseline rate limiting (PRD NFR: security). Login routes tighten this further.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    BullModule.forRoot({ connection: redisConnection() }),
    DbModule,
    AuditModule,
    SettingsModule,
    AuthModule,
    InventoryModule,
    CatalogueModule,
    MediaModule,
    NotificationsModule,
    OrdersModule,
    PaymentsModule,
    StaffModule,
    ReviewsModule,
    SyncModule,
    TerminalsModule,
    CouponsModule,
  ],
  providers: [
    // Rate limiter runs first.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Auth is on by default everywhere; opt out per-route with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Runs after JwtAuthGuard; enforces @Roles() where present.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

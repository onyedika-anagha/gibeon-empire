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
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Baseline rate limiting (PRD NFR: security). Login routes tighten this further.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
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

import { Global, Inject, Module, OnModuleDestroy } from "@nestjs/common";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

export const DRIZZLE = Symbol("DRIZZLE");
export const PG_CLIENT = Symbol("PG_CLIENT");

export type DrizzleDB = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: PG_CLIENT,
      useFactory: () =>
        postgres(process.env.DATABASE_URL ?? "", { max: 10, onnotice: () => {} }),
    },
    {
      provide: DRIZZLE,
      inject: [PG_CLIENT],
      useFactory: (client: postgres.Sql) => drizzle(client, { schema }),
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(PG_CLIENT) private readonly client: postgres.Sql) {}

  async onModuleDestroy() {
    await this.client.end();
  }
}

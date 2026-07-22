import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  // rawBody enables signature verification of payment webhooks.
  const app = await NestFactory.create(AppModule, { bufferLogs: false, rawBody: true });

  // Secure HTTP headers (PRD NFR: security).
  app.use(helmet());

  app.setGlobalPrefix("api");

  // Reject unknown fields and coerce DTO types at the trust boundary.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const origins = (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Gibeon API listening on http://localhost:${port}/api`);
}

void bootstrap();

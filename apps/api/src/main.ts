import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: getAllowedOrigins() });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`school-erp api listening on :${port}/api/v1`);
}

/**
 * CORS_ORIGINS is a comma-separated allowlist (env), never a wildcard —
 * `app.enableCors()` with no options (the previous behavior) reflects
 * ANY origin, which is fine for a throwaway local sandbox but unsafe the
 * moment this config ships to a shared/staging/prod environment.
 */
function getAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

bootstrap();

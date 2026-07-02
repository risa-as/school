import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

/**
 * `tsc` and the pure-logic unit tests never bootstrap the actual Nest module
 * graph, so DI wiring, guard resolution, and middleware registration
 * (`consumer.apply(TenantContextMiddleware).forRoutes('*')` in particular —
 * NestJS 11 ships on Express 5 / path-to-regexp v8, which is known to reject
 * some legacy wildcard route patterns) go completely unverified by `pnpm
 * build` + `pnpm test` alone. This test bootstraps the real AppModule end to
 * end with only PrismaService stubbed out (no live Postgres required, per
 * project convention — every other provider, guard, and controller in the
 * graph is real).
 */
describe('AppModule bootstrap (smoke)', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('resolves the full DI graph and registers global middleware without a live database', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        client: {},
        onModuleInit: async () => undefined,
        onModuleDestroy: async () => undefined,
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    expect(app.getHttpServer()).toBeDefined();
  });
});

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantScopingExtension } from './tenant-scoping.extension';

function buildExtendedClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  }).$extends(tenantScopingExtension);
}

export type ExtendedPrismaClient = ReturnType<typeof buildExtendedClient>;

/**
 * Wraps a tenant-scoping-extended Prisma Client for Nest DI.
 *
 * Deliberately exposes the extended client via `.client` rather than
 * `class PrismaService extends PrismaClient` — `$extends()` returns a new
 * client type that a subclass cannot faithfully re-expose under strict
 * TypeScript. Inject `PrismaService` and call `prisma.client.<model>...`.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client: ExtendedPrismaClient = buildExtendedClient();

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}

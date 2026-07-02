import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AcademicsModule } from './academics/academics.module';
import { TenantContextMiddleware } from './common/tenant-context/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    StudentsModule,
    AcademicsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Runs for every request; resolves X-Tenant-Id into AsyncLocalStorage.
    // See common/tenant-context/tenant-context.middleware.ts for why this is
    // permissive (no header != rejected request — enforcement happens in
    // the Prisma tenant-scoping extension instead).
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}

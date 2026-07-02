import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

/**
 * @Global() — every feature module protects its routes with
 * `@UseGuards(JwtAuthGuard, PermissionsGuard)`, referenced by class (not
 * instance) so Nest can inject their own dependencies (JwtService,
 * ConfigService, Reflector). That class-reference lookup only reliably
 * resolves across module boundaries when the exporting module is global —
 * requiring every feature module to `imports: [AuthModule]` is easy to
 * forget and fails at Nest bootstrap, not at compile time (caught here by
 * app.smoke.spec.ts, which actually calls app.init()).
 */
@Global()
@Module({
  // `global: true` matters here, not just @Global() on AuthModule itself:
  // whichever module ends up constructing a JwtAuthGuard instance (see the
  // comment above) needs JwtService reachable from ITS OWN injector too —
  // @Global() on AuthModule alone was not sufficient (caught by
  // app.smoke.spec.ts: "argument JwtService ... available in the UsersModule
  // module").
  imports: [JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
  exports: [JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}

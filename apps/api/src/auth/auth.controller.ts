import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthUser } from "./auth.types";
import {
  LoginDto,
  RegisterDto,
  RequestResetDto,
  ResetPasswordDto,
  TotpVerifyDto,
} from "./dto/auth.dto";

// Credential endpoints are rate-limited harder than the global default.
@Throttle({ default: { ttl: 60000, limit: 10 } })
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.registerCustomer(dto);
  }

  @Public()
  @HttpCode(200)
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.loginCustomer(dto);
  }

  @Public()
  @HttpCode(200)
  @Post("password/request-reset")
  requestReset(@Body() dto: RequestResetDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Public()
  @HttpCode(200)
  @Post("password/reset")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Public()
  @HttpCode(200)
  @Post("staff/login")
  staffLogin(@Body() dto: LoginDto) {
    return this.auth.loginStaff(dto);
  }

  @Public()
  @HttpCode(200)
  @Post("staff/totp/verify")
  verifyTotp(@Body() dto: TotpVerifyDto) {
    return this.auth.verifyStaffTotp(dto);
  }

  /** Returns the authenticated principal — proves the JWT guard works. */
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}

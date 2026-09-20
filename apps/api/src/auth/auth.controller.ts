import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestUser } from '../common/types/auth-context';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RefreshSchema,
  RegisterInstitutionSchema,
  ResetPasswordSchema,
} from '@sanro/validation';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('register-institution')
  registerInstitution(@Body(new ZodValidationPipe(RegisterInstitutionSchema)) body: unknown) {
    const data = body as {
      institutionName: string;
      institutionType: 'SCHOOL' | 'COACHING_CENTRE';
      adminName: string;
      adminEmail: string;
      adminPhone?: string;
      adminPassword: string;
    };
    return this.authService.registerInstitution(data);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body(new ZodValidationPipe(LoginSchema)) body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body(new ZodValidationPipe(RefreshSchema)) body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: RequestUser) {
    await this.authService.logout(user.sub, user.jti);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('switch-context')
  async switchContext(
    @CurrentUser() user: RequestUser,
    @Body() body: { institutionId: string; role: 'INSTITUTION_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' },
  ) {
    if (!body.institutionId || !body.role) {
      throw new UnauthorizedException('institutionId and role are required');
    }
    return this.authService.switchContext(user.sub, body.institutionId, body.role);
  }

  @Get('account-state')
  async accountState(@CurrentUser() user: RequestUser) {
    return this.authService.accountState(user.sub, user.role, user.institutionId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body(new ZodValidationPipe(ForgotPasswordSchema)) body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: { token: string; password: string },
  ) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.sub);
  }
}
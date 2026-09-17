import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactLeadSchema } from '@sanro/validation';
import { Public } from '../common/decorators/auth.decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SiteService } from './site.service';

@ApiTags('site')
@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('contact')
  async contact(@Body(new ZodValidationPipe(ContactLeadSchema)) body: {
    name: string;
    email: string;
    role: string;
    message: string;
    source?: string;
    website?: string;
  }) {
    if (body.website) {
      return { success: true };
    }
    await this.siteService.createContactLead({
      name: body.name,
      email: body.email,
      role: body.role,
      message: body.message,
      source: body.source ?? 'website',
    });
    return { success: true };
  }
}
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_CONFIG_TOKEN } from './common/common.constants';
import { AppConfig } from './config/app.config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const config = app.get<AppConfig>(APP_CONFIG_TOKEN);

  if (config.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: !!process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  if (config.NODE_ENV === 'production' && config.AUTH_SECRET.startsWith('dev-')) {
    const logger = new Logger('Bootstrap');
    logger.fatal('AUTH_SECRET must not use the default value in production. Set a secure 32+ character secret.');
    process.exit(1);
  }

  app.setGlobalPrefix('api/v1');

  const corsOrigins =
    config.CORS_ORIGINS.length > 0
      ? config.CORS_ORIGINS
      : config.NODE_ENV === 'production'
        ? ['https://sanroai.com', 'https://app.sanroai.com', 'https://www.sanroai.com']
        : true;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swagger = new DocumentBuilder()
    .setTitle('Sanro AI API')
    .setDescription('Academic intelligence platform - assessment, diagnosis, remediation, retest')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  if (config.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.PORT ?? config.API_PORT;
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`API running at http://localhost:${port}/api/v1`);
  logger.log(`Swagger at http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start API: ${err.message}`, err.stack);
  process.exit(1);
});
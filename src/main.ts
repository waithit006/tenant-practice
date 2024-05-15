import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TenantService } from './tenant/tenant.service';
import { TenantSyncService } from './tenant/tenant-sync.service';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const tenantSyncService = app.get(TenantSyncService);

  await tenantSyncService.syncAllTenants();

  const port = configService.get('PORT') || 3000;

  const config = new DocumentBuilder()
    .addApiKey(
      { type: 'apiKey', name: 'x-tenant-id', in: 'header' },
      'tenant-id',
    )
    .addBasicAuth()
    .setTitle('Tenant practice API')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

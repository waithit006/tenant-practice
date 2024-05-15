import { Injectable, NestMiddleware, Inject, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TenantService } from 'src/tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import { createDataSourceOptions } from 'src/database/database.util';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly connectionCache = new Map<string, DataSource>();

  constructor(
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/api-doc') || req.path.startsWith('/tenants')) {
      return next();
    }

    const tenantId: string = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).send('Tenant ID is required');
    }

    const tenant = await this.tenantService.findOne(+tenantId);

    if (!tenant) {
      return res.status(404).send('Tenant not found');
    }

    let dataSource = this.connectionCache.get(tenant.database);
    if (!dataSource) {
      const dataSourceOptions = createDataSourceOptions(
        this.configService,
        tenant.database,
      );
      dataSource = new DataSource(dataSourceOptions);
      try {
        await dataSource.initialize();
        Logger.log(`Connected to database for tenant: ${tenant.name}`);
        this.connectionCache.set(tenant.database, dataSource);
      } catch (error) {
        Logger.error(
          `Failed to connect to tenant database for tenant: ${tenant.name}`,
          error,
        );
        return res.status(500).send('Failed to connect to tenant database');
      }
    }

    req['tenantConnection'] = dataSource;
    next();
  }
}

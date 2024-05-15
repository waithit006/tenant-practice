import { Injectable } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TenantService } from './tenant.service';
import { ConfigService } from '@nestjs/config';
import { createDataSourceOptions } from 'src/database/database.util';

@Injectable()
export class TenantSyncService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
  ) {}

  async syncAllTenants() {
    const tenants = await this.tenantService.findAll();

    for (const tenant of tenants) {
      const dataSourceOptions = createDataSourceOptions(
        this.configService,
        tenant.database,
      );

      const dataSource = new DataSource(dataSourceOptions);
      try {
        await dataSource.initialize();
        console.log(
          `Connected to database and synchronized schema for tenant: ${tenant.name}`,
        );
      } catch (error) {
        console.error(
          `Failed to connect and synchronize schema for tenant: ${tenant.name}`,
          error,
        );
      }
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Client } from 'pg';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { ConfigService } from '@nestjs/config';
import { createDataSourceOptions } from 'src/database/database.util';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async create(body: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      name: body.name,
      database: body.database,
    });
    await this.tenantRepository.save(tenant);
    await this.createAndSyncDatabase(tenant);
    return tenant;
  }

  async findOne(id: number): Promise<Tenant> {
    return this.tenantRepository.findOne({ where: { id } });
  }

  private async createAndSyncDatabase(tenant: Tenant) {
    // Use pg client to create the database
    const client = new Client({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
    });

    try {
      await client.connect();
      await client.query(`CREATE DATABASE ${tenant.database}`);
      console.log(
        `Database ${tenant.database} created for tenant: ${tenant.name}`,
      );
    } catch (error) {
      console.error(
        `Failed to create database for tenant: ${tenant.name}`,
        error,
      );
      throw new Error('Failed to create tenant database');
    } finally {
      await client.end();
    }

    // Connect to the newly created database and sync schema
    const dataSourceOptions = createDataSourceOptions(
      this.configService,
      tenant.database,
    );

    const dataSource = new DataSource(dataSourceOptions);
    try {
      await dataSource.initialize();
      console.log(
        `Connected to and synchronized database for tenant: ${tenant.name}`,
      );
    } catch (error) {
      console.error(
        `Failed to connect and synchronize database for tenant: ${tenant.name}`,
        error,
      );
      throw new Error('Failed to create and synchronize tenant database');
    }
  }
}

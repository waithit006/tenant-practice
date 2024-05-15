import { Controller, Get, Post, Body } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { ApiHeader, ApiTags } from '@nestjs/swagger';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll() {
    return this.tenantService.findAll();
  }

  @Post()
  async create(@Body() body: CreateTenantDto) {
    return this.tenantService.create(body);
  }
}

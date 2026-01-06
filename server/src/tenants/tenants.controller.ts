import { Controller, Get, Post, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('v1/tenants') // This sets the base path to /tenants
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() body: { name: string }) {
    return this.tenantsService.create(body.name);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }
}
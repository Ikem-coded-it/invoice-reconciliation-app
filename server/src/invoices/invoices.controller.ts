import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('v1/tenants/:tenantId/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @Body() body: { amount: string; description: string }
  ) {
    return this.invoicesService.create(tenantId, body.amount, body.description);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.invoicesService.findAll(tenantId);
  }
}
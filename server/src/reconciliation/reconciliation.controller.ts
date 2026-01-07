import { Controller, Post, Param, Get, Query } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Controller('v1/tenants/:tenantId/reconcile')
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Post()
  run(@Param('tenantId') tenantId: string) {
    return this.service.reconcile(tenantId);
  }

  @Get('explain')
  explain(
    @Param('tenantId') tenantId: string,
    @Query('invoice_id') invoiceId: string,
    @Query('transaction_id') transactionId: string
  ) {
    return this.service.explainMatch(tenantId, invoiceId, transactionId);
  }
}
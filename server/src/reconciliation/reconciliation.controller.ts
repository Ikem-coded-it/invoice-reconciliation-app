import { Controller, Post, Param } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Controller('tenants/:tenantId/reconcile')
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Post()
  run(@Param('tenantId') tenantId: string) {
    return this.service.reconcile(tenantId);
  }
}
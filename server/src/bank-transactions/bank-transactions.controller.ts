import { Controller, Post, Get, Body, Param, UseInterceptors } from '@nestjs/common';
import { BankTransactionsService } from './bank-transactions.service';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

@Controller('tenants/:tenantId/bank-transactions')
export class BankTransactionsController {
  constructor(private readonly service: BankTransactionsService) {}

  @Post('import')
  @UseInterceptors(IdempotencyInterceptor)
  async import(
    @Param('tenantId') tenantId: string,
    // Updated: Now expecting an object wrapping the transactions
    @Body() body: { transactions: string | any[] } 
  ) {
    // Pass the whole body object to the service
    return this.service.import(tenantId, body);
  }

  @Get()
  async findAll(@Param('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }
}
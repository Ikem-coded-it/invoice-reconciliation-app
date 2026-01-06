import { Module } from '@nestjs/common';
import { BankTransactionsController } from './bank-transactions.controller';
import { BankTransactionsService } from './bank-transactions.service';

@Module({
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService],
})
export class BankTransactionsModule {}
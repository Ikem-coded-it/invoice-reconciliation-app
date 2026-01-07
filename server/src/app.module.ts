import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { TenantsModule } from './tenants/tenants.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { BankTransactionsModule } from './bank-transactions/bank-transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Loads .env file
    DrizzleModule,
    TenantsModule,
    InvoicesModule,
    ReconciliationModule,
    BankTransactionsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

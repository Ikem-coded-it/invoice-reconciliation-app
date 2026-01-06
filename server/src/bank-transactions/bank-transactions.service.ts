import { Injectable, BadRequestException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { bankTransactions } from '../db/schema';

@Injectable()
export class BankTransactionsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  // Modified to accept an object containing the stringified transactions
  async import(tenantId: string, input: { transactions: string | any[] }) {
    return this.drizzleService.runWithTenant(tenantId, async (tx) => {
      
      let transactionList: any[] = [];

      // 1. Handle parsing logic
      // Case A: It's a stringified JSON string inside the object (e.g. from FormData or strict JSON payload)
      if (typeof input.transactions === 'string') {
        try {
          transactionList = JSON.parse(input.transactions);
        } catch (error) {
          throw new BadRequestException('Invalid JSON format in transactions field');
        }
      } 
      // Case B: It was already parsed as an array (e.g. standard JSON body)
      else if (Array.isArray(input.transactions)) {
        transactionList = input.transactions;
      }
      // Case C: The input itself is the array (fallback)
      else if (Array.isArray(input)) {
        transactionList = input;
      }

      // If empty or invalid, throw error
      if (!Array.isArray(transactionList) || transactionList.length === 0) {
        throw new BadRequestException('No transactions found to import');
      }

      // 2. Map the data to DB Schema
      const values = transactionList.map((t) => ({
        tenantId, 
        amount: String(t.amount), // Ensure string for decimal columns
        description: t.description,
        date: new Date(t.date),
        currency: t.currency || 'USD',
      }));

      // 3. Perform the bulk insert
      return tx.insert(bankTransactions).values(values).returning();
    });
  }

  async findAll(tenantId: string) {
    return this.drizzleService.runWithTenant(tenantId, async (tx) => {
      return tx.select().from(bankTransactions);
    });
  }
}
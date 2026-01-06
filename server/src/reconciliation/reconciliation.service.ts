import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { invoices, bankTransactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import axios from 'axios';

@Injectable()
export class ReconciliationService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async reconcile(tenantId: string) {
    return this.drizzleService.runWithTenant(tenantId, async (tx) => {
      // 1. Fetch Open Invoices & All Transactions
      // (In production, you'd filter transactions by 'unreconciled' status)
      const openInvoices = await tx.select().from(invoices).where(eq(invoices.status, 'open'));
      const transactions = await tx.select().from(bankTransactions);

      if (openInvoices.length === 0 || transactions.length === 0) {
        return { message: "Not enough data to run reconciliation" };
      }

      // 2. Prepare Payload for Python GraphQL
      const query = `
        mutation($invoices: [InvoiceInput!]!, $transactions: [TransactionInput!]!) {
          scoreCandidates(invoices: $invoices, transactions: $transactions) {
            invoiceId
            transactionId
            score
            explanation { text }
          }
        }
      `;

      const variables = {
        invoices: openInvoices.map(inv => ({
          id: inv.id,
          amount: parseFloat(inv.amount), // Convert string -> number for Python
          date: inv.createdAt ? inv.createdAt.toISOString() : new Date().toISOString(),
          vendor: inv.description // heuristic: using description as vendor name
        })),
        transactions: transactions.map(txn => ({
          id: txn.id,
          amount: parseFloat(txn.amount),
          date: txn.date ? txn.date.toISOString() : new Date().toISOString(),
          description: txn.description || ''
        }))
      };

      // 3. Send to Python Engine
      try {
        const pythonUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000/graphql';
        const response = await axios.post(pythonUrl, { query, variables });

        if (response.data.errors) {
          console.error("Python GraphQL Error:", response.data.errors);
          throw new InternalServerErrorException('Calculation Engine Error');
        }

        const candidates = response.data.data.scoreCandidates;
        
        // 4. (Senior Step) Don't just return. Log or persist candidates here.
        // For this demo, returning them to the UI is acceptable.
        return { candidates };

      } catch (error) {
        console.error("Failed to connect to Python Engine:", error.message);
        throw new InternalServerErrorException('Reconciliation Service Unavailable');
      }
    });
  }
}
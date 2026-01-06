import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { invoices } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class InvoicesService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(tenantId: string, amount: string, description: string) {
    try {
      // We use runWithTenant to ensure this insert is safe
      return this.drizzleService.runWithTenant(tenantId, async (tx) => {
        return tx.insert(invoices).values({
          tenantId: tenantId,
          amount,
          description,
        }).returning();
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(tenantId: string) {
    try {

      return this.drizzleService.runWithTenant(tenantId, async (tx) => {
        return tx.select().from(invoices);
      });
    } catch (error) {
      throw error;
    }
  }
}
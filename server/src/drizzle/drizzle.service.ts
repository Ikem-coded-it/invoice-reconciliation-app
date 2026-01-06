import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

@Injectable()
export class DrizzleService {
  public db: NodePgDatabase<typeof schema>;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool, { schema });
  }

  // This method wraps any database operation in a tenant-scoped transaction.
  async runWithTenant<T>(
    tenantId: string, 
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      // 1. Set the RLS variable only for this transaction
      // We use sql.raw because we are injecting a value directly into the session config
      await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
      
      // 2. Run the actual business logic passed in the callback
      return callback(tx);
    });
  }
}
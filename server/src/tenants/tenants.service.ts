import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { tenants } from '../db/schema';

@Injectable()
export class TenantsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(name: string) {
    try {
        // .returning() is a Postgres feature to get the created data back immediately
        const result = await this.drizzleService.db
          .insert(tenants)
          .values({ name })
          .returning();
        
        return result[0];
    } catch (error) {
        throw error;
    }
  }

  async findAll() {
    try {
        return await this.drizzleService.db.select().from(tenants);
    } catch (error) {
        throw error;
    }
  }
}
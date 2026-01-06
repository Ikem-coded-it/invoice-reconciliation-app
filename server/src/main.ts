import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DrizzleService } from './drizzle/drizzle.service';
import { sql } from 'drizzle-orm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- RLS SETUP START ---
  // Get the database service
  const drizzleService = app.get(DrizzleService);

  // execute raw SQL to enable RLS and create the policy
  // We wrap this in a try/catch or just run it. 
  // Ideally, use a migration, but for this challenge, this guarantees it works.
  try {
    console.log('🔒 Applying RLS Policies...');
    
    await drizzleService.db.execute(sql`
      -- 1. Enable RLS on invoices
      ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

      -- 2. IMPORTANT: Force RLS even for the table owner (YOU)
      ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

      -- 3. Drop existing policy to avoid collision on restart
      DROP POLICY IF EXISTS tenant_isolation_policy ON invoices;

      -- 4. Create the Policy
      -- "Allow rows where tenant_id matches the session variable 'app.current_tenant_id'"
      CREATE POLICY tenant_isolation_policy ON invoices
          USING (tenant_id::text = current_setting('app.current_tenant_id', true));
    `);
    
    console.log('✅ RLS Policies Applied Successfully');
  } catch (err) {
    console.error('⚠️ Error applying RLS policies:', err.message);
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
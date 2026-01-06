-- 1. Enable RLS on the table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 2. Create the Policy
-- "Allow access if the tenant_id column matches the session variable"
CREATE POLICY tenant_isolation_policy ON invoices
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
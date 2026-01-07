

# Multi-Tenant Invoice Reconciliation System

A production-ready demo application implementing a polyglot architecture (NestJS + Python) for reconciling bank transactions with invoices. Key features include **Row Level Security (RLS)** for strict multi-tenancy and **Idempotency** for safe bulk operations.

## Architecture

* **Backend API:** NestJS (TypeScript)
* **Reconciliation Engine:** Python 3.13 + Strawberry GraphQL (Deterministic Heuristics)
* **Database:** PostgreSQL 15 + Drizzle ORM
* **Security:** Native PostgreSQL Row Level Security (RLS) with privilege de-escalation.

---

## Local Setup

### 1. Start Infrastructure
Run the database using Docker:
```bash
docker-compose up -d
```

## Setup NestJs (server)
```bash
cd server
npm install
# Create .env file (copying defaults)
cp .env.example .env 
# Run Database Migrations (setup schema)
npx drizzle-kit push
# Start Server
npm run start:dev
```

## Setup Python (engine)
```bash
cd engine
# Create virtual environment
python -m venv venv
# Activate venv
source venv/bin/activate  # Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Start Engine
python main.py
```

## API Endpoints

### 1. Create a Tenant (Organization)
**POST** `/v1/tenants`
```json
{
  "name": "Acme Corp"
}
```

### 2. Create a Invoice
**POST** `/v1/tenants/{TENANT_ID}/invoices`
```json
{
  "amount": "150.00",
  "description": "Consulting Services"
}
```

### 3. Import Bank Transactions (Idempotent)
**POST** `/v1/tenants/{TENANT_ID}/bank-transactions/import`
**Headers**
    Idempotency-Key: batch_001

    Transactions array in payload should be JSON stringified
```json
{
  "transactions": [
    {
      "amount": 150.00,
      "date": "2023-10-25T10:00:00Z",
      "description": "Payment for Consulting",
      "currency": "USD"
    }
  ]
}
```

### 4. Run Reconciliation
**POST** `/v1/tenants/{TENANT_ID}/reconcile`
- Fetches open invoices and transactions from DB.

- Sends data to Python Engine.

- Returns matched candidates with confidence scores.

### 5. AI Explanation
**GET** `/v1/tenants/{TENANT_ID}/reconcile/explain?invoice_id=.&transaction_id=...`
Returns a detailed explanation of why two items were matched (or not matched), including a confidence score and human-readable reasoning (e.g., "Exact amount match", "Description similarity detected").
```json
{
  "invoice_id": "...",
  "transaction_id": "...",
  "ai_confidence": "High",
  "explanation_text": "AI Analysis: Strong signal detected due to exact amount match ($150).",
  "model_used": "mock-gpt-4o-mini"
}
```

## Tests
The project includes a comprehensive End-to-End (E2E) test suite using supertest. These tests verify the entire flow, including RLS security enforcement and Idempotency logic.
```bash
cd server
npm run test:e2e
```

### What is tested?
- Tenant & Invoice creation.

- Security: Verifies Tenant B cannot access Tenant A's invoices (RLS).

- Idempotency: Verifies re-sending the same batch with the same key returns the cached response.

- AI Logic: Verifies the explanation endpoint returns structured analysis.


## Design Descisions

### Multi-Tenancy via Row Level Security (RLS)
Instead of relying on manual .where(tenant_id) clauses in the application layer (which are prone to developer error), I implemented Defense in Depth using PostgreSQL RLS.

- Privilege De-escalation: The application connects as a superuser but creates a restricted role app_user for business logic.

- Transaction Context: Every request is wrapped in a transaction that:
  - Switches to app_user (downgrading privileges).
  - Sets app.current_tenant_id session variable.

- Enforcement: A Policy on invoices and bank_transactions tables strictly enforces tenant_id = current_setting(...).

- Result: It is physically impossible for Tenant A to query Tenant B's data, even if the developer forgets the WHERE clause.


### Idempotency
To ensure safe bulk imports (e.g., retrying a failed network request doesn't duplicate data), I implemented an IdempotencyInterceptor.

- It checks the Idempotency-Key header.
- If the key exists, it returns the cached response immediately without processing.
- If the key exists but the payload has changed, it throws a 409 Conflict.


### Polyglot Architecture
- NestJS: Handles I/O, Auth, DB management, and orchestrates the flow.
- Python: Acts as a pure, stateless computation engine. It receives data, computes scores (using heuristics like exact match, date proximity, and text similarity), and returns results. It does not touch the database directly, preserving a clean separation of concerns.
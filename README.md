

# Multi-Tenant Invoice Reconciliation System

A production-ready demo application implementing a polyglot architecture (NestJS + Python) for reconciling bank transactions with invoices. Key features include **Row Level Security (RLS)** for strict multi-tenancy and **Idempotency** for safe bulk operations.

## 🏗 Architecture

* **Backend API:** NestJS (TypeScript)
* **Reconciliation Engine:** Python 3.13 + Strawberry GraphQL (Deterministic Heuristics)
* **Database:** PostgreSQL 15 + Drizzle ORM
* **Security:** Native PostgreSQL Row Level Security (RLS) with privilege de-escalation.

---

## 🚀 Local Setup

### 1. Start Infrastructure
Run the database using Docker:
```bash
docker-compose up -d
```

## 🏗 Setup NestJs (server)
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

## 🏗 Setup Python (engine)
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

## 🧪 API Endpoints & Testing

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





I used FORCE ROW LEVEL SECURITY on the tables to ensure that even the application user (who owns the tables) is subject to the RLS policies. This prevents accidental data leaks even if the application has high privileges.
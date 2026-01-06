import strawberry
from strawberry.asgi import GraphQL  # <--- CRITICAL IMPORT
from typing import List, Optional
import uvicorn
from datetime import datetime
from reconciliation import score_matches, InvoiceData, TransactionData

# --- GraphQL Input Types ---
@strawberry.input
class InvoiceInput:
    id: str
    amount: float
    date: str
    vendor: Optional[str] = None

@strawberry.input
class TransactionInput:
    id: str
    amount: float
    date: str
    description: str

# --- GraphQL Output Types ---
@strawberry.type
class Explanation:
    text: str
    confidence: float

@strawberry.type
class MatchCandidate:
    invoice_id: str
    transaction_id: str
    score: float
    explanation: Explanation

# --- The Schema ---
@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "Python Engine is Running"

@strawberry.type
class Mutation:
    @strawberry.field
    def score_candidates(
        self, 
        invoices: List[InvoiceInput], 
        transactions: List[TransactionInput]
    ) -> List[MatchCandidate]:
        
        # 1. Convert Inputs
        inv_data = [
            InvoiceData(
                id=i.id, 
                amount=i.amount, 
                date=datetime.fromisoformat(i.date.replace('Z', '+00:00')), 
                vendor=i.vendor
            ) for i in invoices
        ]
        
        txn_data = [
            TransactionData(
                id=t.id, 
                amount=t.amount, 
                date=datetime.fromisoformat(t.date.replace('Z', '+00:00')), 
                description=t.description
            ) for t in transactions
        ]

        # 2. Run Logic
        results = score_matches(inv_data, txn_data)

        # 3. Map back to GraphQL
        return [
            MatchCandidate(
                invoice_id=r.invoice_id,
                transaction_id=r.transaction_id,
                score=r.score,
                explanation=Explanation(text=r.explanation_text, confidence=r.score)
            ) for r in results
        ]

schema = strawberry.Schema(query=Query, mutation=Mutation)

# --- THE FIX IS HERE ---
# We MUST wrap the schema in the GraphQL app handler
graphql_app = GraphQL(schema)

if __name__ == "__main__":
    # CRITICAL: We pass 'graphql_app', NOT 'schema'
    uvicorn.run(graphql_app, host="0.0.0.0", port=8000)
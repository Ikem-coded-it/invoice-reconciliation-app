from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
from dateutil import parser

# --- Data Structures (Internal) ---
@dataclass
class InvoiceData:
    id: str
    amount: float
    date: datetime
    vendor: Optional[str]

@dataclass
class TransactionData:
    id: str
    amount: float
    date: datetime
    description: str

@dataclass
class MatchResult:
    invoice_id: str
    transaction_id: str
    score: float
    explanation_text: str

# --- The Logic ---
def score_matches(
    invoices: List[InvoiceData], 
    transactions: List[TransactionData]
) -> List[MatchResult]:
    
    candidates = []

    for txn in transactions:
        for inv in invoices:
            score = 0.0
            reasons = []

            # 1. Exact Amount Match (Strong Signal)
            # Use small epsilon for float comparison
            if abs(inv.amount - txn.amount) < 0.01:
                score += 0.7
                reasons.append("Exact amount match")
            
            # 2. Vendor Name in Description (Medium Signal)
            if inv.vendor and txn.description:
                if inv.vendor.lower() in txn.description.lower():
                    score += 0.3
                    reasons.append(f"Vendor '{inv.vendor}' found in bank description")

            # 3. Date Proximity (Optional tie-breaker)
            days_diff = abs((inv.date - txn.date).days)
            if days_diff <= 3:
                score += 0.1
                reasons.append(f"Date within {days_diff} days")

            # Cap score at 1.0
            score = min(score, 1.0)

            # Only return promising candidates (e.g. > 0.6)
            if score >= 0.6:
                candidates.append(MatchResult(
                    invoice_id=inv.id,
                    transaction_id=txn.id,
                    score=score,
                    explanation_text=f"Confidence {int(score*100)}%: " + ", ".join(reasons)
                ))

    # Sort by score descending
    candidates.sort(key=lambda x: x.score, reverse=True)
    return candidates
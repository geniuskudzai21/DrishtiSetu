import logging

from fastapi import APIRouter, HTTPException, Request

from app.schemas import SettlementOut
from app.services.settlement_data import SETTLEMENT_SELECT, fetch_settlement

router = APIRouter(prefix="/api/settlements", tags=["settlements"])
logger = logging.getLogger(__name__)

@router.get("", response_model=list[SettlementOut])
def list_settlements(request: Request) -> list[dict]:
    try:
        with request.app.state.db_pool.connection() as connection:
            rows = connection.execute(
                SETTLEMENT_SELECT
                + """
                ORDER BY (s.risk_score * 0.6 + s.vulnerability_index * 0.4) DESC, s.id
                """
            ).fetchall()
        return rows
    except Exception as exc:
        logger.exception("Could not retrieve settlements")
        raise HTTPException(status_code=503, detail="Settlement data is temporarily unavailable") from exc


@router.get("/{settlement_id}", response_model=SettlementOut)
def get_settlement(settlement_id: int, request: Request) -> dict:
    try:
        row = fetch_settlement(request, settlement_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Settlement not found")
        return row
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not retrieve settlement")
        raise HTTPException(status_code=503, detail="Settlement data is temporarily unavailable") from exc

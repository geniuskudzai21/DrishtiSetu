import logging
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas import DecisionRequest, DecisionResponse

router = APIRouter(prefix="/api", tags=["decisions"])
logger = logging.getLogger(__name__)
bearer = HTTPBearer(auto_error=False)


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str:
    expected_token = os.getenv("ADMIN_TOKEN")
    if not expected_token:
        raise HTTPException(status_code=503, detail="Decision service is not configured")
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not secrets.compare_digest(credentials.credentials, expected_token)
    ):
        raise HTTPException(status_code=401, detail="Valid bearer token required")
    return "SDMA Officer"


@router.post("/decisions", response_model=DecisionResponse)
def create_decision(
    body: DecisionRequest,
    request: Request,
    actor: str = Depends(require_admin),
) -> dict:
    try:
        with request.app.state.db_pool.connection() as connection:
            with connection.transaction():
                exists = connection.execute(
                    "SELECT id FROM settlements WHERE id = %s FOR SHARE",
                    (body.settlement_id,),
                ).fetchone()
                if exists is None:
                    raise HTTPException(status_code=404, detail="Settlement not found")
                decision = connection.execute(
                    """
                    INSERT INTO decisions (settlement_id, action, actor)
                    VALUES (%s, %s, %s)
                    RETURNING id, settlement_id, action, actor, created_at
                    """,
                    (body.settlement_id, body.action, actor),
                ).fetchone()
                connection.execute(
                    """
                    INSERT INTO audit_log (settlement_id, decision_id, action, actor, details)
                    VALUES (%s, %s, %s, %s, %s::jsonb)
                    """,
                    (
                        body.settlement_id,
                        decision["id"],
                        body.action,
                        actor,
                        '{"source":"officer_decision"}',
                    ),
                )
        return {
            "id": decision["id"],
            "settlement_id": decision["settlement_id"],
            "action": decision["action"],
            "who": decision["actor"],
            "time": decision["created_at"].isoformat(),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not save officer decision")
        raise HTTPException(status_code=503, detail="Decision could not be saved") from exc


@router.get("/audit")
def get_audit(request: Request, limit: int = 100) -> dict:
    if not 1 <= limit <= 500:
        raise HTTPException(status_code=422, detail="limit must be between 1 and 500")
    try:
        with request.app.state.db_pool.connection() as connection:
            entries = connection.execute(
                """
                SELECT
                    settlement_id AS "settlementId",
                    action,
                    actor AS who,
                    created_at AS time
                FROM audit_log
                ORDER BY created_at DESC, id DESC
                LIMIT %s
                """,
                (limit,),
            ).fetchall()
        return {"audit": entries}
    except Exception as exc:
        logger.exception("Could not retrieve audit log")
        raise HTTPException(status_code=503, detail="Audit data is temporarily unavailable") from exc

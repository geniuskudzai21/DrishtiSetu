import logging

from fastapi import APIRouter, HTTPException, Request

from app.limiter import limiter
from app.schemas import ChatRequest, ChatResponse
from app.services.groq import answer_question
from app.services.settlement_data import fetch_settlement

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(body: ChatRequest, request: Request) -> ChatResponse:
    try:
        settlement = fetch_settlement(request, body.settlement_id)
    except Exception as exc:
        logger.exception("Could not retrieve settlement for chat")
        raise HTTPException(status_code=503, detail="Settlement data is temporarily unavailable") from exc
    if settlement is None:
        raise HTTPException(status_code=404, detail="Settlement not found")
    try:
        return ChatResponse(answer=await answer_question(settlement, body.message))
    except Exception as exc:
        logger.exception("Chat service failed")
        raise HTTPException(status_code=503, detail="Chat service is temporarily unavailable") from exc

import json
import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def fallback_answer(settlement: dict, question: str) -> str:
    factors = settlement.get("factors") or []
    strongest = max(factors, key=lambda item: float(item.get("v", 0)), default=None)
    if re.search(r"[\u0a00-\u0a7f]", question):
        lead = f"{settlement['name']} ਦਾ ਜੋਖਮ ਅੰਕ 100 ਵਿੱਚੋਂ {settlement['risk']} ਹੈ।"
        driver = (
            f" ਸਭ ਤੋਂ ਵੱਡਾ ਦਰਜ ਕਾਰਕ {strongest['k']} ({strongest['v']}/100) ਹੈ।"
            if strongest
            else ""
        )
        return lead + driver + " ਫੈਸਲੇ ਤੋਂ ਪਹਿਲਾਂ ਸੁਰੱਖਿਅਤ ਥਾਵਾਂ ਦੀ ਜਾਂਚ ਕਰੋ।"
    lead = f"{settlement['name']} has a risk score of {settlement['risk']}/100."
    driver = (
        f" The largest listed driver is {strongest['k']} ({strongest['v']}/100)."
        if strongest
        else ""
    )
    return lead + driver + " Review the ranked safer sites before making a decision."


async def answer_question(settlement: dict, question: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return fallback_answer(settlement, question)

    context = {
        "name": settlement["name"],
        "district": settlement["district"],
        "population": settlement["pop"],
        "vulnerability": settlement["vuln"],
        "risk": settlement["risk"],
        "factors": settlement["factors"],
        "candidate_sites": settlement["sites"],
    }
    payload = {
        "model": GROQ_MODEL,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a careful flood-relocation decision-support assistant. "
                    "Answer in the same language as the user's question. Use only the "
                    "provided settlement context, distinguish facts from uncertainty, "
                    "and never claim to authorize or execute relocation."
                ),
            },
            {
                "role": "user",
                "content": f"Settlement context (JSON): {json.dumps(context, ensure_ascii=False)}\n\nQuestion: {question}",
            },
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                GROQ_ENDPOINT,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            response.raise_for_status()
            answer = response.json()["choices"][0]["message"]["content"]
            if not isinstance(answer, str) or not answer.strip():
                raise ValueError("Groq returned an empty answer")
            return answer.strip()
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        logger.exception("Groq chat request failed")
        raise

import json
import logging
import os
import re

import httpx

from app.services.retrieval import retrieve_references

logger = logging.getLogger(__name__)
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free"


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
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("GROQ_API_KEY")
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
    references = retrieve_references(question)
    reference_context = "\n\n".join(
        f"[Source: {reference['source']}]\n{reference['text']}"
        for reference in references
    ) or "No relevant passages were found in docs/knowledge."
    payload = {
        "model": OPENROUTER_MODEL,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a careful flood-relocation decision-support assistant. "
                    "Answer only what the latest question asks, in the same language. "
                    "Be concise: usually one sentence, at most 25 words. Do not repeat "
                    "the full settlement summary, add unsolicited advice, or repeat generic "
                    "disclaimers. Use only the current supplied settlement context; never "
                    "substitute another settlement from an example or prior conversation. "
                    "Treat values as supplied records, not live measurements. Do not invent "
                    "causes, forecasts, or facts. A risk score is relative within this dataset, "
                    "not a formal good/bad threshold or confirmed emergency. If asked whether "
                    "an area is good or bad, explain briefly that lower scores mean lower "
                    "relative risk in these records, not that it is proven safe. For immediate "
                    "danger or evacuation questions, direct the user to current official alerts "
                    "and local authorities; never issue an evacuation order. If a fact is absent, "
                    "say so briefly. Use settlement records only for settlement-specific "
                    "facts. Use retrieved passages for policy or guidance and cite their source "
                    "as [Source: filename] or [Source: filename, p. N]. If no relevant passage "
                    "was retrieved, state that the local reference library does not support an "
                    "answer; do not invent policy or citations."
                ),
            },
            {
                "role": "user",
                "content": (
                    'Settlement context: {"name":"Example Hamlet","district":"Example District",'
                    '"risk":67,"factors":[{"k":"Past flood frequency","v":72}]}'
                    "\nQuestion: Hello"
                ),
            },
            {
                "role": "assistant",
                "content": "Hello! What can I help with?",
            },
            {
                "role": "user",
                "content": (
                    'Settlement context: {"name":"Example Hamlet","risk":67,'
                    '"factors":[{"k":"Past flood frequency","v":72},'
                    '{"k":"River proximity","v":61}]}'
                    "\nQuestion: What is the risk score?"
                ),
            },
            {
                "role": "assistant",
                "content": "Example Hamlet's recorded risk score is 67/100.",
            },
            {
                "role": "user",
                "content": (
                    'Settlement context: {"name":"Fatuhiwala","risk":41,"vulnerability":48}'
                    "\nQuestion: So is it bad or good?"
                ),
            },
            {
                "role": "assistant",
                "content": (
                    "In these records, 41/100 means comparatively lower risk, but it does "
                    "not prove the area is safe."
                ),
            },
            {
                "role": "user",
                "content": (
                    'Settlement context: {"name":"Example Hamlet","risk":67,'
                    '"candidate_sites":[{"name":"North Site","score":82,"capacity":900},'
                    '{"name":"East Site","score":74,"capacity":1200}]}'
                    "\nQuestion: Which site is best?"
                ),
            },
            {
                "role": "assistant",
                "content": "North Site scores higher (82 vs. 74); the records do not establish which site is safest overall.",
            },
            {
                "role": "user",
                "content": (
                    f"Settlement context (JSON): "
                    f"{json.dumps(context, ensure_ascii=False, default=float)}"
                    f"\n\nRetrieved reference passages:\n{reference_context}"
                    f"\nQuestion: {question}"
                ),
            },
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                OPENROUTER_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://localhost",
                    "X-Title": "DrishtiSetu",
                },
                json=payload,
            )
            response.raise_for_status()
            answer = response.json()["choices"][0]["message"]["content"]
            if not isinstance(answer, str) or not answer.strip():
                raise ValueError("OpenRouter returned an empty answer")
            return answer.strip()
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        logger.exception("OpenRouter chat request failed")
        raise

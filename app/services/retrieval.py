import logging
import math
import re
from collections import Counter
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)
KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / "docs" / "knowledge"
SUPPORTED_SUFFIXES = {".md", ".pdf", ".txt"}
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 160
TOKEN_PATTERN = re.compile(r"[\w]+", re.UNICODE)


@dataclass(frozen=True)
class ReferenceChunk:
    source: str
    text: str


def _chunk_text(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    chunks = []
    start = 0
    while start < len(normalized):
        end = min(start + CHUNK_SIZE, len(normalized))
        if end < len(normalized):
            boundary = normalized.rfind(" ", start + CHUNK_SIZE // 2, end)
            if boundary > start:
                end = boundary
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(normalized):
            break
        start = max(start + 1, end - CHUNK_OVERLAP)
    return chunks


def _document_pages(path: Path):
    relative_path = path.relative_to(KNOWLEDGE_DIR).as_posix()
    if path.suffix.lower() == ".pdf":
        import pymupdf

        with pymupdf.open(path) as document:
            for page_number, page in enumerate(document, start=1):
                yield f"{relative_path}, p. {page_number}", page.get_text("text")
        return
    yield relative_path, path.read_text(encoding="utf-8", errors="replace")


@lru_cache(maxsize=1)
def _load_chunks() -> tuple[ReferenceChunk, ...]:
    if not KNOWLEDGE_DIR.exists():
        return ()

    chunks = []
    for path in sorted(KNOWLEDGE_DIR.rglob("*")):
        if (
            not path.is_file()
            or path.name.lower() == "readme.md"
            or path.suffix.lower() not in SUPPORTED_SUFFIXES
        ):
            continue
        try:
            for source, page_text in _document_pages(path):
                chunks.extend(
                    ReferenceChunk(source=source, text=text)
                    for text in _chunk_text(page_text)
                )
        except Exception:
            logger.exception("Could not load knowledge document %s", path)
    return tuple(chunks)


@lru_cache(maxsize=1)
def _build_index():
    chunks = _load_chunks()
    if not chunks:
        return chunks, (), Counter(), 0.0

    term_frequencies = tuple(
        Counter(token.casefold() for token in TOKEN_PATTERN.findall(chunk.text))
        for chunk in chunks
    )
    document_frequencies = Counter()
    for frequencies in term_frequencies:
        document_frequencies.update(frequencies.keys())
    average_length = sum(sum(frequencies.values()) for frequencies in term_frequencies) / len(chunks)
    return chunks, term_frequencies, document_frequencies, average_length


def retrieve_references(query: str, limit: int = 3) -> list[dict[str, str]]:
    chunks, term_frequencies, document_frequencies, average_length = _build_index()
    if not chunks or average_length == 0 or not query.strip():
        return []

    query_terms = Counter(
        token.casefold() for token in TOKEN_PATTERN.findall(query)
    )
    if not query_terms:
        return []

    document_count = len(chunks)
    scored_chunks = []
    for index, frequencies in enumerate(term_frequencies):
        document_length = sum(frequencies.values())
        score = 0.0
        for term in query_terms:
            term_frequency = frequencies.get(term, 0)
            if not term_frequency:
                continue
            inverse_frequency = math.log1p(
                (document_count - document_frequencies[term] + 0.5)
                / (document_frequencies[term] + 0.5)
            )
            normalization = term_frequency + 1.5 * (
                1 - 0.75 + 0.75 * document_length / average_length
            )
            score += inverse_frequency * term_frequency * 2.5 / normalization
        if score > 0:
            scored_chunks.append((score, index))

    results = []
    seen_sources = set()
    for _, index in sorted(scored_chunks, reverse=True):
        chunk = chunks[index]
        if chunk.source in seen_sources:
            continue
        results.append({"source": chunk.source, "text": chunk.text})
        seen_sources.add(chunk.source)
        if len(results) >= limit:
            break
    return results
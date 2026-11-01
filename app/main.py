import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.staticfiles import StaticFiles

from app.db import create_pool
from app.limiter import limiter
from app.routers import chat, decisions, hazard, settlements

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(application: FastAPI):
    pool = create_pool()
    application.state.db_pool = pool
    try:
        pool.open(wait=True, timeout=15)
        yield
    finally:
        pool.close()


app = FastAPI(title="DrishtiSetu API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled request error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
def health() -> JSONResponse:
    try:
        with app.state.db_pool.connection() as connection:
            connection.execute("SELECT 1")
        return JSONResponse({"status": "ok"})
    except Exception as exc:
        logger.exception("Health check failed")
        return JSONResponse(status_code=503, content={"status": "unhealthy"})


app.include_router(settlements.router)
app.include_router(hazard.router)
app.include_router(chat.router)
app.include_router(decisions.router)

app.mount("/js", StaticFiles(directory=PROJECT_ROOT / "js"), name="javascript")


@app.get("/", include_in_schema=False)
def frontend() -> FileResponse:
    return FileResponse(PROJECT_ROOT / "index.html")

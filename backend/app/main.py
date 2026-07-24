import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.routers import tasks, meeting, planner, chat, dashboard

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("app")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Database initialized. Environment=%s", settings.ENVIRONMENT)
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="AI Productivity Assistant API",
    version="1.0.0",
    description="Backend API for the AI Productivity Assistant (tasks, meetings, planner, chat).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


app.include_router(tasks.router)
app.include_router(meeting.router)
app.include_router(planner.router)
app.include_router(chat.router)
app.include_router(dashboard.router)

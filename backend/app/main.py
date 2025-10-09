from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, samples, generation, library, websocket
from app.logging_config import setup_logging

# Setup logging
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="2.0.0",
    description="AI Voice Clone Studio API - Backend with AI integration and real-time updates"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "ws://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(samples.router, prefix="/api/samples", tags=["Audio Samples"])
app.include_router(generation.router, prefix="/api/generation", tags=["Generation"])
app.include_router(library.router, prefix="/api/library", tags=["Library"])
app.include_router(websocket.router, prefix="/api", tags=["WebSocket"])

@app.get("/")
def root():
    return {
        "message": "LoquiAI Voice Clone Studio",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "features": [
            "JWT Authentication",
            "Audio Sample Management",
            "AI Voice Generation",
            "Background Task Processing",
            "Real-time WebSocket Updates"
        ]
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    # Check Redis connection
    redis_status = "unknown"
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        redis_status = "connected"
    except:
        redis_status = "disconnected"
    
    return {
        "status": "healthy",
        "database": "connected",
        "redis": redis_status,
        "celery": "running" if redis_status == "connected" else "unavailable"
    }

# Exception handlers
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.utils.exceptions import (
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Import monitoring router
from app.api import monitoring

# Add to routers
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])

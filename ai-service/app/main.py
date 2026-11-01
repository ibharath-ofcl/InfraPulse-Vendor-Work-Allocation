import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.api.models import router as models_router
from app.api.inference import router as inference_router
from app.api.intelligence import router as intelligence_router
from app.models.model_registry import list_models

app = FastAPI(
    title="InfraPulse AI Vision Service",
    description="Intelligent Infrastructure Lifecycle & Quality Assurance Platform - Computer Vision Engine",
    version="1.0.0",
)

# CORS Middleware
origins = os.getenv("CORS_ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loading_status: str
    available_models: List[str]
    device: str


@app.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint for container orchestration and service monitoring."""
    models = list_models()
    return HealthResponse(
        status="UP",
        service="InfraPulse AI Vision Service",
        version="1.0.0",
        model_loading_status="READY",
        available_models=[m.model_id for m in models],
        device="CPU",
    )


@app.get("/")
def get_root():
    return {
        "service": "InfraPulse AI Vision Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "models": "/api/v1/models",
    }


# Include API Routers
app.include_router(models_router)
app.include_router(inference_router)
app.include_router(intelligence_router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

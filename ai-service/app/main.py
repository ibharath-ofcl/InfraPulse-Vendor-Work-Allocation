import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="InfraPulse AI Vision Service",
    description="Intelligent Infrastructure Lifecycle & Quality Assurance Platform - Computer Vision Engine",
    version="1.0.0"
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


@app.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint for container orchestration and service monitoring."""
    return HealthResponse(
        status="UP",
        service="InfraPulse AI Vision Service"
    )


@app.get("/")
def get_root():
    return {
        "service": "InfraPulse AI Vision Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

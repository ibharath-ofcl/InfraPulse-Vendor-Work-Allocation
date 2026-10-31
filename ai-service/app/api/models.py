from fastapi import APIRouter, HTTPException
from app.schemas.models import ModelInfo, ModelListResponse
from app.models.model_registry import list_models, get_model

router = APIRouter(prefix="/api/v1/models", tags=["Model Registry"])


@router.get("", response_model=ModelListResponse)
def get_all_models():
    """Retrieve all active and available computer vision models in the registry."""
    models = list_models()
    return ModelListResponse(models=models, count=len(models))


@router.get("/{model_id}", response_model=ModelInfo)
def get_model_details(model_id: str):
    """Retrieve metadata, version, and supported classes for a specific model."""
    model = get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in registry.")
    return model

from typing import Dict, List, Optional
from app.schemas.models import ModelInfo

MODEL_ID = "infrapulse-cv-v1"
MODEL_VERSION = "1.0.0"

SUPPORTED_CLASSES = [
    "ROAD_CRACK",
    "POTHOLE",
    "SURFACE_DAMAGE",
    "EXCAVATION_VISIBLE",
    "EXPOSED_MATERIALS",
    "SURFACE_IRREGULARITY",
    "DEBRIS_OBSTRUCTION",
]

UNSUPPORTED_CATEGORIES = [
    "Trench depth (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
    "Underground cable installation depth (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
    "Backfill soil compaction level (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
    "Asphalt layer thickness (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
    "Concrete compressive strength & grade (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
    "Subsurface structural integrity (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
]

MODELS_REGISTRY: Dict[str, ModelInfo] = {
    "infrapulse-cv-v1": ModelInfo(
        model_id="infrapulse-cv-v1",
        model_name="InfraPulse Infrastructure Surface Vision Engine",
        version="1.0.0",
        framework="OpenCV + NumPy Computer Vision Pipeline",
        model_type="OBJECT_DETECTION_AND_QUALITY",
        supported_classes=SUPPORTED_CLASSES,
        license="Apache-2.0",
        description="Automated infrastructure photographic assessment engine. Analyzes image resolution, blur via Laplacian variance, luminance distribution, contrast, and identifies road cracks, potholes, excavation, exposed materials, and debris.",
        activation_status="ACTIVE",
        creation_date="2026-10-31",
    )
}


def get_model(model_id: str) -> Optional[ModelInfo]:
    return MODELS_REGISTRY.get(model_id)


def list_models() -> List[ModelInfo]:
    return list(MODELS_REGISTRY.values())

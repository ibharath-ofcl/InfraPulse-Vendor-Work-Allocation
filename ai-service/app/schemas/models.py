from typing import List
from pydantic import BaseModel


class ModelInfo(BaseModel):
    model_id: str
    model_name: str
    version: str
    framework: str
    model_type: str
    supported_classes: List[str]
    license: str
    description: str
    activation_status: str
    creation_date: str


class ModelListResponse(BaseModel):
    models: List[ModelInfo]
    count: int

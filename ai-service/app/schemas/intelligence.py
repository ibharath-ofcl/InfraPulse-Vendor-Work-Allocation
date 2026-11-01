from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ExtractedRequirementItem(BaseModel):
    requirement_code: Optional[str] = None
    work_package: str
    title: str
    description: str
    category: str = "SPECIFICATION"  # SPECIFICATION, TOLERANCE, SAFETY_RULE, MATERIAL_QUALITY, DIMENSIONAL
    acceptance_criteria: str
    measurement_unit: Optional[str] = None
    required_value: Optional[str] = None
    permitted_tolerance: Optional[str] = None
    mandatory: bool = True
    requires_human_inspection: bool = True
    requires_physical_measurement: bool = False
    verification_method: str = "PHOTO_EVIDENCE"  # PHYSICAL_MEASUREMENT, PHOTO_EVIDENCE, LAB_REPORT_VERIFICATION


class DocumentExtractionResponse(BaseModel):
    status: str
    document_name: str
    detected_contract_type: str
    total_requirements_extracted: int
    extracted_text_preview: str
    requirements: List[ExtractedRequirementItem]
    extraction_duration_ms: int
    extractor_version: str = "1.0.0"


class DefectComparisonItem(BaseModel):
    candidate_id: str
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bounding_box: Optional[Dict[str, float]] = None
    detected_days_ago: Optional[int] = 0


class DefectComparisonRequest(BaseModel):
    reference_category: str
    reference_latitude: Optional[float] = None
    reference_longitude: Optional[float] = None
    reference_bounding_box: Optional[Dict[str, float]] = None
    candidates: List[DefectComparisonItem] = Field(default_factory=list)


class DefectMatchCandidateResult(BaseModel):
    candidate_id: str
    similarity_score: float
    spatial_distance_meters: Optional[float] = None
    temporal_distance_days: Optional[int] = None
    is_probable_recurrence: bool
    comparison_basis: str


class DefectComparisonResponse(BaseModel):
    status: str
    reference_category: str
    candidates_evaluated: int
    probable_recurrences_found: int
    results: List[DefectMatchCandidateResult]
    comparison_engine_version: str = "1.0.0"

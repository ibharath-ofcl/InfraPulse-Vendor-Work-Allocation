from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    ymin: float = Field(..., ge=0.0, le=1.0, description="Normalized top coordinate (0.0 - 1.0)")
    xmin: float = Field(..., ge=0.0, le=1.0, description="Normalized left coordinate (0.0 - 1.0)")
    ymax: float = Field(..., ge=0.0, le=1.0, description="Normalized bottom coordinate (0.0 - 1.0)")
    xmax: float = Field(..., ge=0.0, le=1.0, description="Normalized right coordinate (0.0 - 1.0)")


class DetectionItem(BaseModel):
    detection_id: str
    class_id: str
    class_label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: BoundingBox
    segmentation_reference: Optional[str] = None
    model_id: str
    model_version: str


class SegmentationMask(BaseModel):
    mask_id: str
    class_id: str
    class_label: str
    polygon_points: List[List[float]] = Field(default_factory=list, description="Normalized [x, y] polygon coordinates")
    coverage_ratio: float = Field(..., ge=0.0, le=1.0)
    model_id: str
    model_version: str


class MonocularDepthEstimate(BaseModel):
    model_id: str
    model_version: str
    relative_depth_map_available: bool = True
    mean_relative_depth_disparity: float
    calibration_assumptions: str = "Relative disparity gradient; uncalibrated optical parameters"
    certification_disclaimer: str = (
        "ESTIMATED MONOCULAR RELATIVE DEPTH ONLY — NOT A CERTIFIED PHYSICAL MEASUREMENT. "
        "ENGINEERING MEASUREMENTS REQUIRE MANDATORY AUTHORIZED PHYSICAL INSPECTION."
    )


class ImageQualityResult(BaseModel):
    resolution_width: int
    resolution_height: int
    blur_score: float = Field(..., description="Laplacian variance estimation of image sharpness")
    brightness_score: float = Field(..., description="Mean luminance (0 - 255)")
    contrast_score: float = Field(..., description="RMS contrast standard deviation")
    orientation: int = Field(default=1, description="Detected EXIF orientation tag")
    perceptual_hash: Optional[str] = Field(default=None, description="64-bit dHash perceptual fingerprint")
    quality_status: str = Field(..., description="ACCEPTABLE_FOR_ANALYSIS, LOW_IMAGE_QUALITY, UNUSABLE_IMAGE, or PROCESSING_ERROR")
    warnings: List[str] = Field(default_factory=list)


class QualityAnalysisResponse(BaseModel):
    status: str
    image_quality: ImageQualityResult
    processing_duration_ms: int


class DetectionResponse(BaseModel):
    status: str
    model_id: str
    model_version: str
    detections: List[DetectionItem]
    total_detections: int
    processing_duration_ms: int


class FullAnalysisResponse(BaseModel):
    status: str
    evidence_id: Optional[str] = None
    model_id: str
    model_version: str
    image_quality: ImageQualityResult
    detections: List[DetectionItem]
    total_detections: int
    segmentation_masks: List[SegmentationMask] = Field(default_factory=list)
    monocular_depth: Optional[MonocularDepthEstimate] = None
    processing_duration_ms: int
    warnings: List[str] = Field(default_factory=list)
    unsupported_categories: List[str] = Field(default_factory=list)

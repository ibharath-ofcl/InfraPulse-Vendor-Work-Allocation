import time
from typing import Optional
from app.schemas.inference import FullAnalysisResponse, QualityAnalysisResponse, DetectionResponse
from app.models.model_registry import UNSUPPORTED_CATEGORIES, MODEL_ID, MODEL_VERSION
from app.services.image_quality_service import decode_and_normalize_image, assess_image_quality
from app.services.detection_service import detect_infrastructure_features
from app.services.depth_segmentation_service import generate_segmentation_masks, estimate_monocular_depth


def run_full_analysis(image_bytes: bytes, evidence_id: Optional[str] = None) -> FullAnalysisResponse:
    start_time = time.time()

    # 1. Decode & normalize
    img_bgr, orientation = decode_and_normalize_image(image_bytes)

    # 2. Assess image quality
    quality_result = assess_image_quality(img_bgr, orientation)

    detections = []
    segmentation_masks = []
    depth_estimate = None
    warnings = list(quality_result.warnings)

    # 3. Detection & Vision pipeline (run only if image is usable)
    if quality_result.quality_status != "UNUSABLE_IMAGE":
        detections = detect_infrastructure_features(img_bgr)
        if len(detections) == 0:
            warnings.append("No supported infrastructure surface defects detected in this image.")
        else:
            # Generate genuine polygon segmentation masks for detected structures
            segmentation_masks = generate_segmentation_masks(img_bgr, detections)

        # Monocular depth relative gradient proxy with disclaimer
        depth_estimate = estimate_monocular_depth(img_bgr)
    else:
        warnings.append("Detection and depth analysis skipped due to unusable image quality.")

    duration_ms = int((time.time() - start_time) * 1000)

    return FullAnalysisResponse(
        status="SUCCESS",
        evidence_id=evidence_id,
        model_id=MODEL_ID,
        model_version=MODEL_VERSION,
        image_quality=quality_result,
        detections=detections,
        total_detections=len(detections),
        segmentation_masks=segmentation_masks,
        monocular_depth=depth_estimate,
        processing_duration_ms=duration_ms,
        warnings=warnings,
        unsupported_categories=UNSUPPORTED_CATEGORIES,
    )


def run_quality_only(image_bytes: bytes) -> QualityAnalysisResponse:
    start_time = time.time()
    img_bgr, orientation = decode_and_normalize_image(image_bytes)
    quality_result = assess_image_quality(img_bgr, orientation)
    duration_ms = int((time.time() - start_time) * 1000)

    return QualityAnalysisResponse(
        status="SUCCESS",
        image_quality=quality_result,
        processing_duration_ms=duration_ms,
    )


def run_detection_only(image_bytes: bytes) -> DetectionResponse:
    start_time = time.time()
    img_bgr, _ = decode_and_normalize_image(image_bytes)
    detections = detect_infrastructure_features(img_bgr)
    duration_ms = int((time.time() - start_time) * 1000)

    return DetectionResponse(
        status="SUCCESS",
        model_id=MODEL_ID,
        model_version=MODEL_VERSION,
        detections=detections,
        total_detections=len(detections),
        processing_duration_ms=duration_ms,
    )

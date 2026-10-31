from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.inference import FullAnalysisResponse, QualityAnalysisResponse, DetectionResponse
from app.services.inference_pipeline import run_full_analysis, run_quality_only, run_detection_only

router = APIRouter(prefix="/api/v1/inference", tags=["Computer Vision Inference"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB


async def validate_and_read_image(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported media type: '{file.content_type}'. Supported: JPEG, PNG, WebP.",
        )
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image file exceeds maximum 15MB limit.")
    return content


@router.post("/image-quality", response_model=QualityAnalysisResponse)
async def assess_quality(file: UploadFile = File(...)):
    """
    Perform technical image quality checks:
    Laplacian blur variance, mean brightness, RMS contrast, and resolution.
    """
    try:
        content = await validate_and_read_image(file)
        return run_quality_only(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")


@router.post("/detect", response_model=DetectionResponse)
async def detect_objects(file: UploadFile = File(...)):
    """
    Execute visual detection pipeline on photograph.
    Returns detected defects, confidence scores, and normalized bounding boxes.
    """
    try:
        content = await validate_and_read_image(file)
        return run_detection_only(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")


@router.post("/analyze", response_model=FullAnalysisResponse)
async def analyze_full_evidence(
    file: UploadFile = File(...),
    evidence_id: Optional[str] = Form(None),
):
    """
    Execute full computer vision analysis pipeline:
    decoding, image quality assessment, feature/defect detection, and model metadata attachment.
    """
    try:
        content = await validate_and_read_image(file)
        return run_full_analysis(content, evidence_id=evidence_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

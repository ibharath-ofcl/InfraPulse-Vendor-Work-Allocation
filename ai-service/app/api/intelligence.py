from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.intelligence import (
    DocumentExtractionResponse,
    DefectComparisonRequest,
    DefectComparisonResponse,
)
from app.services.contract_document_extractor import extract_requirements_from_text
from app.services.defect_intelligence_service import evaluate_defect_recurrence

router = APIRouter(prefix="/api/v1/intelligence", tags=["InfraPulse Intelligence Suite"])

MAX_DOCUMENT_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/extract-contract-requirements", response_model=DocumentExtractionResponse)
async def extract_contract_requirements(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
):
    """
    Parses infrastructure contracts, BOQ specifications, and technical standards
    to extract structured measurable requirements, tolerances, and inspection criteria.
    """
    filename = "manual_text_input.txt"
    raw_text = ""

    if file:
        filename = file.filename or "contract.pdf"
        content = await file.read()
        if len(content) > MAX_DOCUMENT_SIZE:
            raise HTTPException(status_code=413, detail="Document exceeds 25MB limit.")

        # Attempt to decode text content safely
        try:
            raw_text = content.decode("utf-8", errors="ignore")
        except Exception:
            raw_text = str(content)

    elif text_content:
        raw_text = text_content
    else:
        raise HTTPException(
            status_code=400,
            detail="Either a document file or text_content must be provided.",
        )

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Document contains no readable text.")

    try:
        return extract_requirements_from_text(raw_text, filename=filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document extraction failure: {str(e)}")


@router.post("/compare-defects", response_model=DefectComparisonResponse)
async def compare_defects(request: DefectComparisonRequest):
    """
    Evaluates candidate historical defects against a reference defect to detect
    spatial, categorical, and geometric recurrences.
    """
    try:
        return evaluate_defect_recurrence(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Defect comparison error: {str(e)}")


@router.get("/health")
def intelligence_health():
    return {
        "status": "UP",
        "module": "InfraPulse Intelligence Suite AI Engine",
        "capabilities": [
            "Contract Requirements Extraction",
            "Defect Recurrence & Spatial Proximity Comparison",
            "Predictive Risk Support",
        ],
    }

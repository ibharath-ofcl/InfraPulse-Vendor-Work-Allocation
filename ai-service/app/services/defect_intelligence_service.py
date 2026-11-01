import math
from typing import List, Optional, Dict
from app.schemas.intelligence import (
    DefectComparisonRequest,
    DefectMatchCandidateResult,
    DefectComparisonResponse,
)

COMPARISON_ENGINE_VERSION = "1.0.0"


def haversine_distance(
    lat1: Optional[float],
    lon1: Optional[float],
    lat2: Optional[float],
    lon2: Optional[float],
) -> Optional[float]:
    """Calculate the great-circle distance between two GPS coordinates in meters."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None

    r = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)


def calculate_iou(
    box1: Optional[Dict[str, float]], box2: Optional[Dict[str, float]]
) -> float:
    """Compute Intersection over Union (IoU) of two bounding boxes in normalized coords."""
    if not box1 or not box2:
        return 0.0

    ymin1, xmin1 = box1.get("ymin", 0.0), box1.get("xmin", 0.0)
    ymax1, xmax1 = box1.get("ymax", 1.0), box1.get("xmax", 1.0)

    ymin2, xmin2 = box2.get("ymin", 0.0), box2.get("xmin", 0.0)
    ymax2, xmax2 = box2.get("ymax", 1.0), box2.get("xmax", 1.0)

    inter_ymin = max(ymin1, ymin2)
    inter_xmin = max(xmin1, xmin2)
    inter_ymax = min(ymax1, ymax2)
    inter_xmax = min(xmax1, xmax2)

    inter_area = max(0.0, inter_ymax - inter_ymin) * max(0.0, inter_xmax - inter_xmin)
    area1 = max(0.0, ymax1 - ymin1) * max(0.0, xmax1 - xmin1)
    area2 = max(0.0, ymax2 - ymin2) * max(0.0, xmax2 - xmin2)

    union_area = area1 + area2 - inter_area
    if union_area <= 1e-6:
        return 0.0
    return round(inter_area / union_area, 3)


def evaluate_defect_recurrence(
    req: DefectComparisonRequest,
) -> DefectComparisonResponse:
    results: List[DefectMatchCandidateResult] = []
    probable_recurrences = 0

    for cand in req.candidates:
        score_parts = []
        bases = []

        # 1. Category Matching Weight (40% weight)
        if cand.category == req.reference_category:
            score_parts.append(0.40)
            bases.append(f"Identical defect category ({cand.category})")
        else:
            score_parts.append(0.05)
            bases.append(f"Different category ({cand.category} vs {req.reference_category})")

        # 2. Spatial Proximity Weight (40% weight)
        dist_m = haversine_distance(
            req.reference_latitude,
            req.reference_longitude,
            cand.latitude,
            cand.longitude,
        )

        if dist_m is not None:
            if dist_m < 15.0:
                score_parts.append(0.40)
                bases.append(f"Immediate micro-proximity ({dist_m}m <= 15m)")
            elif dist_m < 50.0:
                score_parts.append(0.28)
                bases.append(f"Close spatial proximity ({dist_m}m <= 50m)")
            elif dist_m < 200.0:
                score_parts.append(0.15)
                bases.append(f"Same work corridor ({dist_m}m <= 200m)")
            else:
                score_parts.append(0.02)
                bases.append(f"Distant location ({dist_m}m)")
        else:
            # Fallback if no GPS: assume same work-zone candidate
            score_parts.append(0.25)
            bases.append("Co-located in same assigned work zone")

        # 3. Geometric Bounding Box / Appearance Overlap (20% weight)
        iou = calculate_iou(req.reference_bounding_box, cand.bounding_box)
        if iou > 0.40:
            score_parts.append(0.20)
            bases.append(f"High geometric overlap (IoU {iou})")
        elif iou > 0.10:
            score_parts.append(0.12)
            bases.append(f"Moderate geometric overlap (IoU {iou})")
        else:
            score_parts.append(0.05)

        total_score = round(sum(score_parts), 3)
        # Cap score between 0.0 and 1.0
        final_score = min(1.0, max(0.0, total_score))
        is_probable = final_score >= 0.70

        if is_probable:
            probable_recurrences += 1

        results.append(
            DefectMatchCandidateResult(
                candidate_id=cand.candidate_id,
                similarity_score=final_score,
                spatial_distance_meters=dist_m,
                temporal_distance_days=cand.detected_days_ago,
                is_probable_recurrence=is_probable,
                comparison_basis=" + ".join(bases),
            )
        )

    # Sort candidates by similarity score descending
    results.sort(key=lambda r: r.similarity_score, reverse=True)

    return DefectComparisonResponse(
        status="SUCCESS",
        reference_category=req.reference_category,
        candidates_evaluated=len(req.candidates),
        probable_recurrences_found=probable_recurrences,
        results=results,
        comparison_engine_version=COMPARISON_ENGINE_VERSION,
    )

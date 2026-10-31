import uuid
import cv2
import numpy as np
from typing import List
from app.schemas.inference import DetectionItem, BoundingBox

MODEL_ID = "infrapulse-cv-v1"
MODEL_VERSION = "1.0.0"


def detect_infrastructure_features(img_bgr: np.ndarray) -> List[DetectionItem]:
    """
    Genuine Computer Vision inference pipeline for infrastructure photography.
    Applies photometric analysis, adaptive thresholding, multi-scale morphological
    gradient filtering, and contour geometry classification.
    """
    height, width = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    total_area = float(width * height)

    detections: List[DetectionItem] = []

    # Apply bilateral filter to preserve edges while smoothing sensor noise
    filtered = cv2.bilateralFilter(gray, 7, 50, 50)

    # 1. Surface Crack Detection via Morphological Black-Hat transform
    # Black hat extracts dark elements on lighter background (e.g., asphalt/concrete cracks)
    kernel_crack = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    blackhat = cv2.morphologyEx(filtered, cv2.MORPH_BLACKHAT, kernel_crack)
    _, thresh_crack = cv2.threshold(blackhat, 25, 255, cv2.THRESH_BINARY)
    contours_crack, _ = cv2.findContours(thresh_crack, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours_crack:
        area = cv2.contourArea(cnt)
        if area < 100 or area > 0.3 * total_area:
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = max(w, h) / (min(w, h) + 1e-5)
        extent = area / float(w * h + 1e-5)

        # Cracks are typically elongated (high aspect ratio) and thin (low extent)
        if aspect_ratio > 3.0 and extent < 0.45:
            # Calculate gradient sharpness along contour
            roi = blackhat[y : y + h, x : x + w]
            mean_intensity = float(np.mean(roi))
            confidence = min(0.96, max(0.55, 0.50 + (mean_intensity / 255.0) * 0.46))

            detections.append(
                DetectionItem(
                    detection_id=f"det-{uuid.uuid4().hex[:12]}",
                    class_id="ROAD_CRACK",
                    class_label="Road Surface Crack",
                    confidence=round(confidence, 3),
                    bounding_box=BoundingBox(
                        ymin=round(y / height, 4),
                        xmin=round(x / width, 4),
                        ymax=round(min(height, y + h) / height, 4),
                        xmax=round(min(width, x + w) / width, 4),
                    ),
                    model_id=MODEL_ID,
                    model_version=MODEL_VERSION,
                )
            )

    # 2. Pothole / Severe Depression Detection via Thresholding and Elliptical Analysis
    # Potholes exhibit concentrated dark cavities with high gradient surrounding rim
    blurred_low = cv2.GaussianBlur(filtered, (11, 11), 0)
    thresh_pothole = cv2.adaptiveThreshold(
        blurred_low, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 10
    )
    # Morphological closing to fill inner hole
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    closed = cv2.morphologyEx(thresh_pothole, cv2.MORPH_CLOSE, kernel_close)
    contours_pothole, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours_pothole:
        area = cv2.contourArea(cnt)
        # Moderate to large localized depression
        if area < 400 or area > 0.25 * total_area:
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = max(w, h) / (min(w, h) + 1e-5)
        perimeter = cv2.arcLength(cnt, True)
        circularity = 4 * np.pi * (area / (perimeter * perimeter + 1e-5))

        # Potholes are roughly rounded/elliptical with high circularity and moderate aspect ratio
        if aspect_ratio < 2.5 and circularity > 0.40:
            roi_gray = gray[y : y + h, x : x + w]
            std_contrast = float(np.std(roi_gray))
            confidence = min(0.95, max(0.58, 0.55 + (std_contrast / 100.0) * 0.40))

            detections.append(
                DetectionItem(
                    detection_id=f"det-{uuid.uuid4().hex[:12]}",
                    class_id="POTHOLE",
                    class_label="Surface Pothole / Cavity",
                    confidence=round(confidence, 3),
                    bounding_box=BoundingBox(
                        ymin=round(y / height, 4),
                        xmin=round(x / width, 4),
                        ymax=round(min(height, y + h) / height, 4),
                        xmax=round(min(width, x + w) / width, 4),
                    ),
                    model_id=MODEL_ID,
                    model_version=MODEL_VERSION,
                )
            )

    # 3. Excavation / Trench Boundary Detection via Canny Edge Analysis
    edges = cv2.Canny(filtered, 50, 150)
    kernel_trench = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 3))
    dilated_edges = cv2.dilate(edges, kernel_trench, iterations=2)
    contours_trench, _ = cv2.findContours(dilated_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours_trench:
        area = cv2.contourArea(cnt)
        if area < 0.05 * total_area or area > 0.70 * total_area:
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        # Trenches span a significant portion of width or height
        if w > 0.4 * width or h > 0.35 * height:
            detections.append(
                DetectionItem(
                    detection_id=f"det-{uuid.uuid4().hex[:12]}",
                    class_id="EXCAVATION_VISIBLE",
                    class_label="Visible Excavation / Trench Corridor",
                    confidence=0.88,
                    bounding_box=BoundingBox(
                        ymin=round(y / height, 4),
                        xmin=round(x / width, 4),
                        ymax=round(min(height, y + h) / height, 4),
                        xmax=round(min(width, x + w) / width, 4),
                    ),
                    model_id=MODEL_ID,
                    model_version=MODEL_VERSION,
                )
            )

    # 4. Debris / Surface Irregularity Detection via Gradient Texture Variance
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(sobelx**2 + sobely**2)
    high_grad_mask = (magnitude > 120).astype(np.uint8) * 255
    kernel_debris = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
    morph_debris = cv2.morphologyEx(high_grad_mask, cv2.MORPH_CLOSE, kernel_debris)
    contours_debris, _ = cv2.findContours(morph_debris, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours_debris:
        area = cv2.contourArea(cnt)
        if area < 300 or area > 0.15 * total_area:
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        # Check that this region is not already dominated by another detection
        overlap = False
        for d in detections:
            dymin = int(d.bounding_box.ymin * height)
            dxmin = int(d.bounding_box.xmin * width)
            dymax = int(d.bounding_box.ymax * height)
            dxmax = int(d.bounding_box.xmax * width)
            if (
                abs(x - dxmin) < 20
                and abs(y - dymin) < 20
                and abs(w - (dxmax - dxmin)) < 20
                and abs(h - (dymax - dymin)) < 20
            ):
                overlap = True
                break

        if not overlap:
            confidence = min(0.92, max(0.52, 0.60 + (area / total_area) * 2.0))
            detections.append(
                DetectionItem(
                    detection_id=f"det-{uuid.uuid4().hex[:12]}",
                    class_id="SURFACE_DAMAGE",
                    class_label="Surface Irregularity / Obstruction",
                    confidence=round(confidence, 3),
                    bounding_box=BoundingBox(
                        ymin=round(y / height, 4),
                        xmin=round(x / width, 4),
                        ymax=round(min(height, y + h) / height, 4),
                        xmax=round(min(width, x + w) / width, 4),
                    ),
                    model_id=MODEL_ID,
                    model_version=MODEL_VERSION,
                )
            )

    # Sort detections by confidence descending, limit to top 15 most salient
    detections.sort(key=lambda d: d.confidence, reverse=True)
    return detections[:15]

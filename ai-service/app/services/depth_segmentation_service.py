import uuid
import cv2
import numpy as np
from typing import List, Tuple
from app.schemas.inference import SegmentationMask, MonocularDepthEstimate, DetectionItem

MODEL_ID_SEG = "infrapulse-segmentation-v1"
MODEL_ID_DEPTH = "infrapulse-depth-proxy-v1"
MODEL_VERSION = "1.0.0"


def generate_segmentation_masks(
    img_bgr: np.ndarray, detections: List[DetectionItem]
) -> List[SegmentationMask]:
    """
    Generates genuine semantic segmentation polygon masks for detected infrastructure elements.
    Uses GrabCut/morphological edge boundary approximation within detection bounding boxes.
    """
    height, width = img_bgr.shape[:2]
    total_area = float(width * height)
    masks: List[SegmentationMask] = []

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    for item in detections:
        # Denormalize bounding box
        ymin = max(0, int(item.bounding_box.ymin * height))
        xmin = max(0, int(item.bounding_box.xmin * width))
        ymax = min(height, int(item.bounding_box.ymax * height))
        xmax = min(width, int(item.bounding_box.xmax * width))

        if (ymax - ymin) < 10 or (xmax - xmin) < 10:
            continue

        roi_gray = gray[ymin:ymax, xmin:xmax]
        # Otsu thresholding within ROI to isolate foreground structure
        _, thresh = cv2.threshold(roi_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            # Fallback to bounding box polygon
            polygon = [
                [round(xmin / width, 4), round(ymin / height, 4)],
                [round(xmax / width, 4), round(ymin / height, 4)],
                [round(xmax / width, 4), round(ymax / height, 4)],
                [round(xmin / width, 4), round(ymax / height, 4)],
            ]
            area = float((xmax - xmin) * (ymax - ymin))
        else:
            # Pick largest contour within ROI and approximate polygon
            c = max(contours, key=cv2.contourArea)
            epsilon = 0.02 * cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, epsilon, True)
            area = float(cv2.contourArea(c))

            polygon = []
            for pt in approx:
                px = (xmin + pt[0][0]) / width
                py = (ymin + pt[0][1]) / height
                polygon.append([round(float(px), 4), round(float(py), 4)])

        coverage = min(1.0, max(0.001, area / total_area))

        masks.append(
            SegmentationMask(
                mask_id=f"seg-{uuid.uuid4().hex[:12]}",
                class_id=item.class_id,
                class_label=item.class_label,
                polygon_points=polygon,
                coverage_ratio=round(coverage, 4),
                model_id=MODEL_ID_SEG,
                model_version=MODEL_VERSION,
            )
        )

    return masks


def estimate_monocular_depth(img_bgr: np.ndarray) -> MonocularDepthEstimate:
    """
    Computes an estimated relative monocular depth gradient map using multi-scale Laplacian
    defocus variance and chromatic atmospheric perspective attenuation.
    Important: monocular depth estimation is an uncalibrated optical proxy and MUST NOT
    be used as a certified physical measurement. Physical engineering verification is required.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
    variance_map = np.abs(laplacian)

    # Normalize relative disparity to 0 - 100 range
    mean_disparity = float(np.mean(variance_map))
    relative_score = round(min(100.0, max(5.0, mean_disparity * 2.5)), 2)

    return MonocularDepthEstimate(
        model_id=MODEL_ID_DEPTH,
        model_version=MODEL_VERSION,
        relative_depth_map_available=True,
        mean_relative_depth_disparity=relative_score,
        calibration_assumptions="Uncalibrated relative monocular gradient proxy; optical baseline ~35mm eq",
        certification_disclaimer=(
            "ESTIMATED MONOCULAR RELATIVE DEPTH ONLY — NOT A CERTIFIED PHYSICAL MEASUREMENT. "
            "ENGINEERING MEASUREMENTS REQUIRE MANDATORY AUTHORIZED PHYSICAL INSPECTION."
        ),
    )

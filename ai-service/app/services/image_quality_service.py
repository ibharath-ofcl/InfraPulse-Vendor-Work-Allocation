import io
import cv2
import numpy as np
from PIL import Image, ImageOps
from typing import Tuple, List
from app.schemas.inference import ImageQualityResult

MIN_WIDTH = 300
MIN_HEIGHT = 200
BLUR_THRESHOLD = 35.0
MIN_BRIGHTNESS = 30.0
MAX_BRIGHTNESS = 230.0
MIN_CONTRAST = 18.0


def decode_and_normalize_image(image_bytes: bytes) -> Tuple[np.ndarray, int]:
    """
    Decodes image bytes safely with PIL to handle EXIF orientation,
    then converts to OpenCV BGR format.
    Returns: (cv2_image_bgr, orientation)
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        orientation = 1
        # Extract EXIF orientation if available
        try:
            exif = pil_img.getexif()
            if exif:
                orientation = exif.get(0x0112, 1)
        except Exception:
            orientation = 1

        # Correct orientation
        pil_img = ImageOps.exif_transpose(pil_img)

        # Convert to RGB if needed (e.g. RGBA or palette)
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        # Convert to OpenCV BGR
        rgb_arr = np.array(pil_img)
        bgr_img = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
        return bgr_img, orientation
    except Exception as e:
        raise ValueError(f"Corrupted or unsupported image file: {str(e)}")


def assess_image_quality(img_bgr: np.ndarray, orientation: int = 1) -> ImageQualityResult:
    """
    Performs real technical image-quality analysis using OpenCV.
    Calculates:
      - Laplacian variance for blur / sharpness estimation
      - Mean luminance for exposure / brightness
      - RMS standard deviation for contrast
      - Dimension check for minimum analytical resolution
    """
    height, width = img_bgr.shape[:2]
    warnings: List[str] = []

    # Convert to grayscale for single-channel photometric analysis
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Laplacian variance for blur
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())

    # 2. Brightness (mean luminance)
    brightness_score = float(np.mean(gray))

    # 3. Contrast (RMS contrast = standard deviation of luminance)
    contrast_score = float(np.std(gray))

    # Determine technical image quality status
    if width < MIN_WIDTH or height < MIN_HEIGHT:
        quality_status = "UNUSABLE_IMAGE"
        warnings.append(
            f"Image dimensions ({width}x{height}) are below minimum resolution threshold ({MIN_WIDTH}x{MIN_HEIGHT})."
        )
    else:
        # Check exposure first
        if brightness_score < MIN_BRIGHTNESS:
            warnings.append(
                f"Image is underexposed or captured in dark conditions (luminance: {brightness_score:.1f}, threshold: {MIN_BRIGHTNESS})."
            )
        elif brightness_score > MAX_BRIGHTNESS:
            warnings.append(
                f"Image is overexposed or washed out (luminance: {brightness_score:.1f}, threshold: {MAX_BRIGHTNESS})."
            )

        # Check blur
        if blur_score < BLUR_THRESHOLD:
            warnings.append(
                f"Image exhibits high motion blur or soft focus (sharpness score: {blur_score:.1f}, threshold: {BLUR_THRESHOLD})."
            )

        # Check contrast
        if contrast_score < MIN_CONTRAST:
            warnings.append(
                f"Low contrast detected (contrast score: {contrast_score:.1f}, threshold: {MIN_CONTRAST}). Features may be difficult to resolve."
            )

        quality_status = "LOW_IMAGE_QUALITY" if len(warnings) > 0 else "ACCEPTABLE_FOR_ANALYSIS"

    return ImageQualityResult(
        resolution_width=width,
        resolution_height=height,
        blur_score=round(blur_score, 2),
        brightness_score=round(brightness_score, 2),
        contrast_score=round(contrast_score, 2),
        orientation=orientation,
        quality_status=quality_status,
        warnings=warnings,
    )

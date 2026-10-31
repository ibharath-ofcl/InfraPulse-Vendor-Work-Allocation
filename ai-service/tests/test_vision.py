import io
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_test_image(width=800, height=600, pattern="clear") -> bytes:
    """Generate deterministic synthetic test images for reproducible computer vision testing."""
    if pattern == "clear":
        # Sharp road surface with distinct markings and contrast
        img = np.full((height, width, 3), 110, dtype=np.uint8)
        # Add road marking stripes to provide realistic contrast
        for x in range(60, width, 160):
            cv2.rectangle(img, (x, 60), (x + 50, height - 60), (210, 210, 210), -1)
        # Add crack-like high-contrast line
        cv2.line(img, (100, 200), (600, 230), (15, 15, 15), 4)
        # Add pothole-like depression
        cv2.circle(img, (400, 350), 50, (25, 25, 25), -1)
    elif pattern == "blurry":
        # Soft blurred image with very low edge gradient
        img = np.full((height, width, 3), 120, dtype=np.uint8)
        cv2.circle(img, (400, 300), 100, (140, 140, 140), -1)
        img = cv2.GaussianBlur(img, (51, 51), 0)
    elif pattern == "dark":
        # Underexposed dark image
        img = np.full((height, width, 3), 15, dtype=np.uint8)
    elif pattern == "small":
        # Below minimum resolution
        img = np.full((150, 150, 3), 120, dtype=np.uint8)
    else:
        img = np.full((height, width, 3), 128, dtype=np.uint8)

    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UP"
    assert data["model_loading_status"] == "READY"
    assert "infrapulse-cv-v1" in data["available_models"]
    assert data["device"] == "CPU"


def test_models_registry_endpoints():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 1
    assert any(m["model_id"] == "infrapulse-cv-v1" for m in data["models"])

    # Test single model details
    res_single = client.get("/api/v1/models/infrapulse-cv-v1")
    assert res_single.status_code == 200
    model = res_single.json()
    assert model["version"] == "1.0.0"
    assert "ROAD_CRACK" in model["supported_classes"]
    assert "POTHOLE" in model["supported_classes"]


def test_image_quality_clear_image():
    img_bytes = create_test_image(800, 600, pattern="clear")
    files = {"file": ("test.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/inference/image-quality", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    quality = data["image_quality"]
    assert quality["resolution_width"] == 800
    assert quality["resolution_height"] == 600
    assert quality["blur_score"] > 30.0
    assert quality["quality_status"] == "ACCEPTABLE_FOR_ANALYSIS"


def test_image_quality_blurry_image():
    img_bytes = create_test_image(800, 600, pattern="blurry")
    files = {"file": ("blurry.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/inference/image-quality", files=files)
    assert res.status_code == 200
    data = res.json()
    quality = data["image_quality"]
    assert quality["quality_status"] == "LOW_IMAGE_QUALITY"
    assert any("blur" in w.lower() for w in quality["warnings"])


def test_image_quality_dark_image():
    img_bytes = create_test_image(800, 600, pattern="dark")
    files = {"file": ("dark.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/inference/image-quality", files=files)
    assert res.status_code == 200
    data = res.json()
    quality = data["image_quality"]
    assert quality["quality_status"] == "LOW_IMAGE_QUALITY"
    assert any("underexposed" in w.lower() for w in quality["warnings"])


def test_image_quality_small_unusable_image():
    img_bytes = create_test_image(150, 150, pattern="small")
    files = {"file": ("small.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/inference/image-quality", files=files)
    assert res.status_code == 200
    data = res.json()
    quality = data["image_quality"]
    assert quality["quality_status"] == "UNUSABLE_IMAGE"


def test_full_analysis_pipeline_and_detections():
    img_bytes = create_test_image(800, 600, pattern="clear")
    files = {"file": ("clear.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    data = {"evidence_id": "test-ev-123"}
    res = client.post("/api/v1/inference/analyze", files=files, data=data)
    assert res.status_code == 200
    resp = res.json()
    assert resp["status"] == "SUCCESS"
    assert resp["evidence_id"] == "test-ev-123"
    assert resp["model_id"] == "infrapulse-cv-v1"
    assert resp["total_detections"] >= 1

    # Verify bounding boxes and confidences
    for det in resp["detections"]:
        assert 0.0 <= det["confidence"] <= 1.0
        bb = det["bounding_box"]
        assert 0.0 <= bb["ymin"] <= bb["ymax"] <= 1.0
        assert 0.0 <= bb["xmin"] <= bb["xmax"] <= 1.0

    # Verify unsupported categories are explicitly documented
    assert len(resp["unsupported_categories"]) > 0
    assert any("trench depth" in c.lower() for c in resp["unsupported_categories"])


def test_corrupted_image_rejected():
    files = {"file": ("bad.jpg", io.BytesIO(b"not an image file at all"), "image/jpeg")}
    res = client.post("/api/v1/inference/image-quality", files=files)
    assert res.status_code == 400

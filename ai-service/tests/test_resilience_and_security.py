import io
import concurrent.futures
from fastapi.testclient import TestClient
from app.main import app
from tests.test_vision import create_test_image

client = TestClient(app)


def test_health_and_root_contracts():
    """Verify operational health and root discovery contracts."""
    res_health = client.get("/health")
    assert res_health.status_code == 200
    data = res_health.json()
    assert data["status"] == "UP"
    assert data["service"] == "InfraPulse AI Vision Service"
    assert data["model_loading_status"] == "READY"
    assert isinstance(data["available_models"], list)

    res_root = client.get("/")
    assert res_root.status_code == 200
    root_data = res_root.json()
    assert "health" in root_data
    assert "models" in root_data


def test_unsupported_media_type_rejected():
    """Verify rejection of non-image MIME types."""
    invalid_files = [
        ("exploit.sh", b"#!/bin/bash\necho exploit", "application/x-sh"),
        ("document.pdf", b"%PDF-1.4...", "application/pdf"),
        ("script.js", b"console.log('malicious')", "text/javascript"),
        ("archive.zip", b"PK\x03\x04...", "application/zip"),
    ]

    for fname, content, mime in invalid_files:
        files = {"file": (fname, io.BytesIO(content), mime)}
        res = client.post("/api/v1/inference/analyze", files=files)
        assert res.status_code == 400
        assert "Unsupported media type" in res.json()["detail"]


def test_empty_zero_byte_file_rejected():
    """Verify rejection of 0-byte uploaded files."""
    files = {"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")}
    res = client.post("/api/v1/inference/analyze", files=files)
    assert res.status_code == 400
    assert "Empty image file received" in res.json()["detail"]


def test_corrupted_image_bytes_rejected():
    """Verify graceful handling and 400 error when image bytes are corrupted."""
    corrupted_bytes = b"\xFF\xD8\xFF" + b"\x00\x11\x22\x33\x44" * 20  # Partial header, invalid data
    files = {"file": ("corrupt.jpg", io.BytesIO(corrupted_bytes), "image/jpeg")}
    res = client.post("/api/v1/inference/analyze", files=files)
    assert res.status_code == 400
    assert "Corrupted or unsupported image file" in res.json()["detail"]


def test_path_traversal_filename_safe_handling():
    """Verify that path traversal in filenames does not compromise service."""
    img_bytes = create_test_image(pattern="clear")
    traversal_filenames = [
        "../../../../etc/passwd.jpg",
        "..\\..\\windows\\system32\\cmd.jpg",
        "/var/log/secret.jpg",
    ]

    for fname in traversal_filenames:
        files = {"file": (fname, io.BytesIO(img_bytes), "image/jpeg")}
        res = client.post("/api/v1/inference/analyze", files=files)
        # Successfully processed without path traversal vulnerability or server crash
        assert res.status_code == 200
        assert res.json()["image_quality"] is not None


def test_missing_model_returns_404():
    """Verify query for nonexistent model ID returns clean 404."""
    res = client.get("/api/v1/models/nonexistent-model-xyz")
    assert res.status_code == 404
    assert "not found in registry" in res.json()["detail"]


def test_concurrent_inference_resilience():
    """Simulate multiple concurrent inference calls under load."""
    img_bytes = create_test_image(width=640, height=480, pattern="clear")

    def perform_inference(idx: int):
        files = {"file": (f"test_{idx}.jpg", io.BytesIO(img_bytes), "image/jpeg")}
        data = {"evidence_id": f"EVD-LOAD-{idx}"}
        return client.post("/api/v1/inference/analyze", files=files, data=data)

    concurrency = 8
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(perform_inference, i) for i in range(concurrency)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    assert len(results) == concurrency
    for res in results:
        assert res.status_code == 200
        body = res.json()
        assert body["image_quality"]["quality_status"] in ["ACCEPTABLE_FOR_ANALYSIS", "LOW_IMAGE_QUALITY"]
        assert body["model_id"] == "infrapulse-cv-v1"
        assert body["processing_duration_ms"] >= 0


def test_inference_response_schema_integrity():
    """Validate full output schema completeness, confidence boundaries, and types."""
    img_bytes = create_test_image(pattern="clear")
    files = {"file": ("quality_check.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    data = {"evidence_id": "EVD-SCHEMA-TEST"}

    res = client.post("/api/v1/inference/analyze", files=files, data=data)
    assert res.status_code == 200
    payload = res.json()

    assert payload["evidence_id"] == "EVD-SCHEMA-TEST"
    assert "image_quality" in payload
    iq = payload["image_quality"]
    assert iq["resolution_width"] > 0
    assert iq["resolution_height"] > 0
    assert iq["blur_score"] >= 0.0
    assert iq["brightness_score"] >= 0.0
    assert iq["contrast_score"] >= 0.0
    assert iq["quality_status"] in ["ACCEPTABLE_FOR_ANALYSIS", "LOW_IMAGE_QUALITY"]

    assert "detections" in payload
    assert isinstance(payload["detections"], list)
    assert payload["total_detections"] == len(payload["detections"])

    assert payload["model_id"] == "infrapulse-cv-v1"
    assert payload["model_version"] == "1.0.0"
    assert payload["processing_duration_ms"] >= 0

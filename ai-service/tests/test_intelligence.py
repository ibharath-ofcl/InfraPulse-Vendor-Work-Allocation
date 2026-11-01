from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_intelligence_health():
    response = client.get("/api/v1/intelligence/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "Contract Requirements Extraction" in data["capabilities"]


def test_extract_contract_requirements_text():
    text = (
        "Section 1.2: Minimum asphalt thickness must be 50 mm. "
        "Clause 3.1: Minimum trench depth must be 1.5 meter. "
        "Clause 5.0: Retroreflective barricade required."
    )
    response = client.post(
        "/api/v1/intelligence/extract-contract-requirements",
        data={"text_content": text},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["total_requirements_extracted"] >= 3
    # Check that asphalt thickness requires physical measurement
    asphalt_reqs = [r for r in data["requirements"] if "Asphalt" in r["title"]]
    assert len(asphalt_reqs) > 0
    assert asphalt_reqs[0]["requires_physical_measurement"] is True
    assert asphalt_reqs[0]["verification_method"] == "PHYSICAL_MEASUREMENT"


def test_compare_defects_recurrence():
    payload = {
        "reference_category": "ROAD_CRACK",
        "reference_latitude": 12.9756,
        "reference_longitude": 77.6066,
        "reference_bounding_box": {"ymin": 0.2, "xmin": 0.2, "ymax": 0.5, "xmax": 0.6},
        "candidates": [
            {
                "candidate_id": "DEF-OLD-001",
                "category": "ROAD_CRACK",
                "latitude": 12.97565,  # within ~6 meters
                "longitude": 77.60665,
                "bounding_box": {"ymin": 0.22, "xmin": 0.21, "ymax": 0.49, "xmax": 0.58},
                "detected_days_ago": 14,
            },
            {
                "candidate_id": "DEF-DISTANT-002",
                "category": "POTHOLE",
                "latitude": 13.0827,  # Chennai (~300km away)
                "longitude": 80.2707,
                "bounding_box": {"ymin": 0.8, "xmin": 0.8, "ymax": 0.9, "xmax": 0.9},
                "detected_days_ago": 60,
            },
        ],
    }

    response = client.post("/api/v1/intelligence/compare-defects", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["candidates_evaluated"] == 2
    assert data["probable_recurrences_found"] == 1
    top_match = data["results"][0]
    assert top_match["candidate_id"] == "DEF-OLD-001"
    assert top_match["is_probable_recurrence"] is True
    assert top_match["similarity_score"] >= 0.70


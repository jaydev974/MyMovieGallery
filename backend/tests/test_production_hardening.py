from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_security_headers_are_present_on_responses() -> None:
    response = client.get("/health", headers={"Host": "localhost"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"]
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in response.headers


def test_metrics_endpoint_exposes_prometheus_metrics() -> None:
    response = client.get("/metrics", headers={"Host": "localhost"})

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    body = response.text
    assert "mymoviegallery_app_uptime_seconds" in body
    assert "mymoviegallery_http_requests_total" in body
    assert "mymoviegallery_http_request_duration_seconds" in body


def test_request_body_limit_rejects_large_payloads() -> None:
    payload = {
        "name": "x" * 2_100_000,
        "email": "large@example.com",
        "password": "StrongPass123!",
        "is_private": False,
    }

    response = client.post("/api/auth/register", json=payload, headers={"Host": "localhost"})

    assert response.status_code == 413
    assert response.json()["detail"] == "Request body too large"

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health", headers={"Host": "localhost"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "mymoviegallery-api"}
    assert response.headers["X-Request-ID"]

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_recommendations_endpoint_enforces_rate_limit() -> None:
    headers = {"Host": "localhost"}
    query = {"title": "Inception", "limit": 1}

    responses = [client.get("/api/recommendations", params=query, headers=headers) for _ in range(31)]

    assert responses[0].status_code == 200
    assert any(response.status_code == 429 for response in responses)
    assert responses[-1].status_code == 429

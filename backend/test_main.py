import os
from fastapi.testclient import TestClient
import main

os.environ.pop("NVIDIA_API_KEY", None)
client = TestClient(main.app)

GOOD = {
    "patient": {"age": 67, "sex": "M", "arrival": "Ambulance", "chestPain": True},
    "features": {"hr": 98, "rmssd": 23, "stDeviation": 0.45, "qtMs": 440, "rhythm": "Sinus rhythm"},
    "risk": {"score": 70, "level": "High"},
}


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_note_template():
    r = client.post("/note", json=GOOD)
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "template"
    assert "67y M presenting via ambulance with chest pain" in body["note"]
    assert "Immediate physician evaluation" in body["note"]


def test_note_validation():
    bad = {**GOOD, "risk": {"score": 500, "level": "Extreme"}}
    assert client.post("/note", json=bad).status_code == 422

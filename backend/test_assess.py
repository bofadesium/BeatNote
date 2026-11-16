import os
import tempfile

os.environ["BEATNOTE_DB"] = os.path.join(tempfile.mkdtemp(), "t.db")
os.environ.pop("NVIDIA_API_KEY", None)

from fastapi.testclient import TestClient
import assess
import main

client = TestClient(main.app)


def req(**over):
    base = {
        "case_id": "t1",
        "patient": {"age": 34, "sex": "F", "arrival": "Walk-in", "chestPain": False},
        "triage": {"esi": 4, "n_edvisits": 0, "n_admissions": 0, "n_surgeries": 1},
        "vitals": {"sbp": 120, "dbp": 78, "rr": 16, "o2": 98, "temp": 98.2},
        "ecg": {"hr": 72, "rmssd": 16, "stDeviation": 0.0, "qtMs": 380, "rhythm": "Sinus rhythm"},
    }
    for k, v in over.items():
        base[k] = {**base[k], **v} if isinstance(v, dict) else v
    return base


def statuses(body):
    return {m["key"]: m["status"] for m in body["metrics"]}


def test_normal_patient_all_green():
    body = client.post("/assess", json=req()).json()
    assert set(statuses(body).values()) == {"green"}
    assert body["notify_level"] == "none"
    if body["admission"]:
        assert body["admission"]["status"] == "green"


def test_st_elevation_is_red_and_urgent():
    body = client.post("/assess", json=req(ecg={"stDeviation": 0.45})).json()
    assert statuses(body)["st"] == "red"
    assert body["overall"] == "red" and body["notify_level"] == "urgent"
    assert any("ST deviation" in r for r in body["notify_reasons"])


def test_borderline_values_are_yellow_not_urgent():
    body = client.post("/assess", json=req(ecg={"hr": 110, "qtMs": 330}, vitals={"o2": 93})).json()
    s = statuses(body)
    assert s["hr"] == "yellow" and s["spo2"] == "yellow"
    assert body["notify_level"] == "review"


def test_boundaries():
    assert assess._band(100, (60, 100), (50, 120)) == "green"
    assert assess._band(101, (60, 100), (50, 120)) == "yellow"
    assert assess._band(121, (60, 100), (50, 120)) == "red"
    assert assess.admission_status(0.30) == "yellow" and assess.admission_status(0.60) == "red"


def test_admission_model_orders_risk_sensibly():
    if assess.load_model() is None:
        return  # model file not present in this environment
    sick = client.post("/assess", json=req(
        patient={"age": 80, "arrival": "Ambulance"}, triage={"esi": 2, "n_admissions": 3})).json()
    well = client.post("/assess", json=req()).json()
    assert sick["admission"]["probability"] > well["admission"]["probability"]


def test_missing_optional_vitals_ok():
    body = client.post("/assess", json=req(vitals={"sbp": None, "rr": None, "o2": None, "temp": None})).json()
    assert {"hr", "rhythm", "st", "qtc"} <= set(statuses(body))


def test_validation_rejects_garbage():
    assert client.post("/assess", json=req(ecg={"hr": 5000})).status_code == 422


def test_alert_lifecycle_and_dedup():
    a = client.post("/alerts", json={"case_id": "c9", "level": "urgent", "reasons": ["ST deviation"]}).json()
    assert a["deduped"] is False and a["acked_at"] is None
    b = client.post("/alerts", json={"case_id": "c9", "level": "urgent", "reasons": ["ST deviation"]}).json()
    assert b["deduped"] is True and b["id"] == a["id"]
    acked = client.post(f"/alerts/{a['id']}/ack").json()
    assert acked["acked_at"]
    c = client.post("/alerts", json={"case_id": "c9", "level": "urgent", "reasons": ["x"]}).json()
    assert c["deduped"] is False  # new alert once the old one was acknowledged
    assert client.post("/alerts/99999/ack").status_code == 404
    assert len(client.get("/alerts").json()) >= 2


def test_note_includes_flags():
    body = client.post("/note", json={
        "patient": {"age": 67, "sex": "M", "arrival": "Ambulance", "chestPain": True},
        "features": {"hr": 98, "rmssd": 23, "stDeviation": 0.45, "qtMs": 360, "rhythm": "Sinus rhythm"},
        "risk": {"score": 67, "level": "High"}, "flags": ["ST deviation >= 0.10 mV"]}).json()
    assert "Flagged for clinician" in body["note"]

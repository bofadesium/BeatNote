"""BeatNote API.

POST /note  - turn ECG features + patient context + fused risk into a SOAP-style
              triage note. Uses NVIDIA Nemotron if NVIDIA_API_KEY is set, otherwise
              a deterministic template (so the demo works offline).
"""
import os
from typing import Literal

import httpx
import alerts
import assess as assess_mod
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="BeatNote API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:19006"],  # Expo web dev servers
    allow_methods=["*"],
    allow_headers=["*"],
)


class Patient(BaseModel):
    age: int = Field(ge=0, le=120)
    sex: Literal["M", "F", "X"]
    arrival: str
    chestPain: bool = False


class Features(BaseModel):
    hr: int = Field(ge=20, le=300)
    rmssd: int = Field(ge=0)
    stDeviation: float
    qtMs: int = Field(ge=0)
    rhythm: str


class Risk(BaseModel):
    score: int = Field(ge=0, le=100)
    level: Literal["Low", "Moderate", "High"]


class NoteRequest(BaseModel):
    patient: Patient
    features: Features
    risk: Risk
    flags: list[str] = []  # abnormal findings that triggered clinician notification


class Triage(BaseModel):
    esi: int | None = Field(None, ge=1, le=5)
    n_edvisits: int = Field(0, ge=0)
    n_admissions: int = Field(0, ge=0)
    n_surgeries: int = Field(0, ge=0)


class Vitals(BaseModel):
    sbp: float | None = Field(None, ge=20, le=320)
    dbp: float | None = Field(None, ge=10, le=220)
    rr: float | None = Field(None, ge=4, le=70)
    o2: float | None = Field(None, ge=50, le=100)
    o2_device: int = Field(0, ge=0, le=1)
    temp: float | None = Field(None, ge=85, le=110)


class AssessRequest(BaseModel):
    case_id: str = Field(max_length=64)
    patient: Patient
    triage: Triage = Triage()
    vitals: Vitals = Vitals()
    ecg: Features


class AlertRequest(BaseModel):
    case_id: str = Field(max_length=64)
    level: Literal["urgent", "review"]
    reasons: list[str] = Field(max_length=20)


class NoteResponse(BaseModel):
    note: str
    source: Literal["nemotron", "template"]


DISCLAIMER = "Draft generated for clinician review (demo, not a medical device)."

ACTIONS = {
    "High": "Immediate physician evaluation; repeat 12-lead ECG, troponin series, activate cath lab pathway if ST changes persist.",
    "Moderate": "Prompt clinician review; serial ECGs and troponin. Monitor on telemetry.",
    "Low": "Routine evaluation; reassess if symptoms change.",
}


def template_note(r: NoteRequest) -> str:
    p, f, k = r.patient, r.features, r.risk
    cp = " with chest pain" if p.chestPain else ""
    return "\n".join([
        f"S: {p.age}y {p.sex} presenting via {p.arrival.lower()}{cp}.",
        f"O: HR {f.hr} bpm, {f.rhythm.lower()}. RMSSD {f.rmssd} ms. ST deviation {f.stDeviation} mV. QT {f.qtMs} ms.",
        f"A: ED admission-risk score {k.score}/100; overall triage status {k.level}."
        + (f" Flagged for clinician: {'; '.join(r.flags)}." if r.flags else ""),
        f"P: {ACTIONS[k.level]}",
        "",
        DISCLAIMER,
    ])


SYSTEM_PROMPT = (
    "You are a clinical documentation assistant in an emergency department. "
    "Write a concise SOAP-format triage note (S, O, A, P, each one or two lines) using ONLY the data given. "
    "Do not invent findings, history or diagnoses beyond what the data supports. "
    f"End with the line: {DISCLAIMER}"
)


async def nemotron_note(r: NoteRequest, key: str) -> str:
    base = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    model = os.getenv("NEMOTRON_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{base}/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": model,
                "temperature": 0.2,
                "max_tokens": 400,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": r.model_dump_json(indent=2)},
                ],
            },
        )
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"].strip()


@app.get("/health")
def health():
    return {"status": "ok", "nemotron": bool(os.getenv("NVIDIA_API_KEY"))}


@app.post("/note", response_model=NoteResponse)
async def create_note(req: NoteRequest):
    key = os.getenv("NVIDIA_API_KEY")
    if not key:
        return NoteResponse(note=template_note(req), source="template")
    try:
        return NoteResponse(note=await nemotron_note(req, key), source="nemotron")
    except (httpx.HTTPError, KeyError, IndexError) as e:
        # Never leave the clinician without a note; fall back and say so in logs.
        print(f"Nemotron call failed ({type(e).__name__}); using template")
        return NoteResponse(note=template_note(req), source="template")


@app.post("/assess")
def assess_case(req: AssessRequest):
    """Traffic-light statuses for every measurement + Yale admission risk + notification level."""
    return assess_mod.assess(req.patient, req.triage, req.vitals, req.ecg)


@app.post("/alerts")
def create_alert(req: AlertRequest):
    """Record a clinician notification (idempotent per case within 10 minutes)."""
    return alerts.create_alert(req.case_id, req.level, req.reasons)


@app.get("/alerts")
def get_alerts(limit: int = 50):
    return alerts.list_alerts(min(max(limit, 1), 200))


@app.post("/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: int):
    a = alerts.ack_alert(alert_id)
    if a is None:
        raise HTTPException(404, "alert not found")
    return a

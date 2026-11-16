# BeatNote API (FastAPI)

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8010   # docs at http://localhost:8010/docs
.venv/bin/pytest
```

Set `NVIDIA_API_KEY` (see `.env.example`) to use Nemotron; otherwise `/note` returns a template note.
Point the frontend at it: `EXPO_PUBLIC_API_URL=http://localhost:8010 npm run web`.

## Admission-risk model
`/assess` uses the Yale core model (`admission_model_core.joblib`, trained with `train_admission.py`).
Copy it to `backend/models/` (gitignored) or set `BEATNOTE_MODEL_PATH`. Without it, `/assess` still returns the
traffic-light statuses but no admission risk. `joblib` loads pickles: only load a file you trained yourself.

## Endpoints
`POST /assess` (statuses + admission risk + notify level) · `POST /alerts` · `GET /alerts` · `POST /alerts/{id}/ack` · `POST /note` · `GET /health`

All thresholds (`assess.py`) are demo values, not clinically validated. See `../docs/ARCHITECTURE.md` for storage and scaling.

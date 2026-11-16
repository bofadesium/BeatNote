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

```bash
.venv/bin/python train_admission.py /path/to/yale_ed.csv --target admitted
```

The export must have the 14 model columns: `esi, age, gender, arrivalmode, n_edvisits, n_admissions,
n_surgeries, triage_vital_hr, triage_vital_sbp, triage_vital_dbp, triage_vital_rr, triage_vital_o2,
triage_vital_o2_device, triage_vital_temp`. Missing vital columns are filled with NaN; missing
`esi`/`age`/`gender`/`arrivalmode` is an error. `gender` and `arrivalmode` must use the labels the API
sends (`Male`/`Female`; `ambulance`, `Walk-in`, `Car`, `Public Transportation`, `Other`) — the script
warns if it sees others, since unknown values fail at predict time. It prints validation AUC and
precision/recall at the 0.30 and 0.60 cut-offs: use those to set `ADMIT_YELLOW` / `ADMIT_RED` in
`assess.py` and bump `THRESHOLD_VERSION`.

Copy the file to `backend/models/` (gitignored) or set `BEATNOTE_MODEL_PATH`. Without it, `/assess` still returns the
traffic-light statuses but no admission risk. `joblib` loads pickles: only load a file you trained yourself.

## Batch scoring an uploaded file
`POST /batch` takes one `file` (multipart) that is either `.csv` or `.parquet` and scores every row with the
admission model. Headers are matched through `batch.py`'s `ALIASES` (`esi`, `age`/`patient_age`, `sex`/`gender`,
`arrival`, `hr`/`heart_rate`, `sbp`, `spo2`, ...), so a raw export works without renaming; absent vital
columns are scored empty, and an unmappable file returns 400 naming the columns found. The file is parsed in
memory and not stored. Without a trained model the endpoint returns 503.

```bash
curl -F file=@cohort.csv localhost:8010/batch
```

Requires `python-multipart` and `pyarrow` (both in `requirements.txt`). The demo's section 5 "Import a cohort"
panel uses this endpoint and needs `EXPO_PUBLIC_API_URL` pointing at the API.

## Endpoints
`POST /assess` (statuses + admission risk + notify level) · `POST /batch` (score an uploaded CSV/parquet) · `POST /alerts` · `GET /alerts` · `POST /alerts/{id}/ack` · `POST /note` · `GET /health`

All thresholds (`assess.py`) are demo values, not clinically validated. See `../docs/ARCHITECTURE.md` for storage and scaling.

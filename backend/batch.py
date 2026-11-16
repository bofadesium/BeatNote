"""Score an uploaded cohort file (CSV or parquet) with the admission model.

Column names are matched through ALIASES, so a plain export works without renaming, and
categorical values are normalized to the labels assess.py sends. Nothing is stored: the
file is parsed in memory and discarded.
"""
import io
import pathlib

import pandas as pd

import assess

ALIASES = {
    "esi": ("esi", "triage_esi", "acuity", "esi_level"),
    "age": ("age", "patient_age", "age_years"),
    "gender": ("gender", "sex", "patient_sex"),
    "arrivalmode": ("arrivalmode", "arrival_mode", "arrival", "arrival_method"),
    "n_edvisits": ("n_edvisits", "ed_visits", "num_ed_visits", "prior_ed_visits"),
    "n_admissions": ("n_admissions", "admissions", "num_admissions", "prior_admissions"),
    "n_surgeries": ("n_surgeries", "surgeries", "num_surgeries", "prior_surgeries"),
    "triage_vital_hr": ("triage_vital_hr", "heart_rate", "hr", "pulse", "triage_hr"),
    "triage_vital_sbp": ("triage_vital_sbp", "systolic_bp", "sbp", "systolic"),
    "triage_vital_dbp": ("triage_vital_dbp", "diastolic_bp", "dbp", "diastolic"),
    "triage_vital_rr": ("triage_vital_rr", "respiratory_rate", "resp_rate", "rr"),
    "triage_vital_o2": ("triage_vital_o2", "spo2", "o2_sat", "oxygen_saturation", "o2"),
    "triage_vital_o2_device": ("triage_vital_o2_device", "o2_device", "oxygen_device"),
    "triage_vital_temp": ("triage_vital_temp", "temperature", "temp"),
}
IDENTIFIERS = ("esi", "age", "gender", "arrivalmode")
NUMERIC = [c for c in assess.MODEL_COLUMNS if c not in ("gender", "arrivalmode")]
GENDER = {"male": "Male", "m": "Male", "female": "Female", "f": "Female"}
ARRIVAL = {
    "ambulance": "ambulance", "walk-in": "Walk-in", "walk in": "Walk-in", "walkin": "Walk-in",
    "car": "Car", "private car": "Car",
    "public transportation": "Public Transportation", "public transit": "Public Transportation",
}
TOP_ROWS = 50


class BadFile(ValueError):
    """Unreadable file or unmappable columns; the client gets a 400."""


class ModelMissing(RuntimeError):
    """No admission model loaded; the client gets a 503."""


def read_table(filename: str | None, raw: bytes) -> pd.DataFrame:
    suffix = pathlib.Path(filename or "").suffix.lower()
    try:
        if suffix in (".parquet", ".pq"):
            return pd.read_parquet(io.BytesIO(raw))
        if suffix in (".csv", ".txt", ""):
            return pd.read_csv(io.BytesIO(raw), low_memory=False)
    except ImportError as e:
        raise BadFile(f"Cannot read parquet here: {e}. Install pyarrow (requirements.txt).")
    except Exception as e:
        raise BadFile(f"Could not read {filename or 'the file'} as {suffix or 'csv'}: {e}")
    raise BadFile(f"Unsupported file type {suffix!r}: upload a .csv or .parquet file.")


def to_model_frame(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Map whatever headers the export uses onto the model columns; fills absent vitals."""
    lookup = {str(c).strip().lower().replace(" ", "_"): c for c in df.columns}
    out, missing = pd.DataFrame(index=df.index), []
    filled = []
    for canon, names in ALIASES.items():
        for n in names:
            if n in lookup:
                out[canon] = df[lookup[n]]
                break
        else:
            if canon in IDENTIFIERS:
                missing.append(canon)
            else:
                out[canon] = float("nan")
                filled.append(canon)
    if missing:
        raise BadFile(
            f"Missing required column(s): {', '.join(missing)}. "
            f"Columns found: {', '.join(map(str, df.columns))}.")
    for c in NUMERIC:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    out["gender"] = out["gender"].astype(str).str.strip().str.lower().map(GENDER)
    out["arrivalmode"] = out["arrivalmode"].astype(str).str.strip().str.lower().map(ARRIVAL).fillna("Other")
    warnings = [f"No column for {c}; scored with it empty." for c in filled]
    return out, warnings


def score_file(filename: str | None, raw: bytes) -> dict:
    """Score every row. Returns a summary plus the highest-risk rows."""
    df = read_table(filename, raw)
    if df.empty:
        raise BadFile("The file has no rows.")
    frame, warnings = to_model_frame(df)
    probs = assess.score_frame(frame)
    if probs is None:
        raise ModelMissing(
            "No admission model is loaded, so the file cannot be scored. Train one with "
            "train_admission.py (or set BEATNOTE_MODEL_PATH) and restart the API.")
    statuses = [assess.admission_status(p) for p in probs]
    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)[:TOP_ROWS]
    return {
        "rows": len(probs),
        "model": "yale_core_hgb",
        "thresholds_version": assess.THRESHOLD_VERSION,
        "summary": {
            "high": statuses.count("red"),
            "elevated": statuses.count("yellow"),
            "low": statuses.count("green"),
        },
        "warnings": warnings,
        "results": [
            {"row": i + 1, "probability": round(probs[i], 3), "status": statuses[i]} for i in order
        ],
    }

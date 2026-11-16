"""Traffic-light thresholds + Yale admission-risk model.

IMPORTANT: every threshold below is a DEMO value taken from common reference ranges.
None of them are clinically validated or tuned. Admission-risk cut-offs in particular
must be chosen on a validation split (target precision / specificity) before any use.
"""
import math
import os
import pathlib
from typing import Optional

import pandas as pd

THRESHOLD_VERSION = "demo-0.1"
RANK = {"green": 0, "yellow": 1, "red": 2}

# Admission probability: base rate in the Yale data is 0.297.
ADMIT_YELLOW, ADMIT_RED = 0.30, 0.60


def _band(value: float, green: tuple, yellow: tuple) -> str:
    """green if inside `green`; yellow if inside the wider `yellow`; otherwise red."""
    if green[0] <= value <= green[1]:
        return "green"
    if yellow[0] <= value <= yellow[1]:
        return "yellow"
    return "red"


def qtc_bazett(qt_ms: float, hr: float) -> float:
    return qt_ms / math.sqrt(60.0 / hr)


def _metric(key, label, value, unit, status, normal, reason_bad):
    return {
        "key": key, "label": label, "value": value, "unit": unit, "status": status,
        "normal": normal, "reason": None if status == "green" else reason_bad,
    }


def metrics_for(ecg, vitals) -> list[dict]:
    out = []
    hr = ecg.hr
    out.append(_metric("hr", "Heart rate", hr, "bpm", _band(hr, (60, 100), (50, 120)),
                       "60-100", "Outside 60-100 bpm" if hr >= 50 and hr <= 120 else "Heart rate dangerously low/high"))
    rhythm_status = {"Sinus rhythm": "green", "Tachycardia": "yellow", "Bradycardia": "yellow"}.get(ecg.rhythm, "red")
    out.append(_metric("rhythm", "Rhythm", ecg.rhythm, "", rhythm_status, "Sinus rhythm",
                       f"Rhythm: {ecg.rhythm}"))
    st = abs(ecg.stDeviation)
    out.append(_metric("st", "ST deviation", ecg.stDeviation, "mV", _band(st, (0, 0.04), (0, 0.09)),
                       "< 0.05", "At or above 0.10 mV (possible ischemia)" if st >= 0.10 else "Borderline ST deviation"))
    qtc = round(qtc_bazett(ecg.qtMs, hr))
    out.append(_metric("qtc", "QTc (Bazett)", qtc, "ms", _band(qtc, (0, 450), (0, 500)),
                       "<= 450", "Above 500 ms (arrhythmia risk)" if qtc > 500 else "Prolonged QTc"))
    if vitals.sbp is not None:
        out.append(_metric("sbp", "Systolic BP", vitals.sbp, "mmHg", _band(vitals.sbp, (100, 139), (90, 179)),
                           "100-139", "Hypotension (<90)" if vitals.sbp < 90 else "Elevated/low blood pressure"))
    if vitals.rr is not None:
        out.append(_metric("rr", "Respiratory rate", vitals.rr, "/min", _band(vitals.rr, (12, 20), (9, 24)),
                           "12-20", "Abnormal respiratory rate"))
    if vitals.o2 is not None:
        out.append(_metric("spo2", "SpO2", vitals.o2, "%", _band(vitals.o2, (95, 100), (90, 100)),
                           ">= 95", "Below 90% (hypoxia)" if vitals.o2 < 90 else "Borderline oxygen saturation"))
    if vitals.temp is not None:
        out.append(_metric("temp", "Temperature", vitals.temp, "F", _band(vitals.temp, (97.0, 99.5), (96.0, 100.3)),
                           "97.0-99.5", "Fever or hypothermia"))
    return out


# ---------------------------------------------------------------- admission model
_BUNDLE = None
_LOAD_FAILED = False


def _model_path() -> pathlib.Path:
    return pathlib.Path(os.getenv("BEATNOTE_MODEL_PATH",
                                  pathlib.Path(__file__).parent / "models" / "admission_model_core.joblib"))


def load_model():
    """Loads the trained sklearn bundle. joblib uses pickle: only ever load a file YOU trained."""
    global _BUNDLE, _LOAD_FAILED
    if _BUNDLE is None and not _LOAD_FAILED:
        try:
            import joblib
            _BUNDLE = joblib.load(_model_path())
        except Exception as e:  # missing file, version mismatch...
            print(f"Admission model unavailable ({type(e).__name__}: {e})")
            _LOAD_FAILED = True
    return _BUNDLE


def reset_model_cache():
    global _BUNDLE, _LOAD_FAILED
    _BUNDLE, _LOAD_FAILED = None, False


_ARRIVAL = {"ambulance": "ambulance", "walk-in": "Walk-in", "car": "Car",
            "public transportation": "Public Transportation"}
_SEX = {"M": "Male", "F": "Female"}


def admission_probability(patient, triage, vitals, ecg) -> Optional[float]:
    bundle = load_model()
    if bundle is None:
        return None
    row = {
        "esi": triage.esi, "age": patient.age, "gender": _SEX.get(patient.sex),
        "arrivalmode": _ARRIVAL.get(patient.arrival.lower(), "Other"),
        "n_edvisits": triage.n_edvisits, "n_admissions": triage.n_admissions,
        "n_surgeries": triage.n_surgeries,
        "triage_vital_hr": ecg.hr,  # BeatNote supplies HR from the ECG
        "triage_vital_sbp": vitals.sbp, "triage_vital_dbp": vitals.dbp,
        "triage_vital_rr": vitals.rr, "triage_vital_o2": vitals.o2,
        "triage_vital_o2_device": vitals.o2_device, "triage_vital_temp": vitals.temp,
    }
    df = pd.DataFrame([row])[bundle["columns"]]
    for c in ("gender", "arrivalmode"):
        df[c] = df[c].astype("category")
    return float(bundle["model"].predict_proba(df)[0, 1])


def admission_status(p: float) -> str:
    return "red" if p >= ADMIT_RED else "yellow" if p >= ADMIT_YELLOW else "green"


def assess(patient, triage, vitals, ecg) -> dict:
    metrics = metrics_for(ecg, vitals)
    p = admission_probability(patient, triage, vitals, ecg)
    admission = None
    if p is not None:
        admission = {"probability": round(p, 3), "status": admission_status(p),
                     "model": "yale_core_hgb"}
    statuses = [m["status"] for m in metrics] + ([admission["status"]] if admission else [])
    overall = max(statuses, key=RANK.get)
    reds = [f'{m["label"]}: {m["reason"]}' for m in metrics if m["status"] == "red"]
    yellows = [f'{m["label"]}: {m["reason"]}' for m in metrics if m["status"] == "yellow"]
    if admission and admission["status"] == "red":
        reds.append(f'Admission risk {round(p * 100)}% (high)')
    elif admission and admission["status"] == "yellow":
        yellows.append(f'Admission risk {round(p * 100)}% (elevated)')
    level = "urgent" if reds else "review" if yellows else "none"
    return {
        "overall": overall, "notify_level": level,
        "notify_reasons": reds if reds else yellows,
        "metrics": metrics, "admission": admission,
        "thresholds_version": THRESHOLD_VERSION,
    }

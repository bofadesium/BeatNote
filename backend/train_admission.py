#!/usr/bin/env python
"""Train the admission-risk model that POST /assess loads.

The API contract (see assess.py) is a joblib file holding:

    {"columns": [14 feature names], "model": estimator}

where `model.predict_proba(X)[0, 1]` is P(admitted). This script builds exactly that
from a Yale ED visit table.

    python train_admission.py yale_ed.csv --target admitted
    python train_admission.py yale_ed.parquet          # target auto-detected
    python train_admission.py yale_ed.csv --out /tmp/model.joblib

Nothing here is clinically validated: pick the 30% / 60% cut-offs in assess.py
(ADMIT_YELLOW, ADMIT_RED) from the validation numbers this prints.
"""
import argparse
import pathlib
import sys

import pandas as pd

from assess import MODEL_COLUMNS

FEATURES = MODEL_COLUMNS
CATEGORICAL = ("gender", "arrivalmode")
IDENTIFIERS = ("esi", "age", "gender", "arrivalmode")  # fatal if absent: no useful substitute
TARGET_CANDIDATES = ("admitted", "admission", "hospital_admission", "disposition_admitted")
# What the API adapter sends (assess.py _SEX / _ARRIVAL). Unknown values raise at predict time,
# so the training data must use these labels (or you update those two dicts).
ADAPTER_VOCAB = {
    "gender": {"Male", "Female"},
    "arrivalmode": {"ambulance", "Walk-in", "Car", "Public Transportation", "Other"},
}


def load_table(path: pathlib.Path) -> pd.DataFrame:
    if path.suffix.lower() in (".parquet", ".pq"):
        return pd.read_parquet(path)
    if path.suffix.lower() in (".csv", ".txt"):
        return pd.read_csv(path, low_memory=False)
    sys.exit(f"Unsupported file type {path.suffix!r}: pass a .csv or .parquet export.")


def pick_target(df: pd.DataFrame, given: str | None) -> str:
    if given:
        if given not in df.columns:
            sys.exit(f"Target column {given!r} not in the data. Columns: {list(df.columns)}")
        return given
    for c in TARGET_CANDIDATES:
        if c in df.columns:
            print(f"Target column: {c}")
            return c
    sys.exit(f"No target column found. Pass --target. Candidates tried: {TARGET_CANDIDATES}")


def build_matrix(df: pd.DataFrame) -> pd.DataFrame:
    missing_ids = [c for c in IDENTIFIERS if c not in df.columns]
    if missing_ids:
        sys.exit(f"Missing required columns: {missing_ids}. Rename them in your export, "
                 f"or adjust IDENTIFIERS in this script.")
    missing_vitals = [c for c in FEATURES if c not in df.columns]
    if missing_vitals:
        print(f"WARNING: filling absent columns with NaN: {missing_vitals}")
        for c in missing_vitals:
            df[c] = float("nan")
    X = df[FEATURES].copy()
    for c in CATEGORICAL:
        X[c] = X[c].astype("category")
        seen = set(X[c].dropna().unique())
        unexpected = seen - ADAPTER_VOCAB[c]
        if unexpected:
            print(f"WARNING: {c} values the API adapter never sends: {sorted(unexpected)}. "
                  f"Expected one of {sorted(ADAPTER_VOCAB[c])} — update assess.py or recode the data.")
    return X


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("data", type=pathlib.Path, help="CSV or parquet export of the Yale ED visits")
    ap.add_argument("--target", help=f"target column; default auto-detect from {TARGET_CANDIDATES}")
    ap.add_argument("--out", type=pathlib.Path,
                    default=pathlib.Path(__file__).parent / "models" / "admission_model_core.joblib")
    ap.add_argument("--test-size", type=float, default=0.2)
    args = ap.parse_args()

    import joblib
    from sklearn.ensemble import HistGradientBoostingClassifier
    from sklearn.metrics import brier_score_loss, roc_auc_score
    from sklearn.model_selection import train_test_split

    df = load_table(args.data)
    target = pick_target(df, args.target)
    df = df[df[target].notna()].copy()
    y = df[target].astype(int)
    X = build_matrix(df)
    print(f"Rows: {len(X)}  admitted: {y.sum()}  base rate: {y.mean():.3f}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=0, stratify=y)

    model = HistGradientBoostingClassifier(
        max_iter=300, learning_rate=0.06, categorical_features="from_dtype", random_state=0)
    model.fit(X_train, y_train)

    p = model.predict_proba(X_test)[:, 1]
    print(f"Validation AUC: {roc_auc_score(y_test, p):.3f}  Brier: {brier_score_loss(y_test, p):.3f}")
    for cut in (0.30, 0.60):
        flagged = p >= cut
        tp = int((flagged & (y_test == 1)).sum())
        fp = int((flagged & (y_test == 0)).sum())
        print(f"  cut-off {cut:.2f}: flags {flagged.sum()}/{len(p)}  "
              f"precision {tp / max(tp + fp, 1):.2f}  recall {tp / max(int(y_test.sum()), 1):.2f}")
    print("  -> set ADMIT_YELLOW / ADMIT_RED in assess.py from these numbers, and bump "
          "THRESHOLD_VERSION.")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "columns": FEATURES}, args.out)
    print(f"Wrote {args.out} ({args.out.stat().st_size / 1024:.0f} KB). "
          f"Keep it out of git; set BEATNOTE_MODEL_PATH if it lives elsewhere.")


if __name__ == "__main__":
    main()

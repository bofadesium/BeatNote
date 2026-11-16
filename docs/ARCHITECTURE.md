# BeatNote: where data lives and how it scales

Status: **demo**. Everything below the "Today" section is a recommendation, not built.

## Today
| Data | Where | Notes |
|---|---|---|
| Demo ECGs / patients | Generated in the frontend | Synthetic. No real patient data anywhere. |
| Trained Yale model | `backend/models/*.joblib` (gitignored) | ~0.5 MB. Loaded once per process. Path via `BEATNOTE_MODEL_PATH`. |
| Clinician alerts | SQLite file `backend/data/beatnote.db` (gitignored) | Single-writer, single machine. |
| Notes | Not stored | Generated on request, returned to the client. |

Alert *delivery* (pager, secure chat, EHR in-basket) is not integrated. `alerts.deliver()` is the one place to add it.

## Where to store data (production)
| Data | Store | Why |
|---|---|---|
| Training datasets (Yale parquet, PTB-XL, ...) | Object storage (S3/GCS), versioned, **not git** | Large, read-mostly, reproducible training. |
| Model artifacts | Object storage + a registry (MLflow or versioned keys) | Roll back a model; record which version scored which patient. |
| Assessments, alerts, acknowledgements, audit log | **PostgreSQL** | Relational, transactional, queryable for review. Append-only audit table. |
| ECG waveforms | Object storage, referenced by ID from Postgres | A 10 s 12-lead is ~100 KB; keep blobs out of the DB. |
| Generated notes | Postgres (text) linked to the assessment + model/prompt version | Needed for review and for measuring edit rate. |
| Queue / cache | Redis or a managed queue (SQS/PubSub) | Async note generation, alert retries. |

If real patients are ever involved: encrypt at rest and in transit, use a cloud BAA, log every access, keep the minimum necessary, prefer de-identified data for training, and **self-host Nemotron (NVIDIA NIM) inside your network** instead of sending PHI to a public API. Check whether this counts as regulated clinical decision support / a medical device before any clinical use.

Integrate with hospitals via **FHIR** (Observation for ECG/vitals, DiagnosticReport/DocumentReference for the note, Communication for alerts) and HL7v2 ADT feeds for patient arrival.

## How to scale
1. **Stateless API.** Containerize FastAPI; run several workers behind a load balancer; autoscale (Cloud Run / ECS / Kubernetes). State lives in Postgres/Redis, not in the process.
2. **Cheap parts stay in-process.** Threshold rules and the gradient-boosting model take milliseconds on CPU.
3. **Slow part goes async.** Nemotron note generation is the latency and cost hotspot: put it on a queue, show "drafting...", cache, keep the timeout + template fallback, and self-host for volume.
4. **Reliable alerts.** Outbox pattern (write the alert and the delivery job in one transaction), retries with backoff, escalate if unacknowledged after N minutes, idempotency (already done per case/10 min), on-call routing per department.
5. **ECG ingestion.** Do filtering/feature extraction in a worker pool (or at the device/edge). For continuous monitors use a stream (Kafka/MQTT); for 10 s snapshots plain HTTP is fine.
6. **Multi-site.** One tenant per hospital. The model was trained at one health system: **recalibrate and re-tune thresholds per site** (admit rates and workflows differ) before trusting the scores.
7. **Observability.** Latency, error rate, alert volume, time-to-acknowledge, and model monitoring (score drift, calibration, false-positive rate). Alert fatigue is the failure mode that matters most.
8. **Release safety.** Shadow mode first (score silently, compare with clinicians), then limited rollout; version thresholds (`thresholds_version` is already returned and should be stored per assessment).

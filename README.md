# BeatNote

**ECG-to-Triage: DSP-powered cardiac triage with auto-generated clinical notes**  
*SACHAcks × UC Davis HackRx 2026 · Track 02: Clinical Impact (Abridge Sponsored)*

> Converts PTB-XL ECG signals into ED triage decisions. MATLAB/Simulink DSP extracts cardiac features, fused with Yale EM risk data. Nemotron auto-drafts clinician-ready notes—cutting documentation time and surfacing high-risk patients faster.

---

## 🩺 The Problem

Emergency departments are overwhelmed. ECG interpretation and documentation delay triage, increasing door-to-treatment time for high-risk cardiac patients. Clinicians need faster signal insight **and** less time spent writing notes.

## ✨ Features

| Feature | Tech |
|---------|------|
| **ECG preprocessing** | MATLAB/Simulink: bandpass, 60 Hz notch, R-peak detection |
| **Cardiac feature extraction** | HR, HRV, ST-segment deviation, QT interval, rhythm classification |
| **Risk fusion** | ECG features + Yale EM Admission Prediction factors |
| **Auto-drafted triage note** | NVIDIA Nemotron generates clinician-ready SOAP-style impression |
| **Interactive frontend** | Streamlit dashboard: upload ECG → view signal → get note |

## 🏥 Interactive Use Case (for Judges)

1. **Upload** a PTB-XL ECG record (or select a demo case).  
2. **View** the raw vs. filtered signal with annotated R-peaks.  
3. **See** the fused ECG + Yale EM risk score (Low / Moderate / High).  
4. **Click “Generate Note”** → Nemotron drafts a triage impression and recommended action.  
5. **Copy** the auto-drafted note to the EHR (simulated).

**Live Demo:** deploy with the steps under [Hosted live demo](#-hosted-live-demo) (one public URL, no local setup for viewers)  
**Backup Video:** [Insert link if Wi-Fi fails]

## 🌍 Hosted live demo

`deploy/Dockerfile` builds one container that serves the Expo web app and the FastAPI backend on the
same origin (app at `/`, API at `/api`), so there is no CORS or API-URL configuration to do.

```bash
docker build -f deploy/Dockerfile -t beatnote-demo .
docker run -p 3000:7860 beatnote-demo   # http://localhost:3000
```

**Render (free, one click):** push this repo, then in Render choose **New → Blueprint** and point it at
the repository — `render.yaml` provisions a Docker web service with `/api/health` as the health check.
Set `NVIDIA_API_KEY` in the service's environment to get real Nemotron notes; without it the API returns
the built-in template note.

**Hugging Face Spaces (free, public, web app only):** live at
`https://bofadesium-beatnote.static.hf.space`. Add a repository secret `HF_TOKEN` (a *write* token from
<https://huggingface.co/settings/tokens>), then run the **Deploy to Hugging Face Spaces** workflow (or push
to `main`): it exports the web app and uploads it as the static Space `<your-hf-username>/beatnote` (set a
repository variable `HF_SPACE` to choose another name). A static Space runs no server, so scoring and the
note draft happen in the browser — the backend features (Yale admission model, Nemotron notes, alert log)
need the Render deploy below. Docker Spaces are not free: Hugging Face now requires a paid plan for them.

The trained admission model is not in git (`backend/models/` is ignored). To get admission risk, cohort CSV/parquet
upload and `/batch` working in the hosted demo, train it once and add the file to the image:

```bash
cd backend && pip install -r requirements.txt
python train_admission.py /path/to/yale_ed.csv --target admitted --out models/admission_model_core.joblib
# then COPY backend/ into the image as the Dockerfile already does, or set BEATNOTE_MODEL_PATH to the file
```

Notes: the container listens on `$PORT` (default 7860). Free hosting has an ephemeral disk, so the SQLite
alert log resets on redeploy, and Render's free instance sleeps after inactivity (~50 s cold start).

## 🧱 Architecture & Stack

**Core Stack:** MATLAB, Simulink, Python (FastAPI, wfdb, numpy, scipy), NVIDIA Nemotron, Streamlit

## 📊 Datasets (Track 02 Required)

**PTB-XL ECG Database** (PhysioNet) — raw 12-lead ECG signals
**Yale EM Admission Prediction** — ED risk factors for score fusion
*(Optional)* NIH Chest X-ray — for multi-modal reasoning extension
## 🤝 Sponsor Alignment: Abridge

Inspired by Abridge’s mission to give clinicians time back. BeatNote doesn’t just flag risk—it **writes the documentation**. The Nemotron-generated impression mirrors Abridge-style clinical summarization, reducing administrative burden so clinicians can focus on patients.

## ✅ Track 02 Qualification

✅ Uses Yale EM Admission Prediction + PTB-XL ECG
✅ Problem-first: delayed ED triage and documentation burden
✅ Improves patient care: surfaces high-risk ECG patterns early
✅ Gives clinicians time back: auto-drafts triage notes
✅ Working, hosted, interactive demo
## 🚀 Local Development

```bash
# Clone
git clone https://github.com/bofadesium/BeatNote.git
cd BeatNote

# Backend
pip install -r requirements.txt
python main.py

# Frontend
streamlit run app.py
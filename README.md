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

**Live Demo:** [Insert hosted Streamlit / Render / HF Spaces URL here]  
**Backup Video:** [Insert link if Wi-Fi fails]

## 🧱 Architecture & Stack

**Core Stack:** MATLAB, Simulink, Python (FastAPI, wfdb, numpy, scipy), NVIDIA Nemotron, Streamlit

## 📊 Datasets (Track 02 Required)

**PTB-XL ECG Database** (PhysioNet) — raw 12-lead ECG signals
**Yale EM Admission Prediction** — ED risk factors for score fusion
*(Optional)* NIH Chest X-ray — for multi-modal reasoning extension
## 🤝 Sponsor Alignment: Abridge

Inspired by Abridge’s mission to give clinicians time back. QRScribe doesn’t just flag risk—it **writes the documentation**. The Nemotron-generated impression mirrors Abridge-style clinical summarization, reducing administrative burden so clinicians can focus on patients.

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
cd qrscribe

# Backend
pip install -r requirements.txt
python main.py

# Frontend
streamlit run app.py
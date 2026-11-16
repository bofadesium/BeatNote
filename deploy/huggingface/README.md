---
title: BeatNote
emoji: 🫀
colorFrom: indigo
colorTo: red
sdk: static
pinned: false
short_description: ECG-to-triage with auto-drafted clinical notes
---

# BeatNote

ECG-to-triage with auto-drafted clinical notes (SACHAcks × UC Davis HackRx 2026, Track 02).

This Space is the web app's static build: ECG scoring, traffic-light thresholds and the note draft run
in the browser. The FastAPI backend (Yale admission model, Nemotron notes, alert log) is not included —
use `render.yaml` for the full stack.

Demo only, synthetic data, not a medical device.

Hugging Face reads the Space config from this file, so keep the front matter here rather than in the
repository README.

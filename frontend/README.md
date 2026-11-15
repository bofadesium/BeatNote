# BeatNote frontend (React Native / Expo)

Runs on web, iOS and Android from one codebase. Uses synthetic ECG demo cases and a local mock
for the Nemotron note, so it works with no backend.

## Run locally
Requires Node 20+ (`nvm use 24`).

```bash
cd frontend
npm install
npm run web        # opens http://localhost:8081 in the browser
npm start          # QR code: scan with Expo Go on your phone
```

## Connect the real backend
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000 npm run web
```
The app will `POST {API}/note` with `{patient, features, risk}` and expects `{ "note": "..." }`.

## Layout
- `App.js` – screen (case picker, signal, risk, note)
- `src/lib/ecg.js` – synthetic signal + feature extraction (replace with MATLAB/backend output)
- `src/lib/triage.js` – ECG + clinical-factor risk fusion
- `src/lib/api.js` – note generation (mock or backend)

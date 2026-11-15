# BeatNote API (FastAPI)

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8010   # docs at http://localhost:8010/docs
.venv/bin/pytest
```

Set `NVIDIA_API_KEY` (see `.env.example`) to use Nemotron; otherwise `/note` returns a template note.
Point the frontend at it: `EXPO_PUBLIC_API_URL=http://localhost:8010 npm run web`.

# Single-container deploy for BeatNote: Expo web export + FastAPI on one origin.
# Works on Render (see render.yaml), Fly, Railway or any Docker host.

# ---- web: build the static Expo web bundle
FROM node:22-slim AS web
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Call the API on the same origin (relative /api/... paths). EXPO_NO_DOTENV keeps
# the committed frontend/.env (localhost:8010) out of the production bundle.
ENV EXPO_NO_DOTENV=1 \
    EXPO_PUBLIC_API_URL=/api \
    CI=1
RUN npx expo export --platform web --output-dir /build/dist

# ---- api: FastAPI serving the API + the built web app
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY deploy/server.py ./deploy/server.py
COPY --from=web /build/dist ./web
ENV BEATNOTE_DB=/data/beatnote.db
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn deploy.server:app --app-dir /app --host 0.0.0.0 --port ${PORT:-8000}"]

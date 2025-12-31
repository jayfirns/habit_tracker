#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER="john5"
REMOTE_HOST="trigkey"
PROJECT_PATH="~/Documents/git/habit_tracker"
DB_RELATIVE_PATH="backend/data/habit_tracker.db"

REMOTE_DB="${REMOTE_USER}@${REMOTE_HOST}:${PROJECT_PATH}/${DB_RELATIVE_PATH}"
LOCAL_DB="${PROJECT_PATH}/${DB_RELATIVE_PATH}"

echo "🛑 Stopping local Docker containers..."
docker compose down || true

echo "⬆️  Pushing database to ${REMOTE_HOST}..."
rsync -av --progress "${LOCAL_DB}" "${REMOTE_DB}"

echo "📦 Remote database updated."

echo "🚀 Starting local Docker containers..."
docker compose up -d

echo "✅ db_push complete."
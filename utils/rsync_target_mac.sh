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

echo "⬇️  Pulling database from ${REMOTE_HOST}..."
rsync -av --progress "${REMOTE_DB}" "${LOCAL_DB}"

echo "📦 Database pulled successfully:"
ls -lh "${LOCAL_DB}"

echo "🚀 Starting Docker containers..."
docker compose up -d

echo "✅ db_pull complete."
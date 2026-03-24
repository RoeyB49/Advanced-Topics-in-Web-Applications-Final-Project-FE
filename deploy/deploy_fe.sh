#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/animon-fe}"
BRANCH="${BRANCH:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/animon-fe}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Frontend directory does not exist: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "[FE] Updating source..."
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [[ ! -f .env.production ]]; then
  echo "[FE] .env.production not found. Creating from template..."
  cp deploy/.env.production.example .env.production
  echo "[FE] Please edit .env.production and re-run this script."
  exit 1
fi

echo "[FE] Installing dependencies..."
npm ci

echo "[FE] Building..."
npm run build

echo "[FE] Deploying static files to $WEB_ROOT/dist ..."
sudo mkdir -p "$WEB_ROOT/dist"
sudo rsync -av --delete dist/ "$WEB_ROOT/dist/"

echo "[FE] Deployment completed."

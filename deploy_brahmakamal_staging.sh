#!/bin/bash

set -e

APP_DIR="/home/hybridadmin/Brahmakamal_python"
BRANCH="staging"
SERVICE="brahmakamal.service"
VENV="$APP_DIR/venv"
URL="https://staging-bhk.drishtee.in/auth/login"

echo "=========================================="
echo " Brahmakamal Staging Deployment"
echo "=========================================="

cd "$APP_DIR"

echo ""
echo "[1/9] Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "ERROR: Current branch is '$CURRENT_BRANCH'."
    echo "Expected branch: '$BRANCH'"
    exit 1
fi

echo "OK: On $BRANCH branch."

echo ""
echo "[2/9] Checking for local changes..."

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: Local uncommitted changes detected."
    echo ""
    git status --short
    echo ""
    echo "Deployment stopped to protect local changes."
    exit 1
fi

echo "OK: Working tree is clean."

echo ""
echo "[3/9] Fetching latest staging code..."

git fetch origin "$BRANCH"

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")

echo "Current commit : $LOCAL_COMMIT"
echo "Remote commit  : $REMOTE_COMMIT"

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "Already up to date."
else
    echo ""
    echo "Updating staging branch..."
    git pull --ff-only origin "$BRANCH"
fi

DEPLOYED_COMMIT=$(git rev-parse HEAD)

echo ""
echo "Deployed commit: $DEPLOYED_COMMIT"

echo ""
echo "[4/9] Checking Python environment..."

if [ ! -x "$VENV/bin/python" ]; then
    echo "ERROR: Python virtual environment not found:"
    echo "$VENV"
    exit 1
fi

PYTHON_VERSION=$("$VENV/bin/python" --version)
echo "Python: $PYTHON_VERSION"

echo ""
echo "[5/9] Installing Python dependencies..."

if [ -f "$APP_DIR/requirements.txt" ]; then
    sudo -u hybridadmin "$VENV/bin/pip" install -r "$APP_DIR/requirements.txt"
else
    echo "WARNING: requirements.txt not found."
    echo "Skipping dependency installation."
fi

echo ""
echo "[6/9] Testing application import..."

sudo -u hybridadmin "$VENV/bin/python" -c \
    "from app.main import app; print('APP_IMPORT_OK')"

echo ""
echo "[7/9] Restarting service..."

systemctl restart "$SERVICE"

sleep 5

if ! systemctl is-active --quiet "$SERVICE"; then
    echo ""
    echo "ERROR: Service failed to start."
    echo ""
    systemctl status "$SERVICE" --no-pager
    echo ""
    echo "Recent logs:"
    journalctl -u "$SERVICE" -n 50 --no-pager
    exit 1
fi

echo "OK: $SERVICE is running."

echo ""
echo "[8/9] Checking application endpoint..."

HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" "$URL")

echo "HTTP status: $HTTP_STATUS"

if [ "$HTTP_STATUS" != "200" ]; then
    echo ""
    echo "ERROR: Application health check failed."
    echo "Expected HTTP 200 from:"
    echo "$URL"
    echo ""
    echo "Recent service logs:"
    journalctl -u "$SERVICE" -n 50 --no-pager
    exit 1
fi

echo ""
echo "[9/9] Deployment verification..."

systemctl --no-pager --full status "$SERVICE" | head -20

echo ""
echo "=========================================="
echo " DEPLOYMENT SUCCESSFUL"
echo "=========================================="
echo ""
echo "Branch : $BRANCH"
echo "Commit : $DEPLOYED_COMMIT"
echo "URL    : $URL"
echo ""

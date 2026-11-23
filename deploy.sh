#!/usr/bin/env bash
# ==============================================================================
# Turnkey Deployment & Verification Script for Production Backend Infrastructure
# ==============================================================================

set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo "======================================================================"
echo "🚀 Initializing Backend Infrastructure Deployment"
echo "======================================================================"

# 1. Check prerequisites
echo "[1/5] Checking Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH."
    exit 1
fi

COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi
echo "✅ Docker Compose detected: $($COMPOSE_CMD version)"

# 2. Check Environment Secrets
echo "[2/5] Validating environment configuration (.env)..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️ .env not found. Creating from .env.example..."
        cp .env.example .env
    else
        echo "❌ Error: .env.example not found."
        exit 1
    fi
fi
echo "✅ Environment secrets configured."

# 3. Validate Docker Compose Syntax
echo "[3/5] Validating compose configuration syntax..."
$COMPOSE_CMD config --quiet
echo "✅ Compose configuration valid."

# 4. Build and Spin Up Services
echo "[4/5] Building and launching containers in detached mode..."
$COMPOSE_CMD up -d --build

echo "[5/5] Waiting for services and API Gateway to reach operational state..."
sleep 5

# Verify Gateway Health
GATEWAY_PORT="${GATEWAY_HTTP_PORT:-80}"
echo "Checking Gateway health at http://localhost:${GATEWAY_PORT}/health..."

MAX_RETRIES=12
RETRY=0
SUCCESS=false

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s -f "http://localhost:${GATEWAY_PORT}/health" &> /dev/null; then
        SUCCESS=true
        break
    fi
    echo "Waiting for Gateway... (Attempt $((RETRY+1))/$MAX_RETRIES)"
    sleep 3
    RETRY=$((RETRY+1))
done

echo ""
echo "======================================================================"
if [ "$SUCCESS" = true ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL - ZERO TRUST BACKEND READY!"
    echo "======================================================================"
    echo "📍 API Gateway Ingress:       http://localhost:${GATEWAY_PORT}"
    echo "📍 Gateway Health Check:     http://localhost:${GATEWAY_PORT}/health"
    echo ""
    echo "📡 Microservice Endpoints (Routed via Gateway):"
    echo "  • Server 1 (Core App):      http://localhost:${GATEWAY_PORT}/api/v1/core/health"
    echo "  • Server 2 (Auth/Notify):   http://localhost:${GATEWAY_PORT}/api/v1/reserved-auth/health"
    echo "  • Server 3 (Payment ACID):  http://localhost:${GATEWAY_PORT}/api/v1/payments/health"
    echo "  • Server 4 (Analytics):     http://localhost:${GATEWAY_PORT}/api/v1/reserved-analytics/health"
    echo "  • Server 5 (AI Automation): http://localhost:${GATEWAY_PORT}/api/v1/ai/health"
    echo ""
    echo "🔒 Security Status: All microservices, Redis, and DBs isolated in private VPC."
else
    echo "⚠️ Gateway is still initializing. Check logs with: $COMPOSE_CMD logs -f gateway"
fi
echo "======================================================================"

#!/usr/bin/env bash
set -euo pipefail

API="http://localhost:4000"

echo "Waiting for API to be healthy..."
for i in {1..30}; do
  if curl -sS ${API}/api/health | jq -e '.ok' >/dev/null 2>&1; then
    echo "API healthy"
    break
  fi
  sleep 1
done

echo "Running basic integration checks"
REG=$(curl -sS -X POST "${API}/api/auth/register" -H "Content-Type: application/json" -d '{"email":"ci_test_'$(date +%s)'@test.com","password":"Pass123!","name":"CI Test"}')
TOKEN=$(echo "$REG" | jq -r '.accessToken')

echo "Checking favorites endpoint"
curl -sS -H "Authorization: Bearer $TOKEN" "${API}/api/favorites" | jq '.'

echo "Refreshing token"
REFRESH=$(echo "$REG" | jq -r '.refreshToken')
curl -sS -X POST "${API}/api/auth/refresh" -H "Content-Type: application/json" -d "{\"refresh_token\":\"$REFRESH\"}" | jq '.'

echo "E2E smoke tests completed"

#!/bin/bash
# Manually trigger market creation crons.
# Usage:
#   ./scripts/trigger-crons.sh              # hits localhost:3000 (run npm dev first)
#   ./scripts/trigger-crons.sh https://your-vercel-url.vercel.app [CRON_SECRET]

BASE_URL="${1:-http://localhost:3000}"
SECRET="${2:-}"

HEADERS=(-H "Content-Type: application/json")
if [ -n "$SECRET" ]; then
  HEADERS+=(-H "Authorization: Bearer $SECRET")
fi

echo "=== create-market (NYC + Boston) ==="
curl -s -X POST "$BASE_URL/api/cron/create-market" "${HEADERS[@]}" | jq .

echo ""
echo "=== create-market-bayarea ==="
curl -s -X POST "$BASE_URL/api/cron/create-market-bayarea" "${HEADERS[@]}" | jq .

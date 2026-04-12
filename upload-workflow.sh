#!/bin/bash
# Upload the modified n8n workflow
# Run this from the project root: bash upload-workflow.sh

N8N_URL="https://n8n.srv879329.hstgr.cloud"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZmNkOTI4My01MjJlLTQyYTYtODljMy1mYWUxY2ViMDhiYTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTgyNjQ2fQ.yZuKTBe5cWmhdSaCbnSt7ds6M_qCUm45XEYm9wA7YLA"
WORKFLOW_ID="p3NkctMZZPZVdH68"

echo "Uploading modified workflow to n8n..."
echo "URL: ${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @workflow-updated.json \
  "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "SUCCESS! Workflow updated."
  echo "Open ${N8N_URL}/workflow/${WORKFLOW_ID} to verify."
  echo ""
  echo "Changes applied:"
  echo "  - Added: Fetch tenant config (Supabase lookup by page_id)"
  echo "  - Added: Config found? guard node"
  echo "  - Removed: Check Human Request (хүнтэй keyword)"
  echo "  - Updated: All tokens, prompts, RAG IDs, emails → dynamic"
  echo ""
  echo "Next: Open the workflow in n8n and check the node wiring looks correct."
else
  echo ""
  echo "FAILED with HTTP ${HTTP_CODE}"
  echo "Response: ${BODY}"
  echo ""
  echo "If you get 401/403, your API key may have expired."
  echo "If you get 400, try importing workflow-updated.json manually:"
  echo "  1. Open n8n → your workflow"
  echo "  2. Click ... menu → Import from File"
  echo "  3. Select workflow-updated.json"
fi

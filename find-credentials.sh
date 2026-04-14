#!/bin/bash
# Extract credential IDs from n8n execution data and try creating credentials by name

N8N_URL="https://n8n.srv879329.hstgr.cloud"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZmNkOTI4My01MjJlLTQyYTYtODljMy1mYWUxY2ViMDhiYTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTgyNjQ2fQ.yZuKTBe5cWmhdSaCbnSt7ds6M_qCUm45XEYm9wA7YLA"
WORKFLOW_ID="p3NkctMZZPZVdH68"

echo "========================================"
echo "  Deep credential search"
echo "========================================"

# Step 1: Get the full execution data
echo ""
echo "Step 1: Fetching execution details..."
EXEC_LIST=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=5")

# Extract execution IDs
EXEC_IDS=$(echo "$EXEC_LIST" | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data.get('data', [])
for item in items:
    print(item.get('id', ''))
" 2>/dev/null)

echo "Found execution IDs: $EXEC_IDS"

# For each execution, fetch full details and look for credentials
for EXEC_ID in $EXEC_IDS; do
    echo ""
    echo "Checking execution $EXEC_ID..."
    EXEC_DATA=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/executions/${EXEC_ID}")
    echo "$EXEC_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)

# Check workflowData nodes for credentials
wf = data.get('workflowData', {})
nodes = wf.get('nodes', [])
found = False
for n in nodes:
    creds = n.get('credentials', {})
    if creds:
        found = True
        print(f'  Node: {n.get(\"name\")} -> {json.dumps(creds)}')

if not found:
    print('  No credential references in this execution')

# Also dump the full JSON keys to see structure
print(f'  Top-level keys: {list(data.keys())}')
" 2>/dev/null
done

# Step 2: Try to find credentials by creating a dummy and checking error
echo ""
echo "Step 2: Trying to get credentials via different API patterns..."

# Try the /rest/ internal API with session cookie approach
echo "  Trying /api/v1/credentials?limit=100..."
RESP=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/credentials?limit=100")
echo "  Response: $(echo "$RESP" | head -c 200)"

# Try UUID-format IDs (common patterns)
echo ""
echo "Step 3: Trying to probe with common UUID prefixes..."
# Try getting credential types that exist
for CRED_TYPE in supabaseApi postgres gmailOAuth2 googleGeminiApi openAiApi; do
    RESP=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
        "${N8N_URL}/api/v1/credentials/schema/${CRED_TYPE}")
    HAS_PROPS=$(echo "$RESP" | python3 -c "
import json, sys
d = json.load(sys.stdin)
props = list(d.get('properties', {}).keys())
print(f'{props}')
" 2>/dev/null)
    echo "  ${CRED_TYPE}: schema properties = ${HAS_PROPS}"
done

# Step 4: Try to use the workflow PUT with credential names only (no IDs)
echo ""
echo "Step 4: Testing if n8n accepts credentials by name without ID..."
echo "  Fetching current workflow..."
curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" > /tmp/n8n_wf.json

python3 << 'PYEOF'
import json

with open('/tmp/n8n_wf.json') as f:
    wf = json.load(f)

# Known credential names from user
CRED_NAMES = {
    'supabaseApi': 'Supabase SaaS',
    'postgres': 'Postgres 2',
    'gmailOAuth2': 'Gmail account 2',
    'googleGeminiApi': 'Google AIstudio dorjoo0077',
    'openAiApi': 'OpenAi account',
}

NODE_CRED_MAP = {
    'n8n-nodes-base.supabase': 'supabaseApi',
    'n8n-nodes-base.postgres': 'postgres',
    'n8n-nodes-base.gmail': 'gmailOAuth2',
    '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': 'googleGeminiApi',
    '@n8n/n8n-nodes-langchain.openAi': 'openAiApi',
    '@n8n/n8n-nodes-langchain.memoryPostgresChat': 'postgres',
    '@n8n/n8n-nodes-langchain.lmChatOpenAi': 'openAiApi',
}

nodes = wf.get('nodes', [])
patched = 0
for node in nodes:
    ntype = node.get('type', '')
    nname = node.get('name', '')
    if ntype in NODE_CRED_MAP:
        cred_type = NODE_CRED_MAP[ntype]
        cred_name = CRED_NAMES.get(cred_type, '')
        if cred_name:
            # Try with just name, no ID
            node['credentials'] = {
                cred_type: {
                    'name': cred_name
                }
            }
            patched += 1
            print(f'  Patched: {nname} -> {cred_name} ({cred_type})')

print(f'\nPatched {patched} nodes (name-only, no IDs)')

# Remove read-only fields
for field in ['tags', 'id', 'createdAt', 'updatedAt', 'versionId', 'active', 'meta',
              'parentFolderId', 'triggerCount', 'isArchived', 'homeProject', 'sharedWithProjects']:
    wf.pop(field, None)

allowed_settings = {'executionOrder', 'timezone', 'errorWorkflow', 'callerPolicy',
                    'saveManualExecutions', 'saveExecutionProgress'}
if 'settings' in wf:
    wf['settings'] = {k: v for k, v in wf['settings'].items() if k in allowed_settings}

with open('/tmp/n8n_wf_patched.json', 'w') as f:
    json.dump(wf, f)

print('Saved to /tmp/n8n_wf_patched.json')
PYEOF

echo ""
echo "  Uploading workflow with name-only credentials..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @/tmp/n8n_wf_patched.json \
  "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "======================================"
    echo "  SUCCESS! Workflow updated with credentials."
    echo "======================================"
    echo "  Open ${N8N_URL}/workflow/${WORKFLOW_ID} to verify."

    # Check if credentials stuck
    echo ""
    echo "  Verifying credentials stuck..."
    curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" | python3 -c "
import json, sys
wf = json.load(sys.stdin)
nodes = wf.get('nodes', [])
with_creds = 0
without_creds = 0
for n in nodes:
    creds = n.get('credentials', {})
    ntype = n.get('type', '')
    if ntype in ['n8n-nodes-base.supabase','n8n-nodes-base.postgres','n8n-nodes-base.gmail',
                 '@n8n/n8n-nodes-langchain.lmChatGoogleGemini','@n8n/n8n-nodes-langchain.openAi',
                 '@n8n/n8n-nodes-langchain.memoryPostgresChat','@n8n/n8n-nodes-langchain.lmChatOpenAi']:
        if creds:
            with_creds += 1
            # Check if ID was assigned
            for ct, cv in creds.items():
                has_id = 'id' in cv
                print(f'  {n.get(\"name\")}: id={cv.get(\"id\",\"NONE\")} name={cv.get(\"name\",\"NONE\")}')
        else:
            without_creds += 1
            print(f'  MISSING: {n.get(\"name\")}')
print(f'\nWith credentials: {with_creds}, Missing: {without_creds}')
"
else
    echo ""
    echo "  FAILED with HTTP ${HTTP_CODE}"
    echo "  Response: $(echo "$BODY" | head -c 500)"
fi

echo ""
echo "Done. Paste the full output back to Claude."

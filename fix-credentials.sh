#!/bin/bash
# Fix n8n workflow credentials - minimal payload approach

N8N_URL="https://n8n.srv879329.hstgr.cloud"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZmNkOTI4My01MjJlLTQyYTYtODljMy1mYWUxY2ViMDhiYTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTgyNjQ2fQ.yZuKTBe5cWmhdSaCbnSt7ds6M_qCUm45XEYm9wA7YLA"
WORKFLOW_ID="p3NkctMZZPZVdH68"

echo "======================================"
echo "  n8n Credential Fix - Minimal"
echo "======================================"

echo ""
echo "Step 1: Fetching current workflow..."
curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" > /tmp/n8n_wf.json

echo "Step 2: Patching credentials and building minimal payload..."
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
            node['credentials'] = {
                cred_type: {
                    'name': cred_name
                }
            }
            patched += 1
            print(f'  Patched: {nname} -> {cred_name}')

print(f'  Total: {patched} nodes')

# Try multiple payload combinations - save each one
combos = [
    ('combo1', ['name', 'nodes', 'connections', 'settings']),
    ('combo2', ['name', 'nodes', 'connections']),
    ('combo3', ['nodes', 'connections', 'settings']),
    ('combo4', ['nodes']),
]

for label, fields in combos:
    payload = {k: wf[k] for k in fields if k in wf}
    if 'settings' in payload:
        allowed_settings = {'executionOrder', 'timezone', 'errorWorkflow', 'callerPolicy',
                            'saveManualExecutions', 'saveExecutionProgress'}
        payload['settings'] = {k: v for k, v in payload['settings'].items() if k in allowed_settings}
    with open(f'/tmp/n8n_{label}.json', 'w') as f:
        json.dump(payload, f)
    print(f'  Saved {label}: keys={list(payload.keys())}')
PYEOF

echo ""
echo "Step 3: Trying different payload combinations..."

for COMBO in combo1 combo2 combo3 combo4; do
    echo ""
    echo "  Trying ${COMBO}..."
    KEYS=$(python3 -c "import json; print(list(json.load(open(f'/tmp/n8n_${COMBO}.json')).keys()))" 2>/dev/null)
    echo "    Keys: ${KEYS}"

    RESPONSE=$(curl -s -w "\n%{http_code}" \
      -X PUT \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d @/tmp/n8n_${COMBO}.json \
      "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "    SUCCESS with ${COMBO}!"
        echo ""
        echo "======================================"
        echo "  CREDENTIALS FIXED!"
        echo "======================================"
        echo "  Open ${N8N_URL}/workflow/${WORKFLOW_ID} to verify."

        # Verify
        echo ""
        echo "  Verifying..."
        curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" | python3 -c "
import json, sys
wf = json.load(sys.stdin)
NEEDS = ['n8n-nodes-base.supabase','n8n-nodes-base.postgres','n8n-nodes-base.gmail',
         '@n8n/n8n-nodes-langchain.lmChatGoogleGemini','@n8n/n8n-nodes-langchain.openAi',
         '@n8n/n8n-nodes-langchain.memoryPostgresChat','@n8n/n8n-nodes-langchain.lmChatOpenAi']
ok = bad = 0
for n in wf.get('nodes', []):
    if n.get('type','') in NEEDS:
        if n.get('credentials'):
            ok += 1
        else:
            bad += 1
            print(f'  Still missing: {n[\"name\"]}')
print(f'  Result: {ok} OK, {bad} missing')
"
        exit 0
    else
        echo "    Failed (${HTTP_CODE}): $(echo "$BODY" | head -c 200)"
    fi
done

echo ""
echo "  All combinations failed. Let me check what n8n expects..."
echo ""
echo "  Trying PATCH method instead of PUT..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @/tmp/n8n_combo4.json \
  "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "    PATCH result: HTTP ${HTTP_CODE}"
echo "    $(echo "$BODY" | head -c 300)"

echo ""
echo "  Checking n8n API version/docs..."
RESP=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" | python3 -c "
import json, sys
wf = json.load(sys.stdin)
# Check node structure for any extra fields that might be in nodes
sample = wf['nodes'][0] if wf.get('nodes') else {}
print(f'Sample node keys: {sorted(sample.keys())}')
" 2>/dev/null)
echo "  $RESP"

echo ""
echo "Done. Paste output to Claude."

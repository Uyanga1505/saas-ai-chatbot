#!/bin/bash
# Update n8n workflow to write page_id in all database write operations
# page_id comes from the Facebook webhook recipient.id (the Facebook Page ID)

N8N_URL="https://n8n.srv879329.hstgr.cloud"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZmNkOTI4My01MjJlLTQyYTYtODljMy1mYWUxY2ViMDhiYTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTgyNjQ2fQ.yZuKTBe5cWmhdSaCbnSt7ds6M_qCUm45XEYm9wA7YLA"
WORKFLOW_ID="p3NkctMZZPZVdH68"

echo "======================================"
echo "  Add page_id to n8n write operations"
echo "======================================"

echo ""
echo "Step 1: Fetching current workflow..."
curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" > /tmp/n8n_wf_current.json

echo "Step 2: Patching write nodes to include page_id..."
python3 << 'PYEOF'
import json

with open('/tmp/n8n_wf_current.json') as f:
    wf = json.load(f)

nodes = wf.get('nodes', [])
patched = 0

# The page_id in the workflow comes from the Facebook webhook recipient.id
# which is extracted by the "set1" node or "Fetch tenant config" node
# In the dynamic workflow, recipient.id = the Facebook Page ID
# This is available as: {{ $('set1').item.json.body.entry[0].messaging[0].recipient.id }}
# Or from Fetch tenant config: {{ $('Fetch tenant config').item.json.messenger_page_id }}

PAGE_ID_EXPRESSION = "={{ $('Fetch tenant config').item.json.messenger_page_id }}"

for node in nodes:
    nname = node.get('name', '')
    ntype = node.get('type', '')
    params = node.get('parameters', {})

    # Handle Supabase nodes (Store user reply, Store Human Reply, etc.)
    if ntype == 'n8n-nodes-base.supabase':
        operation = params.get('operation', '')
        # For create operations, add page_id to the fields
        if operation == 'create' or 'Store' in nname or 'Retreive' not in nname:
            # Check if fieldsToSendJson or filterByField exists
            fields_json = params.get('fieldsToSendJson', '')
            if fields_json and isinstance(fields_json, str) and 'page_id' not in fields_json:
                # It's a JSON string - parse, add page_id, and re-serialize
                try:
                    # Handle n8n expression strings - they might contain {{ }} expressions
                    # We need to add page_id as a new field
                    if fields_json.strip().startswith('{'):
                        parsed = json.loads(fields_json)
                        parsed['page_id'] = PAGE_ID_EXPRESSION
                        params['fieldsToSendJson'] = json.dumps(parsed)
                        patched += 1
                        print(f"  Patched JSON fields: {nname}")
                    elif fields_json.strip().startswith('='):
                        # It's an expression, harder to modify
                        print(f"  SKIP (expression): {nname} - fields: {fields_json[:80]}")
                except json.JSONDecodeError:
                    print(f"  SKIP (parse error): {nname} - fields: {fields_json[:80]}")

            # Check columnsToMatchOn style (UI mode fields)
            if 'columns' in params or 'fieldsToSend' in params:
                fields_to_send = params.get('fieldsToSend', {})
                if isinstance(fields_to_send, dict):
                    mappings = fields_to_send.get('mappings', [])
                    # Check if page_id already mapped
                    has_page_id = any(m.get('fieldName') == 'page_id' for m in mappings if isinstance(m, dict))
                    if not has_page_id and mappings:
                        mappings.append({
                            'fieldName': 'page_id',
                            'fieldValue': PAGE_ID_EXPRESSION,
                            'fieldType': 'stringValue'
                        })
                        patched += 1
                        print(f"  Patched UI mappings: {nname}")

    # Handle Postgres nodes (Insert rows in a table1)
    elif ntype == 'n8n-nodes-base.postgres':
        operation = params.get('operation', '')
        if operation == 'insert' or 'Insert' in nname:
            # Postgres nodes use columns.mappings format
            columns = params.get('columns', {})
            if isinstance(columns, dict):
                mappings = columns.get('mappings', [])
                has_page_id = any(m.get('column') == 'page_id' for m in mappings if isinstance(m, dict))
                if not has_page_id and mappings:
                    mappings.append({
                        'column': 'page_id',
                        'value': PAGE_ID_EXPRESSION
                    })
                    patched += 1
                    print(f"  Patched Postgres: {nname}")

            # Also check values format
            values = params.get('values', {})
            if isinstance(values, dict) and 'values' in values:
                val_list = values['values']
                has_page_id = any(v.get('column') == 'page_id' for v in val_list if isinstance(v, dict))
                if not has_page_id and val_list:
                    val_list.append({
                        'column': 'page_id',
                        'value': PAGE_ID_EXPRESSION
                    })
                    patched += 1
                    print(f"  Patched Postgres values: {nname}")

print(f"\nTotal patched: {patched} nodes")

# Also log all write nodes for manual verification
print("\n--- All write nodes ---")
for node in nodes:
    nname = node.get('name', '')
    ntype = node.get('type', '')
    params = node.get('parameters', {})
    op = params.get('operation', '')
    table = params.get('tableId', params.get('table', params.get('schema.tableName', '')))
    if op in ('create', 'insert', 'update', 'upsert') or 'Store' in nname or 'Insert' in nname:
        has_pid = 'page_id' in json.dumps(params)
        print(f"  {nname} ({ntype}) op={op} table={table} has_page_id={has_pid}")

# Build clean payload for upload
ALLOWED_FIELDS = {'name', 'nodes', 'connections', 'settings'}
clean_wf = {k: wf[k] for k in ALLOWED_FIELDS if k in wf}

ALLOWED_SETTINGS = {'executionOrder', 'timezone', 'errorWorkflow', 'callerPolicy',
                    'saveManualExecutions', 'saveExecutionProgress'}
if 'settings' in clean_wf:
    clean_wf['settings'] = {k: v for k, v in clean_wf['settings'].items() if k in ALLOWED_SETTINGS}

with open('/tmp/n8n_wf_pageid.json', 'w') as f:
    json.dump(clean_wf, f)

print("\nSaved patched workflow to /tmp/n8n_wf_pageid.json")
PYEOF

echo ""
echo "Step 3: Uploading patched workflow..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @/tmp/n8n_wf_pageid.json \
  "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "======================================"
    echo "  SUCCESS! page_id added to writes."
    echo "======================================"
    echo "  Open ${N8N_URL}/workflow/${WORKFLOW_ID} to verify."
else
    echo ""
    echo "  FAILED with HTTP ${HTTP_CODE}"
    echo "  Response: $(echo "$BODY" | head -c 500)"
fi

echo ""
echo "Done. Paste output to Claude."

# n8n Workflow: Multi-Tenant Dynamic Configuration Spec

This document contains the exact changes needed to make your n8n workflow (`p3NkctMZZPZVdH68`) dynamic — pulling all config from Supabase's `chatbots` table instead of using hardcoded values.

---

## Architecture Overview

When a Facebook message arrives, n8n will:
1. Extract the `recipient.id` (your customer's Facebook page ID)
2. Query Supabase: `SELECT * FROM chatbots WHERE messenger_page_id = <recipient.id>`
3. Use the returned config (token, prompt, model, RAG store) for all subsequent nodes

---

## STEP 1: Add "Fetch tenant config" node

**Type:** HTTP Request
**Position:** Insert between `set1` and `Retreive last pending`
**Name:** `Fetch tenant config`

### Configuration:

```
Method: GET

URL: https://ezcffhprxwitdnodukzv.supabase.co/rest/v1/chatbots

Query Parameters:
  messenger_page_id  =  eq.{{ $('set1').item.json.body.entry[0].messaging[0].recipient.id }}
  select             =  system_prompt,ai_model,model_tier,rag_store_id,messenger_access_token,handoff_email,notify_emails,enable_human_handoff,messenger_page_id
  limit              =  1

Headers:
  apikey         :  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y2ZmaHByeHdpdGRub2R1a3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDkzOTIsImV4cCI6MjA3MTA4NTM5Mn0.Q_XW2cweszc476CxJ1-c8xV_GHeco0Xnhaf1szMFbj0
  Authorization  :  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y2ZmaHByeHdpdGRub2R1a3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDkzOTIsImV4cCI6MjA3MTA4NTM5Mn0.Q_XW2cweszc476CxJ1-c8xV_GHeco0Xnhaf1szMFbj0
  Accept         :  application/vnd.pgrst.object+json

Options:
  Response Format: JSON
  Full Response: false
```

> **Why `Accept: application/vnd.pgrst.object+json`?**
> This makes Supabase return a single object `{...}` instead of an array `[{...}]`.
> So you can reference fields as `$json.system_prompt` instead of `$json[0].system_prompt`.

### Wiring:
```
set1 → Fetch tenant config → Retreive last pending
```
(Disconnect set1 from Check Human Request, connect to Fetch tenant config instead)

---

## STEP 2: Add "Config found?" guard node

**Type:** IF
**Position:** Between `Fetch tenant config` and `Retreive last pending`

### Configuration:
```
Condition: {{ $json.messenger_access_token }}  is not empty
True  → Retreive last pending  (continue normal flow)
False → No Operation, do nothing  (silent drop — unknown page)
```

### Updated wiring:
```
set1 → Fetch tenant config → Config found? → Retreive last pending
```

---

## STEP 3: Remove "Check Human Request" node

**DELETE** this node entirely. It checks for the keyword "хүнтэй" which is no longer needed.

The flow was: `set1 → Check Human Request → Retreive last pending`
Now becomes: `set1 → Fetch tenant config → Config found? → Retreive last pending`

---

## STEP 4: Fix "Echo_true" node

Currently condition #2 checks:
```
sender.id == "113756287895355"   ← hardcoded page ID
```

**Replace with:**
```
{{ $json.body.entry[0].messaging[0].sender.id }}
  equals
{{ $json.body.entry[0].messaging[0].recipient.id }}
```

This works because an echo message's sender IS the page itself, so sender.id == recipient.id.

---

## STEP 5: Update "typing ...2" node

Find the `access_token` parameter.

**Before:**
```
EABJXZA6AgwAMBRFWPn7KZAB6ELNBkghv5aJZBPIS...
```

**After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 6: Update "AI Agent1" system prompt

Open AI Agent1 → System Message field.

**Before:** The entire ~200 line hardcoded Webhiine prompt

**After:**
```
{{ $('Fetch tenant config').item.json.system_prompt }}
```

That's it. The entire prompt now comes from Supabase.

---

## STEP 7: Update "AI Agent" system prompt (website chat trigger)

Same change for the website chat AI Agent:

**Before:** Hardcoded Webhiine prompt

**After:**
```
{{ $('Fetch tenant config').item.json.system_prompt }}
```

> Note: The website chat trigger (`When chat message received`) may not have the `Fetch tenant config` in its flow path. If the website chat is only for testing, you can leave this as-is for now, or add a separate config fetch for the website flow.

---

## STEP 8: Update "Pinecone1" RAG store ID

Open the Pinecone1 HTTP Request Tool node. Find the JSON body.

**Before:**
```json
"file_search_store_names": ["fileSearchStores/frag-03t0jn6obrh9"]
```

**After:**
```json
"file_search_store_names": ["{{ $('Fetch tenant config').item.json.rag_store_id }}"]
```

---

## STEP 9: Update "Pinecone" RAG store ID (website chat)

Same change for the Pinecone node attached to the website AI Agent:

**Before:**
```json
"file_search_store_names": ["fileSearchStores/frag-kgxnv65y0abu"]
```

**After:**
```json
"file_search_store_names": ["{{ $('Fetch tenant config').item.json.rag_store_id }}"]
```

---

## STEP 10: Update "Sent back to messenger"

The URL contains a hardcoded access token.

**Before:**
```
https://graph.facebook.com/v23.0/.../messages?access_token=EABJXZA6AgwAMBRFWPn7...
```

**After:**
```
https://graph.facebook.com/v23.0/{{ $('set1').item.json.body.entry[0].messaging[0].recipient.id }}/messages?access_token={{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 11: Update "Sent text only"

Find the `access_token` query parameter.

**Before:**
```
EABJXZA6AgwAMBRFWPn7...
```

**After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 12: Update "Sent image only"

Same token replacement:

**Before:**
```
EABJXZA6AgwAMBRFWPn7...
```

**After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 13: Update "Messenger user ID find1"

**URL — Before:**
```
https://graph.facebook.com/v21.0/113756287895355/conversations
```

**URL — After:**
```
https://graph.facebook.com/v21.0/{{ $('set1').item.json.body.entry[0].messaging[0].recipient.id }}/conversations
```

**access_token — Before:**
```
EABJXZA6AgwAMBQ1ViBNVgvCjSPK1SpI...
```

**access_token — After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 14: Update "Messenger user name find1"

**access_token — Before:**
```
EABJXZA6AgwAMBQ1ViBNVgvCjSPK1SpI...
```

**access_token — After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 15: Update "Messenger user ID find2"

Same as step 13:

**URL — After:**
```
https://graph.facebook.com/v21.0/{{ $('set1').item.json.body.entry[0].messaging[0].recipient.id }}/conversations
```

**access_token — After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 16: Update "Messenger user name find2"

**access_token — After:**
```
{{ $('Fetch tenant config').item.json.messenger_access_token }}
```

---

## STEP 17: Update "Notify Team via Email1"

**To field — Before:**
```
bayanbat007@gmail.com
```

**To field — After:**
```
{{ $('Fetch tenant config').item.json.notify_emails.join(', ') }}
```

If n8n doesn't support `.join()` on arrays, use:
```
{{ $('Fetch tenant config').item.json.handoff_email }}
```

---

## STEP 18: Update "Notify Team via Email2"

Same change as Step 17.

---

## Summary: All Changes at a Glance

| # | Node | Change |
|---|------|--------|
| 1 | **Fetch tenant config** | ➕ NEW — Supabase HTTP GET by page_id |
| 2 | **Config found?** | ➕ NEW — IF guard after fetch |
| 3 | **Check Human Request** | ❌ DELETE — no longer needed |
| 4 | **Echo_true** | ✏️ sender.id == recipient.id (not hardcoded page ID) |
| 5 | **typing ...2** | ✏️ token → dynamic |
| 6 | **AI Agent1** | ✏️ system prompt → dynamic |
| 7 | **AI Agent** | ✏️ system prompt → dynamic (if applicable) |
| 8 | **Pinecone1** | ✏️ RAG store ID → dynamic |
| 9 | **Pinecone** | ✏️ RAG store ID → dynamic (if applicable) |
| 10 | **Sent back to messenger** | ✏️ token → dynamic |
| 11 | **Sent text only** | ✏️ token → dynamic |
| 12 | **Sent image only** | ✏️ token → dynamic |
| 13 | **Messenger user ID find1** | ✏️ page ID + token → dynamic |
| 14 | **Messenger user name find1** | ✏️ token → dynamic |
| 15 | **Messenger user ID find2** | ✏️ page ID + token → dynamic |
| 16 | **Messenger user name find2** | ✏️ token → dynamic |
| 17 | **Notify Team via Email1** | ✏️ email → dynamic |
| 18 | **Notify Team via Email2** | ✏️ email → dynamic |

---

## How It Works End-to-End

1. **User signs up** on your website → creates a chatbot in the admin portal
2. **Website writes** to Supabase `chatbots` table: page_id, token, prompt, model, RAG store ID
3. **Facebook message arrives** → n8n webhook fires
4. **n8n queries Supabase** → `SELECT * FROM chatbots WHERE messenger_page_id = <recipient.id>`
5. **n8n uses the config** → injects prompt, uses correct token, routes to correct AI model
6. **AI generates reply** → n8n sends it back via the customer's access token

No code changes needed when a new customer signs up — they just fill in the form on your website and n8n picks them up automatically.

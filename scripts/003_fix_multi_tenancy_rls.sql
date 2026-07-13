-- ============================================================
-- Migration: Fix multi-tenancy RLS policies
-- Date: 2026-07-13
--
-- Problem: n8n_chat_histories and conversation_insights had
-- "Enable read access for all users" policies with qual=TRUE,
-- meaning any authenticated user could read ALL rows across
-- all tenants. This leaked messages, insights, contact info,
-- and conversation history between customers.
--
-- Fix: Remove the wide-open SELECT policies and ensure only
-- properly scoped tenant policies exist (page_id must belong
-- to a chatbot owned by the current user).
--
-- Note: The webhook pipeline uses createAdminClient() (service
-- role key) which bypasses RLS entirely, so ingestion is not
-- affected by these changes.
-- ============================================================

-- ─── n8n_chat_histories ─────────────────────────────────────

-- Remove the policy that lets anyone read all messages
DROP POLICY IF EXISTS "Enable read access for all users" ON public.n8n_chat_histories;

-- Add tenant-scoped SELECT: users can only see messages
-- belonging to pages connected to their chatbots
CREATE POLICY "Users see own chatbot messages"
  ON public.n8n_chat_histories
  FOR SELECT
  USING (
    page_id IN (
      SELECT messenger_page_id
      FROM public.chatbots
      WHERE user_id = auth.uid()
    )
  );

-- ─── conversation_insights ──────────────────────────────────

-- Remove the policy that lets anyone read all insights
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversation_insights;

-- Remove overly broad "Allow all" for authenticated role
-- (this gave full CRUD to any logged-in user with qual=TRUE)
DROP POLICY IF EXISTS "Allow all for service role" ON public.conversation_insights;

-- The correct policy "Users see own chatbot conversation_insights"
-- already exists and properly checks:
--   page_id IN (SELECT messenger_page_id FROM chatbots WHERE user_id = auth.uid())

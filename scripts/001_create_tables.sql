-- =============================================================================
-- SaaS AI Chatbot Database Schema
-- =============================================================================

-- 1. PROFILES TABLE
-- Stores user profile information linked to Supabase Auth
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- 2. CHATBOTS TABLE
-- Stores chatbot configurations for each user
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbots_select_own" ON public.chatbots 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chatbots_insert_own" ON public.chatbots 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chatbots_update_own" ON public.chatbots 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chatbots_delete_own" ON public.chatbots 
  FOR DELETE USING (auth.uid() = user_id);

-- 3. N8N_CHAT_HISTORIES TABLE
-- Stores chat histories/leads from n8n workflows
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  message JSONB,
  message_count INTEGER DEFAULT 0,
  qualified_lead BOOLEAN DEFAULT false,
  email_address TEXT,
  phone TEXT,
  summary TEXT,
  lead_quality_score NUMERIC,
  pain_points TEXT[],
  customer_intent TEXT,
  recommended_followup TEXT,
  sentiment TEXT,
  analyzed_at TIMESTAMPTZ,
  sender_id TEXT,
  conversation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own chat histories
CREATE POLICY "n8n_chat_histories_select_own" ON public.n8n_chat_histories 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "n8n_chat_histories_insert_own" ON public.n8n_chat_histories 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "n8n_chat_histories_update_own" ON public.n8n_chat_histories 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "n8n_chat_histories_delete_own" ON public.n8n_chat_histories 
  FOR DELETE USING (auth.uid() = user_id);

-- Also allow service role/anon to insert (for n8n webhooks)
CREATE POLICY "n8n_chat_histories_insert_anon" ON public.n8n_chat_histories 
  FOR INSERT WITH CHECK (true);

-- 4. CONVERSATION_INSIGHTS TABLE
-- Stores AI-generated insights from conversations
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_insights (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE SET NULL,
  sentiment TEXT,
  sentiment_score NUMERIC,
  topics TEXT[],
  key_phrases TEXT[],
  intent TEXT,
  customer_intent TEXT,
  engagement_score NUMERIC,
  response_quality NUMERIC,
  conversation_duration INTEGER,
  message_count INTEGER,
  ai_analysis JSONB,
  email_address TEXT,
  phone TEXT,
  phone_number TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_insights_select_own" ON public.conversation_insights 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conversation_insights_insert_own" ON public.conversation_insights 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conversation_insights_update_own" ON public.conversation_insights 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "conversation_insights_delete_own" ON public.conversation_insights 
  FOR DELETE USING (auth.uid() = user_id);

-- Also allow service role/anon to insert (for n8n webhooks)
CREATE POLICY "conversation_insights_insert_anon" ON public.conversation_insights 
  FOR INSERT WITH CHECK (true);

-- 5. INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON public.chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_user_id ON public.n8n_chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session_id ON public.n8n_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_chatbot_id ON public.n8n_chat_histories(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_insights_user_id ON public.conversation_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_insights_session_id ON public.conversation_insights(session_id);

-- 6. AUTO-CREATE PROFILE TRIGGER
-- Automatically creates a profile when a new user signs up
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. UPDATED_AT TRIGGER FUNCTION
-- Automatically updates the updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chatbots_updated_at ON public.chatbots;
CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON public.chatbots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_n8n_chat_histories_updated_at ON public.n8n_chat_histories;
CREATE TRIGGER update_n8n_chat_histories_updated_at
  BEFORE UPDATE ON public.n8n_chat_histories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_insights_updated_at ON public.conversation_insights;
CREATE TRIGGER update_conversation_insights_updated_at
  BEFORE UPDATE ON public.conversation_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chatbots table
CREATE TABLE IF NOT EXISTS public.chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  messenger_page_id TEXT,
  messenger_access_token TEXT,
  ai_model TEXT DEFAULT 'gpt-3.5-turbo',
  system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  messenger_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for chatbots
CREATE POLICY "chatbots_select_own" ON public.chatbots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chatbots_insert_own" ON public.chatbots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chatbots_update_own" ON public.chatbots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chatbots_delete_own" ON public.chatbots FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for conversations
CREATE POLICY "conversations_select_own" ON public.conversations FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.chatbots WHERE id = chatbot_id)
);
CREATE POLICY "conversations_insert_own" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.chatbots WHERE id = chatbot_id)
);

-- Create RLS policies for messages
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (
  auth.uid() IN (
    SELECT c.user_id FROM public.chatbots c
    JOIN public.conversations conv ON c.id = conv.chatbot_id
    WHERE conv.id = conversation_id
  )
);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT c.user_id FROM public.chatbots c
    JOIN public.conversations conv ON c.id = conv.chatbot_id
    WHERE conv.id = conversation_id
  )
);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', null)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

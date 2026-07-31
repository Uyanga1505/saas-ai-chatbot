-- ============================================================
-- Migration: Add rag_mode column to chatbots table
-- Date: 2026-07-15
--
-- Adds a rag_mode column that controls how the AI Agent
-- uses knowledge base files for each chatbot:
--   "inject" — Pre-fetch KB content and append to system prompt
--              on every message (best for small KBs)
--   "tool"   — AI Agent calls a search HTTP tool on demand
--              (better for large KBs, saves tokens)
--
-- Default is "inject" for backward compatibility.
-- ============================================================

ALTER TABLE public.chatbots
  ADD COLUMN IF NOT EXISTS rag_mode text NOT NULL DEFAULT 'inject'
  CHECK (rag_mode IN ('inject', 'tool'));

COMMENT ON COLUMN public.chatbots.rag_mode IS
  'Controls how the AI Agent uses KB files: inject = always in system prompt, tool = AI searches on demand';

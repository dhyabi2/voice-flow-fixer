-- Fix conversation_memory table constraints for proper upsert operations
ALTER TABLE public.conversation_memory 
ADD CONSTRAINT conversation_memory_unique_key 
UNIQUE (user_name, session_id, memory_type);

-- Add index for better performance on conversation logs
CREATE INDEX IF NOT EXISTS idx_conversation_logs_session_user 
ON public.conversation_logs (session_id, user_name, created_at DESC);

-- Add index for memory queries
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_accessed 
ON public.conversation_memory (user_name, last_accessed DESC);
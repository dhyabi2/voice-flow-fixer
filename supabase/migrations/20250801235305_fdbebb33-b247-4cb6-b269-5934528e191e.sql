-- Create conversation logs table for quality control and security
CREATE TABLE public.conversation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_gender TEXT CHECK (user_gender IN ('male', 'female')) NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_type TEXT CHECK (message_type IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  language TEXT CHECK (language IN ('en', 'ar')) NOT NULL,
  patient_context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for maximum security
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

-- Create policy that only allows insertion (no read/update/delete from frontend)
CREATE POLICY "Allow insert only for conversation logs" 
ON public.conversation_logs 
FOR INSERT 
WITH CHECK (true);

-- No read policies - only accessible through Supabase dashboard/SQL

-- Create conversation memory table for context retention
CREATE TABLE public.conversation_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  session_id UUID NOT NULL,
  memory_type TEXT CHECK (memory_type IN ('user_info', 'medical_history', 'preferences', 'context')) NOT NULL,
  content JSONB NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for memory table
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

-- Create policies for memory (read/write for authenticated sessions)
CREATE POLICY "Allow read access to conversation memory" 
ON public.conversation_memory 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert to conversation memory" 
ON public.conversation_memory 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update to conversation memory" 
ON public.conversation_memory 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_conversation_logs_user_session ON public.conversation_logs (user_name, session_id);
CREATE INDEX idx_conversation_logs_timestamp ON public.conversation_logs (timestamp DESC);
CREATE INDEX idx_conversation_memory_user ON public.conversation_memory (user_name);
CREATE INDEX idx_conversation_memory_session ON public.conversation_memory (session_id);
CREATE INDEX idx_conversation_memory_type ON public.conversation_memory (memory_type);

-- Create trigger for updating timestamps
CREATE TRIGGER update_conversation_memory_updated_at
BEFORE UPDATE ON public.conversation_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create API keys management table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for API keys management (admin only - no public access)
CREATE POLICY "Admin read access for api keys" 
ON public.api_keys 
FOR SELECT 
USING (false); -- Only accessible via service role

CREATE POLICY "Admin insert access for api keys" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (false); -- Only accessible via service role

CREATE POLICY "Admin update access for api keys" 
ON public.api_keys 
FOR UPDATE 
USING (false); -- Only accessible via service role

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default API keys (these will be the hardcoded defaults)
INSERT INTO public.api_keys (service_name, api_key, description) VALUES
('openrouter', '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', 'OpenRouter API for AI responses'),
('elevenlabs', 'demo-key-placeholder', 'ElevenLabs API for premium voice synthesis'),
('perplexity', 'demo-key-placeholder', 'Perplexity API for real-time information search')
ON CONFLICT (service_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  description = EXCLUDED.description,
  updated_at = now();
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, language, voiceType } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured')
    }

    // Enhanced prompt for more natural, human-like voice generation
    const voicePrompt = language === 'ar' 
      ? `قم بإعادة صياغة النص التالي بطريقة طبيعية وبصوت أنثوي دافئ ومهذب، مناسب للممرضة أميرة التي تقدم الرعاية الصحية. اجعل النبرة مطمئنة وحنونة:

"${text}"

قم بإرجاع النص المُحسن فقط بدون أي إضافات أو شروحات:`
      : `Rewrite the following text in a natural, warm, and caring feminine voice suitable for Nurse Amira providing healthcare guidance. Make the tone reassuring and gentle:

"${text}"

Return only the enhanced text without any additions or explanations:`

    // Use OpenRouter to enhance the text for more natural voice delivery
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://virtual-nurse-amira.com',
        'X-Title': 'Virtual Nurse Voice Enhancement'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-70b-instruct', // Using larger model for better voice text
        messages: [
          {
            role: 'system',
            content: language === 'ar' 
              ? 'أنت خبير في تحسين النصوص لتبدو طبيعية وإنسانية عند قراءتها بصوت أنثوي دافئ. اجعل النص يبدو وكأنه يأتي من ممرضة محترفة وعطوفة.'
              : 'You are an expert at enhancing text to sound natural and human when spoken with a warm female voice. Make the text sound like it comes from a professional and caring nurse.'
          },
          {
            role: 'user',
            content: voicePrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3, // Low temperature for consistency
        top_p: 0.9
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const enhancedText = data.choices?.[0]?.message?.content?.trim() || text

    // Return enhanced text for TTS
    return new Response(
      JSON.stringify({ 
        enhancedText,
        originalText: text,
        language,
        voiceType: 'human-enhanced'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Voice enhancement error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        enhancedText: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, headline, url } = await req.json();
    
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    console.log('GROQ_API_KEY exists:', !!groqApiKey);
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting analysis for:', headline);

    // Analyze with Groq
    const analysisPrompt = `
    Analyze the following news article for bias, sentiment, and factual accuracy. Return a JSON response with the following structure:

    {
      "bias_score": (number between -100 to 100, negative = left bias, positive = right bias, 0 = neutral),
      "bias_label": "left" | "center-left" | "center" | "center-right" | "right",
      "sentiment_score": (number between -1 to 1, -1 = very negative, 1 = very positive),
      "sentiment_label": "very negative" | "negative" | "neutral" | "positive" | "very positive",
      "fact_check_score": (number between 0 to 100, 0 = completely false, 100 = completely true),
      "credibility_score": (number between 1 to 10),
      "explanation": "Detailed AI explanation of the analysis",
      "key_findings": ["finding 1", "finding 2", "finding 3"],
      "methodology": "Brief explanation of analysis methodology",
      "limitations": "Analysis limitations and caveats",
      "confidence": (number between 0 to 100)
    }

    Article Headline: ${headline}
    Article Content: ${content || 'No content provided'}
    
    Provide only the JSON response, no other text.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert news analyst specializing in bias detection, sentiment analysis, and fact-checking. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const groqResult = await response.json();
    const analysisText = groqResult.choices[0].message.content;
    
    console.log('Raw Groq response:', analysisText);

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', parseError);
      throw new Error('Invalid JSON response from AI analysis');
    }

    // Store the article in database
    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert({
        headline,
        content,
        url,
        bias_score: analysis.bias_score,
        bias_label: analysis.bias_label,
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        fact_check_score: analysis.fact_check_score,
        credibility_score: analysis.credibility_score,
        fact_check_explanation: JSON.stringify({
          explanation: analysis.explanation,
          key_findings: analysis.key_findings,
          methodology: analysis.methodology,
          limitations: analysis.limitations,
          confidence: analysis.confidence
        }),
        ai_explanation: analysis.explanation,
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to store analysis results');
    }

    console.log('Analysis completed successfully for article:', article.id);

    return new Response(JSON.stringify({
      success: true,
      article_id: article.id,
      analysis: {
        bias_score: analysis.bias_score,
        bias_label: analysis.bias_label,
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        fact_check_score: analysis.fact_check_score,
        credibility_score: analysis.credibility_score,
        explanation: analysis.explanation,
        key_findings: analysis.key_findings,
        methodology: analysis.methodology,
        limitations: analysis.limitations,
        confidence: analysis.confidence
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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
    const { articleId, biasLabel, limit = 5 } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching related articles for bias:', biasLabel);

    // Fetch articles with similar bias, excluding the current article
    let query = supabase
      .from('articles')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (articleId) {
      query = query.neq('id', articleId);
    }

    if (biasLabel) {
      query = query.eq('bias_label', biasLabel);
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch related articles');
    }

    console.log(`Found ${articles?.length || 0} related articles`);

    return new Response(JSON.stringify({
      success: true,
      articles: articles || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-related-articles function:', error);
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

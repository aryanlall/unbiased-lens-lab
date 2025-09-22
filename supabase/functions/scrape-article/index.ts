import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || !isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    console.log('Scraping article from:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract content using regex patterns (basic web scraping)
    const extractedData = extractArticleData(html, url);

    console.log('Successfully extracted article data');

    return new Response(JSON.stringify({
      success: true,
      ...extractedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-article function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function extractArticleData(html: string, url: string) {
  // Extract title/headline
  let headline = '';
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    headline = titleMatch[1].trim();
  }

  // Try alternative headline extraction methods
  if (!headline) {
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) {
      headline = h1Match[1].trim();
    }
  }

  // Extract meta description and keywords for content
  let content = '';
  const descMatch = html.match(/<meta[^>]*name=["|']description["|'][^>]*content=["|']([^"']*)["|']/i);
  if (descMatch) {
    content = descMatch[1].trim();
  }

  // Extract source name from URL
  let sourceName = '';
  try {
    const urlObj = new URL(url);
    sourceName = urlObj.hostname.replace('www.', '');
  } catch (_) {
    sourceName = 'Unknown Source';
  }

  // Extract paragraphs for additional content
  const paragraphs: string[] = [];
  const pMatches = html.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
  for (const match of pMatches) {
    const text = match[1].trim();
    if (text.length > 50) { // Only include substantial paragraphs
      paragraphs.push(text);
    }
  }

  // Combine content
  if (paragraphs.length > 0) {
    content = content ? `${content}\n\n${paragraphs.slice(0, 3).join('\n\n')}` : paragraphs.slice(0, 3).join('\n\n');
  }

  return {
    headline: headline || 'No headline found',
    content: content || 'No content extracted',
    source_name: sourceName,
    url: url
  };
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for cache key
function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid food description" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for cache operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const queryHash = hashQuery(query);

    // Check cache first
    const { data: cached } = await supabase
      .from("recipe_cache")
      .select("recipes")
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      console.log("Cache hit for:", query);
      return new Response(JSON.stringify(cached.recipes), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache miss, calling AI for:", query);

    // Call Lovable AI for recipe suggestions
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert. Return ONLY valid JSON with no markdown, no code blocks.
When estimating calories and macros, reference USDA nutritional data. If uncertain about any value, use "unknown".
Format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "image": "https://images.unsplash.com/photo-XXXXX?w=400&auto=format&fit=crop",
      "calories": 420,
      "protein": "28g",
      "carbs": "45g", 
      "fat": "18g",
      "summary": "One line description"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Given the food input "${query}", return the top 3 healthy recipe suggestions. Each recipe needs:
- Name
- A valid Unsplash food image URL (use real Unsplash photo IDs like photo-1512621776951-a57141f2eefd, photo-1467003909585-2f8a72700288, photo-1490645935967-10de6ba17061, photo-1504674900247-0877df9cc836, photo-1540189549336-e6e99c3679fe)
- Estimated calories (number, based on USDA data)
- Protein in grams (with 'g' suffix)
- Carbs in grams (with 'g' suffix)
- Fat in grams (with 'g' suffix)
- A 1-line summary

Return ONLY the JSON object, no explanation.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires credits. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Strip markdown if present
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "").trim();
    }

    console.log("AI response:", content);

    const parsed = JSON.parse(content);

    // Validate response structure
    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error("Invalid response format from AI");
    }

    // Cache the result
    await supabase.from("recipe_cache").upsert({
      query_hash: queryHash,
      search_query: query.trim().toLowerCase(),
      recipes: parsed,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "query_hash" });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

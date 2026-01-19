import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
            text: "You are a nutrition analyzer. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanation. Format: {\"name\": \"string\", \"calories\": number, \"protein\": number, \"carbs\": number, \"fats\": number}"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food and return nutrition data. Return ONLY the JSON object with: name (string), calories (number), protein in grams (number), carbs in grams (number), fats in grams (number). No markdown, no code blocks, just the JSON."
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image}` }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```')) {
      // Remove opening ```json or ``` 
      content = content.replace(/^```(?:json)?\n/, '');
      // Remove closing ```
      content = content.replace(/\n```$/, '');
      content = content.trim();
    }
    
    console.log("Cleaned AI response:", content);
    
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
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
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a friendly nutrition assistant for LooKai, a food tracking app. Your role is to:
- Help users understand calories and macros in foods
- Provide quick, accurate nutritional information
- Give diet tips and healthy eating suggestions
- Answer questions about Indian, Nepali, and international foods
- Be encouraging about healthy choices

Keep responses concise (2-3 sentences max) and friendly. Use emojis sparingly.
If asked about specific calorie counts, provide estimates based on typical serving sizes.

Some common food reference (kcal per gram):
- Rice (cooked): 1.3 kcal/g
- Roti/Chapati: 2.6 kcal/g
- Dal (boiled): 1.2 kcal/g
- Momo (steamed): 1.8 kcal/g
- Chicken curry: 2.4 kcal/g
- Paneer: 2.65 kcal/g
- Banana: 0.89 kcal/g
- Apple: 0.52 kcal/g`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Chat failed";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

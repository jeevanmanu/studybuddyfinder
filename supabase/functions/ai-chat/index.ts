import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user using getUser() which validates server-side
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth verification failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

    const { messages } = await req.json();
    
    // Validate messages input
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are "StudyBuddy AI" - a smart, concise study assistant focused ONLY on academics and learning.

## Your Style:
- **Minimal & Clear**: Keep answers SHORT. No fluff, no unnecessary words.
- **Easy to Understand**: Use simple language. Explain like teaching a friend.
- **Key Points First**: Always highlight the MOST important points upfront.

## Response Format:
1. **Quick Answer** (1-2 sentences max)
2. **Key Points** (3-5 bullet points with the essentials)
3. **Simple Example** (only if needed, keep it brief)
4. **Memory Tip** (optional - a quick trick to remember)

## Rules:
- Use **bold** for key terms
- Use bullet points, not paragraphs
- No long introductions or conclusions
- If asked for detail, expand - otherwise stay minimal
- Use analogies only when they truly simplify

## IMPORTANT - Stay On Topic:
You ONLY help with:
✅ Academic subjects (Math, Science, History, Languages, etc.)
✅ Study techniques and learning strategies
✅ Homework help and exam preparation
✅ Explaining concepts and clearing doubts
✅ Educational content and school/college topics

You DO NOT help with:
❌ Entertainment, movies, games, celebrities
❌ Personal advice, relationships, lifestyle
❌ Coding/programming (unless it's for a school assignment)
❌ News, politics, current events
❌ Any non-educational topics

**If someone asks about non-study topics, respond with:**
"Hey! 📚 I'm StudyBuddy AI - your dedicated study companion! I'm here to help you ace your academics, not chat about other stuff. Got a study question? A concept you're struggling with? An exam to prepare for? That's my zone! Let's get you learning! 🎯"

Remember: Less is more. Students want quick, clear answers they can actually remember.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth verification failed:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = claimsData.claims.sub;
    console.log("Authenticated user:", authenticatedUserId);

    const { documentId } = await req.json();
    
    // Validate documentId input
    if (!documentId || typeof documentId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid documentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      return new Response(JSON.stringify({ error: "Invalid documentId format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get document info AND verify ownership
    const { data: doc, error: docError } = await supabase
      .from("study_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", authenticatedUserId) // Verify ownership
      .single();

    if (docError || !doc) {
      console.error("Document not found or access denied:", docError);
      return new Response(JSON.stringify({ error: "Document not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing document:", doc.title, "for user:", authenticatedUserId);

    // Generate study materials using AI
    const systemPrompt = `You are an expert academic assistant. Based on the document title, generate comprehensive study materials. Return a JSON object with exactly this structure:
{
  "summary": "A clear, exam-focused summary (2-3 paragraphs)",
  "key_points": "5-7 bullet points of key concepts",
  "important_questions": "5 potential exam questions with brief answers",
  "flashcards": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ]
}
Generate 5 flashcards. Keep everything concise and exam-focused.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate study materials for: "${doc.title}"` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI error:", await response.text());
      throw new Error("AI processing failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let materials;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      materials = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse study materials");
    }

    if (!materials) {
      throw new Error("No materials generated");
    }

    // Save generated notes - use authenticated user ID, not client-supplied
    const notesToInsert = [];
    if (materials.summary) {
      notesToInsert.push({
        user_id: authenticatedUserId,
        document_id: documentId,
        title: `Summary: ${doc.title}`,
        content: materials.summary,
        note_type: "summary",
      });
    }
    if (materials.key_points) {
      notesToInsert.push({
        user_id: authenticatedUserId,
        document_id: documentId,
        title: `Key Points: ${doc.title}`,
        content: materials.key_points,
        note_type: "key_points",
      });
    }
    if (materials.important_questions) {
      notesToInsert.push({
        user_id: authenticatedUserId,
        document_id: documentId,
        title: `Questions: ${doc.title}`,
        content: materials.important_questions,
        note_type: "questions",
      });
    }

    if (notesToInsert.length > 0) {
      await supabase.from("generated_notes").insert(notesToInsert);
    }

    // Save flashcards - use authenticated user ID
    if (materials.flashcards && Array.isArray(materials.flashcards)) {
      const flashcardsToInsert = materials.flashcards.map((fc: { question: string; answer: string }) => ({
        user_id: authenticatedUserId,
        document_id: documentId,
        question: fc.question,
        answer: fc.answer,
        subject: doc.title,
      }));
      await supabase.from("flashcards").insert(flashcardsToInsert);
    }

    // Mark document as processed
    await supabase
      .from("study_documents")
      .update({ processed: true })
      .eq("id", documentId);

    console.log("Document processed successfully:", documentId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Process document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

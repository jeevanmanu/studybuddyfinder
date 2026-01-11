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

    // Extract meaningful topic from title (remove file extension)
    const topicName = doc.title.replace(/\.(pdf|docx?|txt|pptx?)$/i, '').trim();
    console.log("Extracted topic:", topicName);

    // Generate study materials using AI
    const systemPrompt = `You are an expert academic assistant that creates study materials. You MUST respond with ONLY a valid JSON object, no markdown, no explanation.

Based on the topic or subject name provided, create comprehensive study materials. Be creative and thorough - imagine what this topic would typically cover in an academic setting.

Your response must be a valid JSON object with this exact structure:
{
  "summary": "A comprehensive 2-3 paragraph summary covering the main concepts of this topic",
  "key_points": "• Point 1\\n• Point 2\\n• Point 3\\n• Point 4\\n• Point 5",
  "important_questions": "1. Question 1? Answer: ...\\n2. Question 2? Answer: ...\\n3. Question 3? Answer: ...",
  "flashcards": [
    {"question": "What is...?", "answer": "It is..."},
    {"question": "How does...?", "answer": "It works by..."},
    {"question": "Why is...?", "answer": "Because..."},
    {"question": "What are the types of...?", "answer": "The types are..."},
    {"question": "Explain the concept of...?", "answer": "This concept refers to..."}
  ]
}

IMPORTANT: Return ONLY the JSON object. No markdown code blocks, no explanation text.`;

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
          { role: "user", content: `Create detailed study materials for the academic topic: "${topicName}". Generate educational content that would help a student understand and prepare for exams on this subject.` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", errorText);
      throw new Error("AI processing failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response received, length:", content.length);

    // Parse JSON from response
    let materials;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      
      // Try to find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        materials = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      console.error("Parse error:", parseError);
    }

    // If parsing failed, create fallback materials
    if (!materials) {
      console.log("Using fallback materials generation");
      materials = {
        summary: `This document covers the topic of "${topicName}". Review the uploaded document carefully to understand the key concepts and prepare for your exams.`,
        key_points: `• Review the main concepts of ${topicName}\n• Identify key definitions and terminology\n• Understand the relationships between different concepts\n• Practice with examples and exercises\n• Create your own summaries for better retention`,
        important_questions: `1. What are the main concepts covered in ${topicName}?\n2. How do these concepts relate to each other?\n3. What are the practical applications?\n4. What are common misconceptions about this topic?\n5. How would you explain the key ideas in your own words?`,
        flashcards: [
          { question: `What is ${topicName} about?`, answer: "Review your document to identify the main subject and scope." },
          { question: `What are the key terms in ${topicName}?`, answer: "Identify and define important vocabulary from the document." },
          { question: `How can you apply concepts from ${topicName}?`, answer: "Think about real-world applications and examples." },
          { question: `What should you remember for exams about ${topicName}?`, answer: "Focus on definitions, formulas, and key relationships." },
          { question: `How does ${topicName} connect to other subjects?`, answer: "Consider interdisciplinary connections and broader context." }
        ]
      };
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, documentContent, generateType } = await req.json();
    
    console.log('Processing document:', documentId, 'Type:', generateType);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (generateType === 'notes') {
      systemPrompt = `You are an expert academic assistant. Create comprehensive exam-focused study notes from the provided content. 
      Structure the notes with:
      - Key concepts and definitions
      - Important formulas/equations (if applicable)
      - Critical points to remember
      - Summary of main topics
      Format using markdown for better readability.`;
      userPrompt = `Create exam-focused study notes from this content:\n\n${documentContent}`;
    } else if (generateType === 'questions') {
      systemPrompt = `You are an expert academic assistant. Generate important questions that are likely to appear in exams based on the provided content.
      Include:
      - Short answer questions (5-10)
      - Long answer questions (3-5)
      - MCQ-style questions (5-10)
      For each question, provide the expected answer or key points.
      Format using markdown.`;
      userPrompt = `Generate important exam questions from this content:\n\n${documentContent}`;
    } else if (generateType === 'flashcards') {
      systemPrompt = `You are an expert academic assistant. Create flashcards from the provided content for effective revision.
      Return a JSON array of flashcards with this exact structure:
      [{"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}]
      Create 10-20 flashcards covering the key concepts.
      Only return valid JSON, no markdown or extra text.`;
      userPrompt = `Create flashcards from this content:\n\n${documentContent}`;
    }

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
          { role: "user", content: userPrompt }
        ],
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
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to process document");
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // Save to database based on type
    if (generateType === 'flashcards') {
      try {
        const flashcards = JSON.parse(generatedContent);
        const flashcardInserts = flashcards.map((fc: any) => ({
          document_id: documentId,
          user_id: user.id,
          question: fc.question,
          answer: fc.answer,
          difficulty: fc.difficulty || 'medium',
        }));

        const { error: insertError } = await supabase
          .from('flashcards')
          .insert(flashcardInserts);

        if (insertError) {
          console.error("Flashcard insert error:", insertError);
        }
      } catch (parseError) {
        console.error("Failed to parse flashcards JSON:", parseError);
      }
    } else {
      const noteType = generateType === 'notes' ? 'exam_focused' : 'important_questions';
      const { error: noteError } = await supabase
        .from('generated_notes')
        .insert({
          document_id: documentId,
          user_id: user.id,
          title: generateType === 'notes' ? 'Exam-Focused Notes' : 'Important Questions',
          content: generatedContent,
          note_type: noteType,
        });

      if (noteError) {
        console.error("Note insert error:", noteError);
      }
    }

    // Mark document as processed
    await supabase
      .from('study_documents')
      .update({ processed: true })
      .eq('id', documentId);

    console.log('Document processed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      content: generatedContent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in process-document:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

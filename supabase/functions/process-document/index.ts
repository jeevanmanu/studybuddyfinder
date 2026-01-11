import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to encode array buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth verification failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = user.id;
    console.log("Authenticated user:", authenticatedUserId);

    const { documentId } = await req.json();
    
    if (!documentId || typeof documentId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid documentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      .eq("user_id", authenticatedUserId)
      .single();

    if (docError || !doc) {
      console.error("Document not found or access denied:", docError);
      return new Response(JSON.stringify({ error: "Document not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing document:", doc.title, "for user:", authenticatedUserId);

    // Extract text from PDF using Gemini's multimodal capabilities
    let extractedText = "";
    const isPdf = doc.file_type === "application/pdf" || doc.title.toLowerCase().endsWith(".pdf");
    
    if (isPdf) {
      try {
        console.log("Extracting text from PDF:", doc.file_path);
        
        // Download the PDF from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("study-documents")
          .download(doc.file_path);

        if (downloadError) {
          console.error("Failed to download PDF:", downloadError);
          throw new Error("Failed to download PDF");
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = arrayBufferToBase64(arrayBuffer);
        
        console.log("PDF downloaded, size:", arrayBuffer.byteLength, "bytes");

        // Use Gemini to extract text from PDF (multimodal)
        const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { 
                role: "user", 
                content: [
                  {
                    type: "text",
                    text: "Extract ALL the text content from this PDF document. Return the complete text as it appears in the document, preserving the structure and order. Only return the extracted text, nothing else."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:application/pdf;base64,${base64Data}`
                    }
                  }
                ]
              },
            ],
          }),
        });

        if (extractResponse.ok) {
          const extractData = await extractResponse.json();
          extractedText = extractData.choices?.[0]?.message?.content || "";
          console.log("Extracted", extractedText.length, "characters from PDF");

          // Save extracted text to database
          if (extractedText.length > 0) {
            await supabase
              .from("study_documents")
              .update({ extracted_text: extractedText.substring(0, 100000) })
              .eq("id", documentId);
          }
        } else {
          console.error("PDF extraction failed:", await extractResponse.text());
        }
      } catch (pdfError) {
        console.error("PDF extraction error:", pdfError);
        extractedText = "";
      }
    }

    // Build prompt based on extracted content or title
    const topicName = doc.title.replace(/\.(pdf|docx?|txt|pptx?)$/i, '').trim();
    const hasContent = extractedText.length > 100;
    
    console.log("Using", hasContent ? "extracted content" : "title-based", "generation");

    const systemPrompt = `You are an expert academic assistant that creates study materials. You MUST respond with ONLY a valid JSON object, no markdown, no explanation.

${hasContent ? 
`Based on the ACTUAL DOCUMENT CONTENT provided, create study materials that accurately reflect what's in the document.` :
`Based on the topic name provided, create comprehensive study materials. Be creative and thorough.`}

Your response must be a valid JSON object with this exact structure:
{
  "summary": "A comprehensive 2-3 paragraph summary covering the main concepts",
  "key_points": "• Point 1\\n• Point 2\\n• Point 3\\n• Point 4\\n• Point 5",
  "flashcards": [
    {"question": "What is...?", "answer": "It is..."},
    {"question": "How does...?", "answer": "It works by..."},
    {"question": "Why is...?", "answer": "Because..."},
    {"question": "What are the types of...?", "answer": "The types are..."},
    {"question": "Explain the concept of...?", "answer": "This concept refers to..."}
  ],
  "quiz_questions": [
    {"question": "Question text?", "options": ["A) option", "B) option", "C) option", "D) option"], "correct_answer": "A) option", "topic": "topic name"},
    {"question": "Question text?", "options": ["A) option", "B) option", "C) option", "D) option"], "correct_answer": "B) option", "topic": "topic name"}
  ]
}

Generate at least 5 flashcards and 5 quiz questions with 4 multiple choice options each.
IMPORTANT: Return ONLY the JSON object. No markdown code blocks.`;

    const userPrompt = hasContent 
      ? `Create study materials from this document content:\n\n${extractedText.substring(0, 15000)}`
      : `Create study materials for the academic topic: "${topicName}"`;

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
          { role: "user", content: userPrompt },
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
      let jsonStr = content;
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        materials = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
    }

    // Fallback materials
    if (!materials) {
      console.log("Using fallback materials generation");
      materials = {
        summary: `This document covers "${topicName}". Review the content to understand key concepts.`,
        key_points: `• Main concepts of ${topicName}\n• Key definitions and terminology\n• Important relationships\n• Practical applications\n• Study strategies`,
        flashcards: [
          { question: `What is ${topicName} about?`, answer: "Review the document for main concepts." },
          { question: `Key terms in ${topicName}?`, answer: "Identify important vocabulary." },
          { question: `Applications of ${topicName}?`, answer: "Consider real-world uses." },
          { question: `Important facts about ${topicName}?`, answer: "Focus on exam-relevant information." },
          { question: `How to study ${topicName}?`, answer: "Use flashcards and practice quizzes." }
        ],
        quiz_questions: [
          { question: `What is the main focus of ${topicName}?`, options: ["A) Core concepts", "B) History", "C) Applications", "D) Theory"], correct_answer: "A) Core concepts", topic: topicName },
          { question: `Which method helps study ${topicName}?`, options: ["A) Memorization only", "B) Active recall", "C) Passive reading", "D) Ignoring details"], correct_answer: "B) Active recall", topic: topicName }
        ]
      };
    }

    // Save generated notes
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

    if (notesToInsert.length > 0) {
      await supabase.from("generated_notes").insert(notesToInsert);
    }

    // Save flashcards
    if (materials.flashcards && Array.isArray(materials.flashcards)) {
      const flashcardsToInsert = materials.flashcards.map((fc: { question: string; answer: string }) => ({
        user_id: authenticatedUserId,
        document_id: documentId,
        question: fc.question,
        answer: fc.answer,
        subject: topicName,
      }));
      await supabase.from("flashcards").insert(flashcardsToInsert);
    }

    // Auto-generate quiz from document
    if (materials.quiz_questions && Array.isArray(materials.quiz_questions) && materials.quiz_questions.length > 0) {
      // Create the quiz record
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          user_id: authenticatedUserId,
          document_id: documentId,
          title: `Quiz: ${topicName}`,
          subject: topicName,
          total_questions: materials.quiz_questions.length,
          score: 0,
          percentage: 0,
          quiz_type: "document"
        })
        .select()
        .single();

      if (!quizError && quiz) {
        // Insert quiz questions as results (unanswered)
        const questionsToInsert = materials.quiz_questions.map((q: any) => ({
          quiz_id: quiz.id,
          user_id: authenticatedUserId,
          question_text: q.question,
          correct_answer: q.correct_answer,
          topic: q.topic || topicName,
          is_correct: false,
          user_answer: null
        }));
        await supabase.from("quiz_question_results").insert(questionsToInsert);
        console.log("Created quiz with", materials.quiz_questions.length, "questions");
      }
    }

    // Mark document as processed
    await supabase
      .from("study_documents")
      .update({ processed: true })
      .eq("id", documentId);

    console.log("Document processed successfully:", documentId);

    return new Response(JSON.stringify({ success: true, hasExtractedContent: hasContent }), {
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

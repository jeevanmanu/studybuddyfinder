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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log('Analyzing performance for user:', user.id);

    // Fetch quiz results
    const { data: quizzes, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (quizError) {
      console.error("Quiz fetch error:", quizError);
    }

    // Fetch detailed question results
    const { data: questionResults, error: qrError } = await supabase
      .from('quiz_question_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (qrError) {
      console.error("Question results fetch error:", qrError);
    }

    // Calculate topic-wise performance
    const topicStats: Record<string, { total: number; correct: number; subject: string }> = {};
    
    if (questionResults) {
      for (const result of questionResults) {
        if (!topicStats[result.topic]) {
          topicStats[result.topic] = { total: 0, correct: 0, subject: result.topic };
        }
        topicStats[result.topic].total++;
        if (result.is_correct) {
          topicStats[result.topic].correct++;
        }
      }
    }

    // Calculate subject-wise performance from quizzes
    const subjectStats: Record<string, { totalQuestions: number; totalScore: number; quizCount: number }> = {};
    
    if (quizzes) {
      for (const quiz of quizzes) {
        if (!subjectStats[quiz.subject]) {
          subjectStats[quiz.subject] = { totalQuestions: 0, totalScore: 0, quizCount: 0 };
        }
        subjectStats[quiz.subject].totalQuestions += quiz.total_questions;
        subjectStats[quiz.subject].totalScore += quiz.score;
        subjectStats[quiz.subject].quizCount++;
      }
    }

    // Prepare data for AI analysis
    const analyticsData = {
      totalQuizzes: quizzes?.length || 0,
      topicBreakdown: Object.entries(topicStats).map(([topic, stats]) => ({
        topic,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        totalAttempts: stats.total,
        correctAttempts: stats.correct,
      })),
      subjectBreakdown: Object.entries(subjectStats).map(([subject, stats]) => ({
        subject,
        averageScore: stats.quizCount > 0 
          ? Math.round((stats.totalScore / stats.totalQuestions) * 100) 
          : 0,
        quizCount: stats.quizCount,
      })),
      recentTrend: quizzes?.slice(0, 10).map(q => ({
        date: q.created_at,
        percentage: q.percentage,
        subject: q.subject,
      })) || [],
    };

    // Get AI insights
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an educational analytics expert. Analyze student performance data and provide:
1. Identified weak topics (topics with <60% accuracy)
2. Strong areas (topics with >80% accuracy)
3. Improvement trends (are scores improving over time?)
4. Personalized recommendations for improvement
5. Predicted areas needing focus

Return a JSON object with this structure:
{
  "weakTopics": [{"topic": "...", "accuracy": N, "recommendation": "..."}],
  "strongTopics": [{"topic": "...", "accuracy": N}],
  "trend": "improving|stable|declining",
  "overallScore": N,
  "predictions": ["..."],
  "recommendations": ["..."]
}
Only return valid JSON.`
          },
          { 
            role: "user", 
            content: `Analyze this student's performance data:\n${JSON.stringify(analyticsData, null, 2)}` 
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI response error:", aiResponse.status);
    }

    let insights = null;
    try {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        insights = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI insights:", parseError);
    }

    // Update performance_analytics table
    for (const [topic, stats] of Object.entries(topicStats)) {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const strengthLevel = accuracy >= 80 ? 'strong' : accuracy >= 60 ? 'moderate' : 'weak';

      const { error: upsertError } = await supabase
        .from('performance_analytics')
        .upsert({
          user_id: user.id,
          subject: stats.subject,
          topic: topic,
          total_attempts: stats.total,
          correct_attempts: stats.correct,
          accuracy_percentage: accuracy,
          strength_level: strengthLevel,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,subject,topic',
        });

      if (upsertError) {
        console.error("Upsert error for topic:", topic, upsertError);
      }
    }

    console.log('Performance analysis complete');

    return new Response(JSON.stringify({
      success: true,
      analytics: analyticsData,
      insights,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-performance:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

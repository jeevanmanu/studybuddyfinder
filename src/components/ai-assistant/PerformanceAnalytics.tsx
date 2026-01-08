import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Brain, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface Analytics {
  id: string;
  subject: string;
  topic: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_percentage: number;
  strength_level: string;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: string;
}

interface PerformanceAnalyticsProps {
  userId: string;
}

export function PerformanceAnalytics({ userId }: PerformanceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [analyticsRes, quizzesRes] = await Promise.all([
        supabase
          .from('performance_analytics')
          .select('*')
          .eq('user_id', userId)
          .order('accuracy_percentage', { ascending: false }),
        supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (analyticsRes.error) throw analyticsRes.error;
      if (quizzesRes.error) throw quizzesRes.error;

      setAnalytics(analyticsRes.data || []);
      setQuizzes(quizzesRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'strong':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'moderate':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'weak':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'strong':
        return <TrendingUp className="w-4 h-4" />;
      case 'weak':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const strongTopics = analytics.filter((a) => a.strength_level === 'strong');
  const weakTopics = analytics.filter((a) => a.strength_level === 'weak');
  const averageScore = quizzes.length > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + q.percentage, 0) / quizzes.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (analytics.length === 0 && quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No performance data yet</p>
        <p className="text-sm text-muted-foreground">Take quizzes to see your analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageScore}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{strongTopics.length}</p>
                <p className="text-sm text-muted-foreground">Strong Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weakTopics.length}</p>
                <p className="text-sm text-muted-foreground">Needs Work</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No topic data yet
              </p>
            ) : (
              <div className="space-y-4">
                {analytics.slice(0, 6).map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.topic}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStrengthColor(item.strength_level)}`}>
                          {getStrengthIcon(item.strength_level)}
                          {item.strength_level}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(item.accuracy_percentage || 0)}%
                      </span>
                    </div>
                    <Progress value={item.accuracy_percentage || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.correct_attempts}/{item.total_attempts} correct • {item.subject}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No quizzes taken yet
              </p>
            ) : (
              <div className="space-y-3">
                {quizzes.slice(0, 5).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">{quiz.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        quiz.percentage >= 70 
                          ? 'text-green-600 dark:text-green-400'
                          : quiz.percentage >= 50
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {quiz.score}/{quiz.total_questions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(quiz.percentage)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {(strongTopics.length > 0 || weakTopics.length > 0) && (
        <Card className="gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Study Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strongTopics.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    🎯 Your Strengths
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    You're excelling in {strongTopics.slice(0, 3).map((t) => t.topic).join(', ')}.
                    Keep up the great work!
                  </p>
                </div>
              )}
              {weakTopics.length > 0 && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    📚 Focus Areas
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Consider spending more time on {weakTopics.slice(0, 3).map((t) => t.topic).join(', ')}.
                    Try reviewing flashcards and notes for these topics.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

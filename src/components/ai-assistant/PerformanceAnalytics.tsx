import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, TrendingDown, Minus, Loader2, RefreshCw,
  Target, AlertCircle, CheckCircle, BarChart3, Brain, Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function PerformanceAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data: performanceData, error } = await supabase
        .from('performance_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('accuracy_percentage', { ascending: true });

      if (error) throw error;

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setAnalytics({
        topicData: performanceData || [],
        quizzes: quizzes || [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-performance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setInsights(result.insights);
      fetchAnalytics();
      
      toast({
        title: "Analysis complete",
        description: "Your performance has been analyzed",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze performance",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'strong': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const totalQuizzes = analytics?.quizzes?.length || 0;
  const avgScore = totalQuizzes > 0
    ? (analytics.quizzes.reduce((acc: number, q: any) => acc + q.percentage, 0) / totalQuizzes).toFixed(1)
    : 0;
  const weakTopics = analytics?.topicData?.filter((t: any) => t.strength_level === 'weak') || [];
  const strongTopics = analytics?.topicData?.filter((t: any) => t.strength_level === 'strong') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track your learning progress and identify areas for improvement
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Analyze Now
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalQuizzes}</div>
              <div className="text-sm text-muted-foreground">Quizzes Taken</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{avgScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{weakTopics.length}</div>
              <div className="text-sm text-muted-foreground">Weak Topics</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{strongTopics.length}</div>
              <div className="text-sm text-muted-foreground">Strong Topics</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Topic Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Topic Performance
            </CardTitle>
            <CardDescription>
              Your performance across different topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topicData?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No data yet. Take some quizzes!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.topicData?.slice(0, 10).map((topic: any) => (
                  <div key={topic.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {topic.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            topic.strength_level === 'strong' ? 'border-green-500 text-green-500' :
                            topic.strength_level === 'weak' ? 'border-red-500 text-red-500' :
                            'border-yellow-500 text-yellow-500'
                          }`}
                        >
                          {topic.strength_level}
                        </Badge>
                        <span className="text-sm font-bold w-12 text-right">
                          {topic.accuracy_percentage?.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={topic.accuracy_percentage} 
                      className={`h-2 ${getStrengthColor(topic.strength_level)}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations from AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!insights ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Click "Analyze Now" to get AI-powered insights</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Trend */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {getTrendIcon(insights.trend)}
                  <div>
                    <div className="font-medium capitalize">{insights.trend} Trend</div>
                    <div className="text-sm text-muted-foreground">
                      Overall score: {insights.overallScore}%
                    </div>
                  </div>
                </div>

                {/* Weak Topics */}
                {insights.weakTopics?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Areas to Focus
                    </h4>
                    <div className="space-y-2">
                      {insights.weakTopics.slice(0, 3).map((topic: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                          <div className="font-medium text-sm">{topic.topic}</div>
                          <div className="text-xs text-muted-foreground">{topic.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {insights.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {insights.recommendations.slice(0, 4).map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quizzes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quiz History</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.quizzes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No quizzes taken yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics?.quizzes?.slice(0, 5).map((quiz: any) => (
                <div 
                  key={quiz.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{quiz.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {quiz.subject} • {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      quiz.percentage >= 80 ? 'text-green-500' :
                      quiz.percentage >= 60 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {quiz.percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {quiz.score}/{quiz.total_questions}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

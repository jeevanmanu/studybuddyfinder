import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, FileText, Play, Trophy, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  total_questions: number;
  score: number;
  percentage: number;
  quiz_type: string | null;
  created_at: string;
  document_id: string | null;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean;
  topic: string;
}

interface QuizViewerProps {
  userId: string;
  refreshTrigger: number;
}

export function QuizViewer({ userId, refreshTrigger }: QuizViewerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, [userId, refreshTrigger]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setShowResult(false);
    setSelectedAnswer(null);

    try {
      const { data, error } = await supabase
        .from('quiz_question_results')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({ title: "Failed to load quiz", variant: "destructive" });
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Update the question result in database
    try {
      await supabase
        .from('quiz_question_results')
        .update({
          user_answer: answer,
          is_correct: isCorrect
        })
        .eq('id', currentQuestion.id);

      // Update performance analytics
      await updatePerformanceAnalytics(currentQuestion.topic, isCorrect);
    } catch (error) {
      console.error('Error updating answer:', error);
    }
  };

  const updatePerformanceAnalytics = async (topic: string, isCorrect: boolean) => {
    try {
      // Check if analytics record exists
      const { data: existing } = await supabase
        .from('performance_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', topic)
        .single();

      if (existing) {
        const newTotal = (existing.total_attempts || 0) + 1;
        const newCorrect = (existing.correct_attempts || 0) + (isCorrect ? 1 : 0);
        const newPercentage = Math.round((newCorrect / newTotal) * 100);
        const strengthLevel = newPercentage >= 70 ? 'strong' : newPercentage >= 40 ? 'moderate' : 'weak';

        await supabase
          .from('performance_analytics')
          .update({
            total_attempts: newTotal,
            correct_attempts: newCorrect,
            accuracy_percentage: newPercentage,
            strength_level: strengthLevel,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('performance_analytics')
          .insert({
            user_id: userId,
            topic: topic,
            subject: selectedQuiz?.subject || topic,
            total_attempts: 1,
            correct_attempts: isCorrect ? 1 : 0,
            accuracy_percentage: isCorrect ? 100 : 0,
            strength_level: isCorrect ? 'strong' : 'weak'
          });
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      const finalPercentage = Math.round((score / questions.length) * 100);
      
      // Update quiz score
      if (selectedQuiz) {
        await supabase
          .from('quizzes')
          .update({ 
            score: score, 
            percentage: finalPercentage 
          })
          .eq('id', selectedQuiz.id);
      }

      toast({
        title: "Quiz Completed!",
        description: `You scored ${score}/${questions.length} (${finalPercentage}%)`,
      });
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setQuizCompleted(false);
    fetchQuizzes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Quiz in progress
  if (selectedQuiz && questions.length > 0 && !quizCompleted) {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Generate options from correct answer (simplified approach)
    const options = [currentQuestion.correct_answer, "Option A", "Option B", "Option C"]
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 4);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{selectedQuiz.title}</h3>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <Badge variant="secondary">Score: {score}/{currentIndex + (showResult ? 1 : 0)}</Badge>
        </div>

        <Progress value={progress} className="h-2" />

        <Card className="p-6">
          <h4 className="text-lg font-medium mb-6">{currentQuestion.question_text}</h4>
          
          <div className="space-y-3">
            {[currentQuestion.correct_answer].map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg text-left transition-all border ${
                  showResult
                    ? option === currentQuestion.correct_answer
                      ? 'bg-green-100 border-green-500 dark:bg-green-900/30'
                      : selectedAnswer === option
                      ? 'bg-red-100 border-red-500 dark:bg-red-900/30'
                      : 'bg-muted'
                    : 'hover:bg-muted border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && option === currentQuestion.correct_answer && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && selectedAnswer === option && option !== currentQuestion.correct_answer && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {showResult && (
            <Button onClick={nextQuestion} className="w-full mt-6 gradient-primary">
              {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Quiz completed
  if (quizCompleted && selectedQuiz) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Quiz Complete!</h3>
          <p className="text-muted-foreground">{selectedQuiz.title}</p>
        </div>
        <div className="text-4xl font-bold text-primary">
          {score}/{questions.length}
        </div>
        <Progress value={percentage} className="h-3 w-48 mx-auto" />
        <p className="text-lg">
          {percentage >= 80 ? "Excellent work! 🎉" :
           percentage >= 60 ? "Good job! Keep it up! 👍" :
           percentage >= 40 ? "Not bad, keep practicing! 📚" :
           "Keep studying, you'll improve! 💪"}
        </p>
        <Button onClick={resetQuiz} className="gradient-primary">
          <RotateCcw className="w-4 h-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    );
  }

  // Quiz list
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No quizzes available</p>
        <p className="text-sm text-muted-foreground">Process a document to generate a quiz</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Document Quizzes ({quizzes.length})
      </h3>
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="hover:shadow-soft transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{quiz.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">{quiz.subject}</Badge>
                  <span>•</span>
                  <span>{quiz.total_questions} questions</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}</span>
                </div>
                {quiz.percentage > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={quiz.percentage} className="h-2 w-24" />
                    <span className="text-sm font-medium">{quiz.percentage}%</span>
                  </div>
                )}
              </div>
              <Button onClick={() => startQuiz(quiz)} className="gradient-primary">
                <Play className="w-4 h-4 mr-2" />
                {quiz.percentage > 0 ? 'Retake' : 'Start'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

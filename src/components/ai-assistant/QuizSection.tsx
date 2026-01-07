import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, Loader2, Play, Check, X, Trophy, 
  Clock, RotateCcw, BookOpen, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
}

export function QuizSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState<{ questionId: string; answer: string; isCorrect: boolean }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizSubject, setQuizSubject] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchFlashcards();
    }
  }, [user]);

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = () => {
    if (flashcards.length < 5) {
      toast({
        title: "Not enough flashcards",
        description: "You need at least 5 flashcards to start a quiz",
        variant: "destructive",
      });
      return;
    }

    // Shuffle and pick 10 flashcards (or all if less)
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, flashcards.length));

    const generatedQuestions: Question[] = selected.map((fc, idx) => {
      // Generate wrong answers from other flashcards
      const otherAnswers = flashcards
        .filter(f => f.id !== fc.id)
        .map(f => f.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [...otherAnswers, fc.answer].sort(() => Math.random() - 0.5);

      return {
        id: fc.id,
        question: fc.question,
        options: options.slice(0, 4),
        correctAnswer: fc.answer,
        topic: fc.subject || 'General',
      };
    });

    setQuestions(generatedQuestions);
    setQuizSubject(flashcards[0]?.subject || 'General');
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer('');
    setShowResult(false);
    setQuizStarted(true);
    setStartTime(new Date());
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;

    setAnswers([
      ...answers,
      {
        questionId: question.id,
        answer: selectedAnswer,
        isCorrect,
      },
    ]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const endTime = new Date();
    const timeTaken = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    const correctAnswers = answers.filter(a => a.isCorrect).length + (selectedAnswer === questions[currentQuestion].correctAnswer ? 1 : 0);
    const totalQuestions = questions.length;
    const percentage = (correctAnswers / totalQuestions) * 100;

    setShowResult(true);

    // Save quiz results
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user?.id,
          title: `Quiz - ${new Date().toLocaleDateString()}`,
          subject: quizSubject,
          total_questions: totalQuestions,
          score: correctAnswers,
          percentage,
          time_taken_seconds: timeTaken,
          quiz_type: 'flashcard_review',
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Save individual question results
      const questionResults = questions.map((q, idx) => {
        const answer = idx < answers.length ? answers[idx] : { answer: selectedAnswer, isCorrect: selectedAnswer === q.correctAnswer };
        return {
          quiz_id: quiz.id,
          user_id: user?.id,
          topic: q.topic,
          question_text: q.question,
          user_answer: answer.answer,
          correct_answer: q.correctAnswer,
          is_correct: answer.isCorrect,
        };
      });

      await supabase.from('quiz_question_results').insert(questionResults);

    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setQuestions([]);
    setAnswers([]);
    setSelectedAnswer('');
    setShowResult(false);
    setStartTime(null);
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

  if (showResult) {
    const correctCount = answers.filter(a => a.isCorrect).length + (selectedAnswer === questions[currentQuestion]?.correctAnswer ? 1 : 0);
    const percentage = (correctCount / questions.length) * 100;

    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            percentage >= 80 ? 'bg-green-500/10' : percentage >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'
          }`}>
            <Trophy className={`w-10 h-10 ${
              percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
            }`} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-6">
            {percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{correctCount}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-destructive">{questions.length - correctCount}</div>
              <div className="text-sm text-muted-foreground">Wrong</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className={`text-2xl font-bold ${
                percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {percentage.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={resetQuiz}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Quiz
            </Button>
            <Button onClick={generateQuiz}>
              <Play className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quizStarted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Practice Quiz
            </CardTitle>
            <CardDescription>
              Test your knowledge with flashcard-based quizzes
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Ready to test yourself?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We'll generate a quiz from your flashcards. Answer questions to track your progress and identify weak areas.
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{flashcards.length}</div>
                <div className="text-sm text-muted-foreground">Flashcards</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.min(10, flashcards.length)}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={generateQuiz}
              disabled={flashcards.length < 5}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Quiz
            </Button>

            {flashcards.length < 5 && (
              <p className="text-sm text-muted-foreground mt-4">
                You need at least 5 flashcards to start a quiz
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">{question.topic}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center py-4">
          <h2 className="text-xl font-semibold">{question.question}</h2>
        </div>

        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
          <div className="grid gap-3">
            {question.options.map((option, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedAnswer === option 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedAnswer(option)}
              >
                <RadioGroupItem value={option} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="flex justify-end">
          <Button 
            onClick={submitAnswer}
            disabled={!selectedAnswer}
            size="lg"
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

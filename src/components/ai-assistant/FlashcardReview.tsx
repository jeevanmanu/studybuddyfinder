import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Loader2, RotateCcw, ChevronLeft, ChevronRight, 
  ThumbsUp, ThumbsDown, Shuffle, Eye, EyeOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function FlashcardReview() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [correct, setCorrect] = useState<Set<string>>(new Set());

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
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewed(new Set());
    setCorrect(new Set());
  };

  const markCorrect = () => {
    const card = flashcards[currentIndex];
    setReviewed(prev => new Set(prev).add(card.id));
    setCorrect(prev => new Set(prev).add(card.id));
    goNext();
  };

  const markIncorrect = () => {
    const card = flashcards[currentIndex];
    setReviewed(prev => new Set(prev).add(card.id));
    goNext();
  };

  const goNext = () => {
    setShowAnswer(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    setShowAnswer(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const resetReview = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewed(new Set());
    setCorrect(new Set());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-500';
      case 'hard': return 'bg-red-500/10 text-red-500';
      default: return 'bg-yellow-500/10 text-yellow-500';
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

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No flashcards yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Process documents to generate flashcards
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = (reviewed.size / flashcards.length) * 100;
  const accuracy = reviewed.size > 0 ? (correct.size / reviewed.size) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{flashcards.length}</div>
          <div className="text-sm text-muted-foreground">Total Cards</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{reviewed.size}</div>
          <div className="text-sm text-muted-foreground">Reviewed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{correct.size}</div>
          <div className="text-sm text-muted-foreground">Correct</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{accuracy.toFixed(0)}%</div>
          <div className="text-sm text-muted-foreground">Accuracy</div>
        </Card>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{currentIndex + 1} / {flashcards.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={shuffleCards}>
          <Shuffle className="w-4 h-4 mr-2" />
          Shuffle
        </Button>
        <Button variant="outline" size="sm" onClick={resetReview}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Flashcard */}
      <Card 
        className="min-h-[300px] cursor-pointer transition-all hover:shadow-lg"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge className={getDifficultyColor(currentCard.difficulty)}>
              {currentCard.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">{showAnswer ? 'Hide' : 'Reveal'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {showAnswer ? 'Answer' : 'Question'}
          </div>
          <p className="text-xl font-medium">
            {showAnswer ? currentCard.answer : currentCard.question}
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        {showAnswer && (
          <>
            <Button
              variant="outline"
              className="text-red-500 border-red-500/50 hover:bg-red-500/10"
              onClick={markIncorrect}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Got it wrong
            </Button>
            <Button
              variant="outline"
              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
              onClick={markCorrect}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Got it right
            </Button>
          </>
        )}

        <Button 
          variant="outline" 
          size="icon"
          onClick={goNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

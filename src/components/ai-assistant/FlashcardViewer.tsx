import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject: string | null;
  difficulty: string | null;
}

interface FlashcardViewerProps {
  userId: string;
  refreshTrigger: number;
}

export function FlashcardViewer({ userId, refreshTrigger }: FlashcardViewerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashcards();
  }, [userId, refreshTrigger]);

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No flashcards yet</p>
        <p className="text-sm text-muted-foreground">Upload a document and generate flashcards</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        {currentCard.subject && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            {currentCard.subject}
          </span>
        )}
      </div>

      <div
        className="relative h-64 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <Card className={`absolute inset-0 transition-all duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}>
          <CardContent className="h-full flex flex-col items-center justify-center p-6 backface-hidden">
            <span className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
              Question
            </span>
            <p className="text-lg font-medium text-center">{currentCard.question}</p>
            <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
          </CardContent>
        </Card>

        <Card className={`absolute inset-0 transition-all duration-500 transform-style-3d rotate-y-180 ${
          isFlipped ? 'rotate-y-0' : ''
        }`}>
          <CardContent className="h-full flex flex-col items-center justify-center p-6 backface-hidden gradient-primary text-primary-foreground rounded-lg">
            <span className="text-xs mb-4 uppercase tracking-wide opacity-80">
              Answer
            </span>
            <p className="text-lg font-medium text-center">{currentCard.answer}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={flashcards.length <= 1}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsFlipped(false)}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={flashcards.length <= 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

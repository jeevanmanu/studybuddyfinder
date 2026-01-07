import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, BookOpen, HelpCircle, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GeneratedContentProps {
  documents: any[];
}

export function GeneratedContent({ documents }: GeneratedContentProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_notes')
        .select('*, study_documents(title)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await supabase.from('generated_notes').delete().eq('id', noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getTypeIcon = (noteType: string) => {
    switch (noteType) {
      case 'exam_focused':
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'important_questions':
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  const getTypeLabel = (noteType: string) => {
    switch (noteType) {
      case 'exam_focused':
        return 'Exam Notes';
      case 'important_questions':
        return 'Important Questions';
      default:
        return 'Summary';
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

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No generated content yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Upload documents and generate notes to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Study Materials</h2>
        <Badge variant="secondary">{notes.length} items</Badge>
      </div>

      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(note.note_type)}
                    <Badge variant="outline">{getTypeLabel(note.note_type)}</Badge>
                  </div>
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <CardDescription className="mt-1">
                    From: {note.study_documents?.title || 'Unknown document'} • 
                    {new Date(note.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedNote === note.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedNote === note.id && (
              <CardContent className="border-t">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {note.content}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

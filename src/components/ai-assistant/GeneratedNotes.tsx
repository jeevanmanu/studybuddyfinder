import { useState, useEffect } from 'react';
import { FileText, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  note_type: string;
  created_at: string;
}

interface GeneratedNotesProps {
  userId: string;
  refreshTrigger: number;
}

export function GeneratedNotes({ userId, refreshTrigger }: GeneratedNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [userId, refreshTrigger]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      if (data && data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No notes generated yet</p>
        <p className="text-sm text-muted-foreground">Upload a document and generate exam notes</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* Notes List */}
      <div className="md:col-span-1">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {notes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-all hover:shadow-soft ${
                  selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{note.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      note.note_type === 'summary' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : note.note_type === 'key_points'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {note.note_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Note Content */}
      <div className="md:col-span-2">
        {selectedNote ? (
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{selectedNote.title}</CardTitle>
              <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                selectedNote.note_type === 'summary' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : selectedNote.note_type === 'key_points'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              }`}>
                {selectedNote.note_type.replace('_', ' ')}
              </span>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm">{selectedNote.content}</p>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Select a note to view
          </div>
        )}
      </div>
    </div>
  );
}

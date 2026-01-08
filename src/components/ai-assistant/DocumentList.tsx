import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  created_at: string;
}

interface DocumentListProps {
  userId: string;
  refreshTrigger: number;
  onProcessDocument: (docId: string) => void;
}

export function DocumentList({ userId, refreshTrigger, onProcessDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [userId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('study_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (doc: Document) => {
    setProcessingId(doc.id);
    try {
      const { error } = await supabase.functions.invoke('process-document', {
        body: { documentId: doc.id, userId }
      });

      if (error) throw error;

      await supabase
        .from('study_documents')
        .update({ processed: true })
        .eq('id', doc.id);

      toast({
        title: "Document processed!",
        description: `Notes and flashcards generated from "${doc.title}"`,
      });

      fetchDocuments();
      onProcessDocument(doc.id);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await supabase.storage
        .from('study-documents')
        .remove([doc.title]);

      const { error } = await supabase
        .from('study_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({ title: "Document deleted" });
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Failed to delete",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No documents uploaded yet</p>
        <p className="text-sm text-muted-foreground">Upload your study materials to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Your Documents ({documents.length})
      </h3>
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-soft transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  doc.processed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10'
                }`}>
                  {doc.processed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                    <span>•</span>
                    <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!doc.processed && (
                  <Button
                    size="sm"
                    onClick={() => handleProcess(doc)}
                    disabled={processingId === doc.id}
                    className="gradient-primary"
                  >
                    {processingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { Upload, FileText, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploadProps {
  userId: string;
  onDocumentProcessed: () => void;
}

export function DocumentUpload({ userId, onDocumentProcessed }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('study-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('study_documents')
        .insert({
          user_id: userId,
          title: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          processed: false
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded!",
        description: "Your document is ready for AI processing.",
      });

      setSelectedFile(null);
      onDocumentProcessed();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async (documentId: string, title: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('process-document', {
        body: { documentId, userId }
      });

      if (error) throw error;

      await supabase
        .from('study_documents')
        .update({ processed: true })
        .eq('id', documentId);

      toast({
        title: "Document processed!",
        description: `Notes and flashcards generated from "${title}"`,
      });

      onDocumentProcessed();
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Upload Study Material</h3>
            <p className="text-sm text-muted-foreground text-center">
              Drag & drop or click to upload PDFs, Word docs, or text files
            </p>
            <p className="text-xs text-muted-foreground mt-2">Max 10MB</p>
          </label>
        </CardContent>
      </Card>

      {selectedFile && (
        <Card className="animate-fade-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="gradient-primary"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

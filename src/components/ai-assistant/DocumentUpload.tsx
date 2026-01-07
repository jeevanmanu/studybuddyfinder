import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, FileText, Loader2, Trash2, CheckCircle, 
  BookOpen, HelpCircle, Layers, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentUploadProps {
  onUploadComplete: () => void;
  documents: any[];
  isLoading: boolean;
}

export function DocumentUpload({ onUploadComplete, documents, isLoading }: DocumentUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, TXT, DOC, or DOCX files",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('study-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('study_documents')
        .insert({
          user_id: user.id,
          title: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: "Your document is ready for AI processing",
      });
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processDocument = async (docId: string, generateType: 'notes' | 'questions' | 'flashcards') => {
    if (!user) return;
    
    setProcessing(`${docId}-${generateType}`);
    try {
      // Get the document content (for now, we'll simulate with title)
      const doc = documents.find(d => d.id === docId);
      if (!doc) throw new Error("Document not found");

      // Download file content
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('study-documents')
        .download(doc.file_path);

      if (downloadError) throw downloadError;

      const text = await fileData.text();
      
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            documentId: docId,
            documentContent: text.slice(0, 15000), // Limit content size
            generateType,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      toast({
        title: "Processing complete",
        description: `Successfully generated ${generateType}!`,
      });
      
      onUploadComplete();
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const deleteDocument = async (docId: string, filePath: string) => {
    try {
      await supabase.storage.from('study-documents').remove([filePath]);
      await supabase.from('study_documents').delete().eq('id', docId);
      toast({ title: "Document deleted" });
      onUploadComplete();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Upload Section */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload PDFs, notes, textbooks, or question papers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
          >
            {uploading ? (
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
            ) : (
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            )}
            <p className="font-medium text-foreground">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">What AI can generate:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-green-500" />
                <span>Exam-focused study notes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Important questions with answers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Flashcards for quick revision</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Your Documents
          </CardTitle>
          <CardDescription>
            Select a document to generate AI study materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground/70">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedDoc === doc.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">{doc.title}</span>
                        {doc.processed && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Processed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {selectedDoc === doc.id && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processing !== null}
                        onClick={() => processDocument(doc.id, 'notes')}
                        className="w-full"
                      >
                        {processing === `${doc.id}-notes` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 mr-1" />
                            Notes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processing !== null}
                        onClick={() => processDocument(doc.id, 'questions')}
                        className="w-full"
                      >
                        {processing === `${doc.id}-questions` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <HelpCircle className="w-4 h-4 mr-1" />
                            Questions
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processing !== null}
                        onClick={() => processDocument(doc.id, 'flashcards')}
                        className="w-full"
                      >
                        {processing === `${doc.id}-flashcards` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Layers className="w-4 h-4 mr-1" />
                            Flashcards
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, FileText, BookOpen, Brain, TrendingUp, Users, 
  Loader2, Sparkles, ArrowRight, GraduationCap, Target,
  MessageCircle, Plus, Clock, BarChart3, Lightbulb
} from 'lucide-react';
import { DocumentUpload } from '@/components/ai-assistant/DocumentUpload';
import { GeneratedContent } from '@/components/ai-assistant/GeneratedContent';
import { FlashcardReview } from '@/components/ai-assistant/FlashcardReview';
import { StudyRooms } from '@/components/ai-assistant/StudyRooms';
import { PerformanceAnalytics } from '@/components/ai-assistant/PerformanceAnalytics';
import { QuizSection } from '@/components/ai-assistant/QuizSection';

export default function AIAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('study_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const features = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Upload PDFs, notes, and textbooks for AI processing",
      tab: "upload",
      color: "text-blue-500",
    },
    {
      icon: FileText,
      title: "Generated Notes",
      description: "View exam-focused notes and important questions",
      tab: "notes",
      color: "text-green-500",
    },
    {
      icon: Brain,
      title: "Flashcards",
      description: "Review AI-generated flashcards for revision",
      tab: "flashcards",
      color: "text-purple-500",
    },
    {
      icon: Target,
      title: "Practice Quiz",
      description: "Test your knowledge with practice quizzes",
      tab: "quiz",
      color: "text-orange-500",
    },
    {
      icon: Users,
      title: "Study Rooms",
      description: "Join group study sessions with peers",
      tab: "rooms",
      color: "text-pink-500",
    },
    {
      icon: TrendingUp,
      title: "Performance",
      description: "Analyze your strengths and weaknesses",
      tab: "analytics",
      color: "text-cyan-500",
    },
  ];

  return (
    <Layout backgroundVariant="hero" showFooter={false}>
      <div className="min-h-screen pt-20 pb-8 animate-fade-up">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Learning</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Academic AI Assistant
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your study materials and let AI generate exam notes, flashcards, and practice questions.
              Track your performance and study with peers.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">--</div>
              <div className="text-sm text-muted-foreground">Flashcards</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">--</div>
              <div className="text-sm text-muted-foreground">Quizzes Taken</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">--</div>
              <div className="text-sm text-muted-foreground">Study Hours</div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap justify-start gap-2 h-auto p-2 mb-6 bg-muted/50">
              {features.map((feature) => (
                <TabsTrigger 
                  key={feature.tab}
                  value={feature.tab}
                  className="flex items-center gap-2 data-[state=active]:bg-background"
                >
                  <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  <span className="hidden sm:inline">{feature.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="upload" className="mt-0">
              <DocumentUpload 
                onUploadComplete={fetchDocuments} 
                documents={documents}
                isLoading={isLoadingDocs}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <GeneratedContent documents={documents} />
            </TabsContent>

            <TabsContent value="flashcards" className="mt-0">
              <FlashcardReview />
            </TabsContent>

            <TabsContent value="quiz" className="mt-0">
              <QuizSection />
            </TabsContent>

            <TabsContent value="rooms" className="mt-0">
              <StudyRooms />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <PerformanceAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

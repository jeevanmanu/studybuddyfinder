import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Sparkles, FileText, Users, BarChart3, BookOpen, GraduationCap } from 'lucide-react';
import { AIChatAssistant } from '@/components/ai-assistant/AIChatAssistant';
import { DocumentUpload } from '@/components/ai-assistant/DocumentUpload';
import { DocumentList } from '@/components/ai-assistant/DocumentList';
import { FlashcardViewer } from '@/components/ai-assistant/FlashcardViewer';
import { GeneratedNotes } from '@/components/ai-assistant/GeneratedNotes';
import { StudyRooms } from '@/components/ai-assistant/StudyRooms';
import { PerformanceAnalytics } from '@/components/ai-assistant/PerformanceAnalytics';
import { QuizViewer } from '@/components/ai-assistant/QuizViewer';

export default function AIAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout backgroundVariant="hero" showFooter={false}>
      <div className="min-h-screen pt-20 pb-8 animate-fade-up">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Study Hub</h1>
                <p className="text-sm text-muted-foreground">Your complete academic assistant</p>
              </div>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="assistant" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6 w-full max-w-3xl">
              <TabsTrigger value="assistant" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Chat</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Quizzes</span>
              </TabsTrigger>
              <TabsTrigger value="study-rooms" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Study Rooms</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistant">
              <Card className="h-[calc(100vh-14rem)] backdrop-blur-sm bg-card/90 shadow-medium">
                <CardContent className="h-full p-6">
                  <AIChatAssistant />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="backdrop-blur-sm bg-card/90 shadow-medium">
                  <CardContent className="p-6 space-y-6">
                    <DocumentUpload userId={user.id} onDocumentProcessed={handleRefresh} />
                    <DocumentList userId={user.id} refreshTrigger={refreshTrigger} onProcessDocument={handleRefresh} />
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="backdrop-blur-sm bg-card/90 shadow-medium">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Flashcards</h3>
                      </div>
                      <FlashcardViewer userId={user.id} refreshTrigger={refreshTrigger} />
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-sm bg-card/90 shadow-medium">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Generated Notes</h3>
                      </div>
                      <GeneratedNotes userId={user.id} refreshTrigger={refreshTrigger} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quizzes">
              <Card className="backdrop-blur-sm bg-card/90 shadow-medium min-h-[500px]">
                <CardContent className="p-6">
                  <QuizViewer userId={user.id} refreshTrigger={refreshTrigger} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="study-rooms">
              <Card className="backdrop-blur-sm bg-card/90 shadow-medium min-h-[500px]">
                <CardContent className="p-6">
                  <StudyRooms userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="backdrop-blur-sm bg-card/90 shadow-medium">
                <CardContent className="p-6">
                  <PerformanceAnalytics userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

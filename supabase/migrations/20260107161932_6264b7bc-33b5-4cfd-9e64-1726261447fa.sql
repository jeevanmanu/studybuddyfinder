-- Create storage bucket for study documents
INSERT INTO storage.buckets (id, name, public) VALUES ('study-documents', 'study-documents', false);

-- Storage policies for study documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Study Documents table
CREATE TABLE public.study_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated Notes from documents
CREATE TABLE public.generated_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.study_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'summary', -- summary, exam_focused, important_questions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flashcards generated from documents
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.study_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  subject TEXT,
  difficulty TEXT DEFAULT 'medium',
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Rooms for group study
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Room Members
CREATE TABLE public.study_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- admin, moderator, member
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Study Room Messages (Discussion Board)
CREATE TABLE public.study_room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quizzes for performance tracking
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken_seconds INTEGER,
  quiz_type TEXT DEFAULT 'practice', -- practice, exam, flashcard_review
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz Question Results for detailed analysis
CREATE TABLE public.quiz_question_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance Analytics (aggregated insights)
CREATE TABLE public.performance_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  strength_level TEXT DEFAULT 'unknown', -- weak, moderate, strong
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject, topic)
);

-- Enable RLS on all tables
ALTER TABLE public.study_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_documents
CREATE POLICY "Users can view their own documents" ON public.study_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.study_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.study_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.study_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_notes
CREATE POLICY "Users can view their own notes" ON public.generated_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.generated_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.generated_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Users can view their own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_rooms
CREATE POLICY "Anyone can view public rooms" ON public.study_rooms FOR SELECT USING (is_private = false OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.study_room_members WHERE room_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can create rooms" ON public.study_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Room creators can update" ON public.study_rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Room creators can delete" ON public.study_rooms FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for study_room_members
CREATE POLICY "Members can view room members" ON public.study_room_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.study_room_members srm WHERE srm.room_id = room_id AND srm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_id AND sr.is_private = false));
CREATE POLICY "Users can join rooms" ON public.study_room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.study_room_members FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.study_rooms WHERE id = room_id AND created_by = auth.uid()));

-- RLS Policies for study_room_messages
CREATE POLICY "Members can view room messages" ON public.study_room_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.study_room_members WHERE room_id = study_room_messages.room_id AND user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON public.study_room_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.study_room_members WHERE room_id = study_room_messages.room_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete their own messages" ON public.study_room_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quiz_question_results
CREATE POLICY "Users can view their own results" ON public.quiz_question_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own results" ON public.quiz_question_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for performance_analytics
CREATE POLICY "Users can view their own analytics" ON public.performance_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analytics" ON public.performance_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics" ON public.performance_analytics FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for study room messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;

-- Add triggers for updated_at
CREATE TRIGGER update_study_documents_updated_at
  BEFORE UPDATE ON public.study_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_rooms_updated_at
  BEFORE UPDATE ON public.study_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add extracted_text column to study_documents for PDF content
ALTER TABLE public.study_documents 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add document_id to quizzes for linking quizzes to documents
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.study_documents(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_document_id ON public.quizzes(document_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);

-- Add invited_by column to study_room_members for tracking who invited whom
ALTER TABLE public.study_room_members 
ADD COLUMN IF NOT EXISTS invited_by UUID;

-- Create study_room_invites table for pending invitations
CREATE TABLE IF NOT EXISTS public.study_room_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, invitee_id)
);

-- Enable RLS on study_room_invites
ALTER TABLE public.study_room_invites ENABLE ROW LEVEL SECURITY;

-- Policies for study_room_invites
CREATE POLICY "Users can view their own invites"
ON public.study_room_invites
FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Room members can create invites"
ON public.study_room_invites
FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.study_room_members 
    WHERE room_id = study_room_invites.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Invitees can update their invites"
ON public.study_room_invites
FOR UPDATE
USING (auth.uid() = invitee_id);

CREATE POLICY "Inviters can delete their invites"
ON public.study_room_invites
FOR DELETE
USING (auth.uid() = inviter_id);
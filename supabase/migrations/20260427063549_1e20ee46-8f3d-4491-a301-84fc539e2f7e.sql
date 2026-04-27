
-- 1. Tighten study_room_members INSERT policy
DROP POLICY IF EXISTS "Users can join rooms" ON public.study_room_members;

CREATE POLICY "Users can join rooms"
ON public.study_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.study_rooms sr
      WHERE sr.id = study_room_members.room_id
        AND (sr.is_private = false OR sr.created_by = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.study_room_invites i
      WHERE i.room_id = study_room_members.room_id
        AND i.invitee_id = auth.uid()
        AND i.status = 'accepted'
    )
  )
);

-- 2. Restrict listing on avatars public bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can view own avatar files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Revoke EXECUTE on SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Revoke anon SELECT on app tables (signed-in users still have access via RLS)
REVOKE SELECT ON public.flashcards FROM anon;
REVOKE SELECT ON public.friend_requests FROM anon;
REVOKE SELECT ON public.generated_notes FROM anon;
REVOKE SELECT ON public.messages FROM anon;
REVOKE SELECT ON public.performance_analytics FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.quiz_question_results FROM anon;
REVOKE SELECT ON public.quizzes FROM anon;
REVOKE SELECT ON public.study_documents FROM anon;
REVOKE SELECT ON public.study_room_invites FROM anon;
REVOKE SELECT ON public.study_room_members FROM anon;
REVOKE SELECT ON public.study_room_messages FROM anon;
REVOKE SELECT ON public.study_rooms FROM anon;

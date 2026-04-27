-- Fix 1: study_room_members SELECT — broken self-join condition
DROP POLICY IF EXISTS "Members can view room members" ON public.study_room_members;
CREATE POLICY "Members can view room members"
ON public.study_room_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_room_members srm
    WHERE srm.room_id = study_room_members.room_id
      AND srm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.study_rooms sr
    WHERE sr.id = study_room_members.room_id
      AND sr.is_private = false
  )
);

-- Fix 2: study_rooms SELECT — broken member check
DROP POLICY IF EXISTS "Anyone can view public rooms" ON public.study_rooms;
CREATE POLICY "Anyone can view public rooms"
ON public.study_rooms
FOR SELECT
USING (
  is_private = false
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.study_room_members m
    WHERE m.room_id = study_rooms.id
      AND m.user_id = auth.uid()
  )
);

-- Fix 3: Tighten study_room_invites UPDATE — only status can change
DROP POLICY IF EXISTS "Invitees can update their invites" ON public.study_room_invites;
CREATE POLICY "Invitees can update their invites"
ON public.study_room_invites
FOR UPDATE
TO authenticated
USING (auth.uid() = invitee_id)
WITH CHECK (
  auth.uid() = invitee_id
  AND room_id = (SELECT room_id FROM public.study_room_invites WHERE id = study_room_invites.id)
  AND inviter_id = (SELECT inviter_id FROM public.study_room_invites WHERE id = study_room_invites.id)
  AND invitee_id = (SELECT invitee_id FROM public.study_room_invites WHERE id = study_room_invites.id)
  AND status IN ('accepted', 'rejected')
);

-- Fix 4: Realtime channel authorization for messages and friend_requests
-- Restrict realtime topic subscriptions so users only receive their own private events.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read own message topics" ON realtime.messages;
CREATE POLICY "Authenticated users read own message topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only topic subscriptions scoped to the current user's UID
  -- Topics should be named like 'user:<uid>' on the client to receive private events.
  realtime.topic() LIKE 'user:' || auth.uid()::text || '%'
  OR realtime.topic() LIKE 'room:%'
);
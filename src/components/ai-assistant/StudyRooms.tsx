import { useState, useEffect } from 'react';
import { Users, Plus, Lock, Unlock, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { StudyRoomChat } from './StudyRoomChat';

interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  is_private: boolean;
  max_members: number;
  created_by: string;
  member_count?: number;
}

interface StudyRoomsProps {
  userId: string;
}

export function StudyRooms({ userId }: StudyRoomsProps) {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, [userId]);

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('study_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('study_room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          return { ...room, member_count: count || 0 };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    setIsCreating(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .insert({
          name: newRoomName,
          subject: newRoomSubject || null,
          description: newRoomDescription || null,
          created_by: userId,
          is_private: false
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Join as member
      const { error: memberError } = await supabase
        .from('study_room_members')
        .insert({
          room_id: room.id,
          user_id: userId,
          role: 'admin'
        });

      if (memberError) throw memberError;

      toast({ title: "Room created!", description: `"${newRoomName}" is ready for collaboration` });
      setNewRoomName('');
      setNewRoomSubject('');
      setNewRoomDescription('');
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Failed to create room",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (room: StudyRoom) => {
    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('study_room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single();

      if (!existingMember) {
        const { error } = await supabase
          .from('study_room_members')
          .insert({
            room_id: room.id,
            user_id: userId,
            role: 'member'
          });

        if (error) throw error;
        toast({ title: "Joined room!", description: `Welcome to "${room.name}"` });
      }

      setSelectedRoom(room);
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Failed to join room",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  if (selectedRoom) {
    return (
      <StudyRoomChat
        room={selectedRoom}
        userId={userId}
        onBack={() => {
          setSelectedRoom(null);
          fetchRooms();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Group Study Rooms</h3>
          <p className="text-sm text-muted-foreground">Join rooms to collaborate with peers</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Room Name *</label>
                <Input
                  placeholder="e.g., Physics Study Group"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="e.g., Physics, Mathematics"
                  value={newRoomSubject}
                  onChange={(e) => setNewRoomSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Input
                  placeholder="What will you study here?"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full gradient-primary"
                onClick={createRoom}
                disabled={!newRoomName.trim() || isCreating}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Room'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No study rooms yet</p>
          <p className="text-sm text-muted-foreground">Create the first room to start collaborating!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="hover:shadow-soft transition-all cursor-pointer card-interactive"
              onClick={() => joinRoom(room)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{room.name}</CardTitle>
                  {room.is_private ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Unlock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {room.subject && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-2 inline-block">
                    {room.subject}
                  </span>
                )}
                {room.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {room.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{room.member_count}/{room.max_members}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <MessageSquare className="w-4 h-4" />
                    <span>Join</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

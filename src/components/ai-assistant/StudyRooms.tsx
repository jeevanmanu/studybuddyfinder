import { useState, useEffect } from 'react';
import { Users, Plus, Lock, Unlock, MessageSquare, Loader2, UserPlus, Search, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useFriendRequests } from '@/hooks/useFriendRequests';
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

interface Friend {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subjects: string[] | null;
}

interface StudyRoomsProps {
  userId: string;
}

export function StudyRooms({ userId }: StudyRoomsProps) {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [suggestedRooms, setSuggestedRooms] = useState<StudyRoom[]>([]);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { friends } = useFriendRequests();

  useEffect(() => {
    fetchRooms();
    fetchFriends();
    fetchSuggestedRooms();
  }, [userId, friends]);

  const fetchRooms = async () => {
    try {
      // Get rooms user is a member of
      const { data: memberRooms } = await supabase
        .from('study_room_members')
        .select('room_id')
        .eq('user_id', userId);

      const roomIds = memberRooms?.map(m => m.room_id) || [];

      if (roomIds.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const { data: roomsData, error } = await supabase
        .from('study_rooms')
        .select('*')
        .in('id', roomIds)
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

  const fetchFriends = async () => {
    if (friends.length === 0) {
      setFriendsList([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, subjects')
      .in('user_id', friends);

    setFriendsList((data || []).map(p => ({ 
      id: p.user_id, 
      full_name: p.full_name, 
      avatar_url: p.avatar_url,
      subjects: p.subjects 
    })));
  };

  const fetchSuggestedRooms = async () => {
    try {
      // Get user's subjects
      const { data: profile } = await supabase
        .from('profiles')
        .select('subjects')
        .eq('user_id', userId)
        .single();

      const userSubjects = profile?.subjects || [];

      if (userSubjects.length === 0) {
        // Show all public rooms if no subjects set
        const { data: publicRooms } = await supabase
          .from('study_rooms')
          .select('*')
          .eq('is_private', false)
          .limit(5);
        
        const roomsWithCounts = await Promise.all(
          (publicRooms || []).map(async (room) => {
            const { count } = await supabase
              .from('study_room_members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);
            return { ...room, member_count: count || 0 };
          })
        );
        setSuggestedRooms(roomsWithCounts);
        return;
      }

      // Find rooms with matching subjects
      const { data: matchingRooms } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('is_private', false)
        .in('subject', userSubjects)
        .limit(5);

      const roomsWithCounts = await Promise.all(
        (matchingRooms || []).map(async (room) => {
          const { count } = await supabase
            .from('study_room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          return { ...room, member_count: count || 0 };
        })
      );

      setSuggestedRooms(roomsWithCounts);
    } catch (error) {
      console.error('Error fetching suggested rooms:', error);
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
          is_private: selectedFriends.length > 0
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Join as admin
      await supabase
        .from('study_room_members')
        .insert({
          room_id: room.id,
          user_id: userId,
          role: 'admin'
        });

      // Invite selected friends
      if (selectedFriends.length > 0) {
        const invites = selectedFriends.map(friendId => ({
          room_id: room.id,
          inviter_id: userId,
          invitee_id: friendId,
          status: 'pending'
        }));
        await supabase.from('study_room_invites').insert(invites);
      }

      toast({ 
        title: "Room created!", 
        description: selectedFriends.length > 0 
          ? `Invited ${selectedFriends.length} friend(s) to "${newRoomName}"` 
          : `"${newRoomName}" is ready for collaboration` 
      });
      
      setNewRoomName('');
      setNewRoomSubject('');
      setNewRoomDescription('');
      setSelectedFriends([]);
      setCreateDialogOpen(false);
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

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
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
          <h3 className="font-semibold text-lg">Study Rooms</h3>
          <p className="text-sm text-muted-foreground">Collaborate with your study buddies</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
              
              {friendsList.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    Invite Friends ({selectedFriends.length} selected)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {friendsList.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => toggleFriendSelection(friend.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedFriends.includes(friend.id) 
                            ? 'bg-primary/10 border border-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{friend.full_name || 'Anonymous'}</p>
                          {friend.subjects && friend.subjects.length > 0 && (
                            <p className="text-xs text-muted-foreground">{friend.subjects.slice(0, 2).join(', ')}</p>
                          )}
                        </div>
                        {selectedFriends.includes(friend.id) && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      <Tabs defaultValue="my-rooms" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
          <TabsTrigger value="suggested">Suggested</TabsTrigger>
        </TabsList>

        <TabsContent value="my-rooms" className="mt-4">
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No study rooms yet</p>
              <p className="text-sm text-muted-foreground">Create a room and invite your study buddies!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="hover:shadow-soft transition-all cursor-pointer card-interactive"
                  onClick={() => setSelectedRoom(room)}
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
                      <Badge variant="secondary" className="mb-2">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {room.subject}
                      </Badge>
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
                        <span>Open</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="mt-4">
          {suggestedRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No suggested rooms</p>
              <p className="text-sm text-muted-foreground">Add subjects to your profile to get recommendations</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Rooms matching your study subjects
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-soft transition-all cursor-pointer card-interactive"
                    onClick={() => joinRoom(room)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{room.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {room.subject && (
                        <Badge variant="outline" className="mb-2 bg-primary/5">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {room.subject}
                        </Badge>
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
                        <Button size="sm" variant="ghost" className="text-primary">
                          Join
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
